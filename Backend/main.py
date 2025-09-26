# backend/main.py
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy import create_engine, text
from sqlalchemy.types import Integer, Float, DateTime, String, Boolean
import pandas as pd
import google.generativeai as genai
import os
import json
import logging
import decimal
import datetime
import numpy as np
import re
from typing import Dict
from io import BytesIO
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# -------------------- Logging --------------------
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# -------------------- Config --------------------
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://root:sushma@localhost:3306/pythonproject"
)
GEN_API_KEY = os.getenv("GEN_API_KEY", "AIzaSyDrlydrKYnrUo6766y4MTjZM_tKc9Sjr_Y") # Replace with your key

if not GEN_API_KEY or GEN_API_KEY == "AIzaSyDrlydrKYnrUo6766y4MTjZM_tKc9Sjr_Y":
    logger.warning("GEN_API_KEY not set. LLM calls will fail.")

# -------------------- LLM Setup --------------------
try:
    if GEN_API_KEY:
        genai.configure(api_key=GEN_API_KEY)
        model = genai.GenerativeModel("models/gemini-2.5-flash")
        logger.info("Configured Gemini model.")
    else:
        model = None
        logger.info("No GEN_API_KEY configured; model disabled.")
except Exception as e:
    logger.error(f"LLM initialization error: {e}")
    model = None

# -------------------- DB Setup --------------------
try:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    logger.info("Database connection successful.")
except Exception as e:
    logger.error(f"Database connection failed: {e}")
    engine = None

# -------------------- App & CORS --------------------
app = FastAPI(title="AI Data Agent Backend")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------- Pydantic Models --------------------
class AskRequest(BaseModel):
    question: str

# -------------------- Utilities --------------------
def json_safe(obj):
    if isinstance(obj, (datetime.datetime, datetime.date)): return obj.isoformat()
    if isinstance(obj, decimal.Decimal): return float(obj)
    if isinstance(obj, (np.integer, np.int64)): return int(obj)
    if isinstance(obj, (np.floating, np.float64)): return float(obj)
    if pd.isna(obj): return None
    return obj

def df_to_json_safe(df: pd.DataFrame):
    return json.loads(df.to_json(orient="records", date_format="iso"))

def sanitize_identifier(name: str) -> str:
    s = re.sub(r'\W+', '_', str(name).strip().lower())
    s = re.sub(r'_+', '_', s).strip('_')
    if not s: s = "unnamed"
    if re.match(r'^\d', s): s = "col_" + s
    return s

def infer_sqlalchemy_type(series: pd.Series):
    if series.dropna().empty: return String(255)
    dtype = series.dtype
    if pd.api.types.is_integer_dtype(dtype): return Integer()
    if pd.api.types.is_float_dtype(dtype): return Float()
    if pd.api.types.is_bool_dtype(dtype): return Boolean()
    if pd.api.types.is_datetime64_any_dtype(dtype): return DateTime()
    
    # Fallback for object types that might be convertible
    try:
        if pd.to_numeric(series.dropna()).dtype in ['int64', 'float64']:
            if (pd.to_numeric(series.dropna()) % 1 == 0).all(): return Integer()
            return Float()
    except (ValueError, TypeError): pass
    try:
        pd.to_datetime(series.dropna())
        return DateTime()
    except (ValueError, TypeError): pass
    
    max_len = int(series.astype(str).str.len().max())
    return String(max(255, max_len))

# ✅ FIX #1: ADD THIS MISSING FUNCTION
def llm_complete(prompt: str):
    """Simple LLM wrapper — returns string or an error message."""
    if model is None:
        logger.warning("LLM model not configured; returning placeholder.")
        return "LLM model is not configured."
    try:
        response = model.generate_content(prompt)
        # Clean up response text, removing markdown fences
        clean_text = re.sub(r"```(json|sql)?\n", "", response.text)
        clean_text = re.sub(r"\n```", "", clean_text)
        return clean_text.strip()
    except Exception as e:
        logger.error(f"Error in llm_complete: {e}")
        return f"LLM error: {str(e)}"

# -------------------- Excel Processing Logic --------------------
def process_excel_bytes(file_bytes: bytes, filename: str) -> Dict:
    if not engine:
        raise HTTPException(status_code=500, detail="Database is not connected.")

    try:
        xls = pd.read_excel(BytesIO(file_bytes), sheet_name=None, engine="openpyxl")
    except Exception as e:
        logger.error(f"Error reading Excel file: {e}")
        raise HTTPException(status_code=400, detail=f"Could not read Excel file: {e}")

    created_tables = {}
    upload_prefix = sanitize_identifier(os.path.splitext(filename)[0])

    for sheet_name, df in xls.items():
        if df.empty: continue
        
        sanitized_sheet_name = sanitize_identifier(sheet_name)
        table_name = f"{upload_prefix}__{sanitized_sheet_name}"
        logger.info(f"Processing sheet '{sheet_name}' into table '{table_name}'")

        df = df.copy()
        
        new_columns = [sanitize_identifier(str(col)) if str(col).strip() else f"column_{i+1}" for i, col in enumerate(df.columns)]
        df.columns = new_columns
        
        for col in df.columns:
            # First, attempt to convert to datetime
            df[col] = pd.to_datetime(df[col], errors='ignore')
            # If not datetime, attempt numeric
            if not pd.api.types.is_datetime64_any_dtype(df[col].dtype):
                df[col] = pd.to_numeric(df[col], errors='ignore')
            # Clean strings
            if isinstance(df[col].dtype, object):
                 df[col] = df[col].apply(lambda x: x.strip() if isinstance(x, str) else x)

        df.replace([np.inf, -np.inf], np.nan, inplace=True)

        dtype_map = {col: infer_sqlalchemy_type(df[col]) for col in df.columns}
        
        # ✅ FIX #2: ENSURE THIS DATE CONVERSION IS HERE
        for col in df.select_dtypes(include=['datetime64[ns]']).columns:
            df[col] = df[col].dt.to_pydatetime()
            
        try:
            df.to_sql(name=table_name, con=engine, if_exists='replace', index=False, dtype=dtype_map)
            logger.info(f"Successfully wrote {df.shape[0]} rows to table '{table_name}'.")
            
            samples = df.head(5).where(pd.notnull(df.head(5)), None)
            created_tables[table_name] = {
                "columns": df.columns.tolist(),
                "rowCount": len(df),
                "samples": df_to_json_safe(samples)
            }
        except Exception as e:
            logger.error(f"Database write error for table '{table_name}': {e}")
            created_tables[table_name] = {"error": str(e)}

    return created_tables


# -------------------- API Endpoints --------------------
@app.post("/api/upload")
async def upload_excel(file: UploadFile = File(...)):
    contents = await file.read()
    try:
        processed_data = process_excel_bytes(contents, file.filename)
        return JSONResponse(status_code=200, content={
            "message": "File processed successfully.",
            "processed_tables": processed_data
        })
    except HTTPException as he:
        raise he
    except Exception as e:
        logger.exception(f"Upload failed for {file.filename}")
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {e}")

@app.post("/api/ask")
async def ask(req: AskRequest):
    if not engine or not model:
        raise HTTPException(status_code=503, detail="A core service (DB or LLM) is not available.")
    
    try:
        question = req.question
        logger.info(f"Received question: {question}")
        
        with engine.connect() as conn:
            result = conn.execute(text("SHOW TABLES;"))
            tables = [row[0] for row in result]
            db_schema = {table: pd.read_sql(f"DESCRIBE `{table}`;", conn).to_string() for table in tables}

        sql_prompt = f"""
        Given the database schema below, write a single, safe, and efficient SQL query to answer the user's question.
        Only produce a single SQL query and nothing else. Do not use markdown.
        
        Schema:
        {json.dumps(db_schema, indent=2)}
        
        User Question: "{question}"
        """
        sql_query = llm_complete(sql_prompt)
        
        if "SELECT" not in sql_query.upper():
            raise ValueError("Generated query is not a SELECT statement.")

        with engine.connect() as conn:
            df = pd.read_sql_query(text(sql_query), conn)
        
        result_summary = df_to_json_safe(df.head(50))

        final_prompt = f"""
        You are an expert data analyst. A user asked a question, a SQL query was run, and here is the data returned.
        Provide a concise, natural language answer to the user's original question based on the data.
        
        Original Question: "{question}"
        Data Returned (JSON):
        {json.dumps(result_summary)}
        """
        final_answer_text = llm_complete(final_prompt)
        
        response = {"answer": final_answer_text, "sql": sql_query, "table": result_summary}
        return JSONResponse(content=json_safe(response))

    except Exception as e:
        logger.exception("Error in /api/ask endpoint")
        raise HTTPException(status_code=500, detail=str(e))