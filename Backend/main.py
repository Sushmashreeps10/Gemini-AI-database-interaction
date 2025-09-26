# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy import create_engine, text
import pandas as pd
import google.generativeai as genai
import os
import json
import logging
import decimal
import datetime
import numpy as np

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://root:sushma@localhost:3306/pythonproject"
)
GEN_API_KEY = os.getenv("GEN_API_KEY", "AIzaSyDrlydrKYnrUo6766y4MTjZM_tKc9Sjr_Y")

app = FastAPI()

try:
    genai.configure(api_key=GEN_API_KEY)
    model = genai.GenerativeModel("models/gemini-2.5-flash")
    logger.info("Successfully configured Gemini model.")

    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    with engine.connect() as conn:
        logger.info("Database connection successful.")
except Exception as e:
    logger.error(f"Startup failed: {e}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AskRequest(BaseModel):
    question: str

# -------------------- JSON-safe conversion --------------------
def deep_json_safe(obj):
    if isinstance(obj, list):
        return [deep_json_safe(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: deep_json_safe(v) for k, v in obj.items()}
    elif isinstance(obj, decimal.Decimal):
        return float(obj)
    elif isinstance(obj, (datetime.date, datetime.datetime)):
        return obj.isoformat()
    elif isinstance(obj, (np.integer, np.int32, np.int64)):
        return int(obj)
    elif isinstance(obj, (np.floating, np.float32, np.float64)):
        return float(obj)
    elif pd.isna(obj):
        return None
    else:
        return obj

def df_to_json_safe(df: pd.DataFrame):
    return deep_json_safe(df.to_dict(orient="records"))

# -------------------- LLM Helper --------------------
def llm_complete(prompt: str):
    try:
        response = model.generate_content(prompt)
        if response.parts:
            clean_text = response.parts[0].text.strip()
            if clean_text.startswith("```json"):
                clean_text = clean_text.replace("```json\n", "").replace("\n```", "")
            elif clean_text.startswith("```sql"):
                clean_text = clean_text.replace("```sql\n", "").replace("\n```", "")
            return clean_text
        return "No response from LLM."
    except Exception as e:
        logger.error(f"Error in llm_complete: {e}")
        return f"LLM error: {str(e)}"

# -------------------- Schema Helper --------------------
def fetch_schema_metadata(limit_samples=3):
    meta = {}
    try:
        with engine.connect() as conn:
            tables = conn.execute(
                text("SELECT table_name FROM information_schema.tables "
                     "WHERE table_schema=DATABASE() AND table_type='BASE TABLE';")
            ).fetchall()
            for (table_name,) in tables:
                try:
                    rows = conn.execute(
                        text(f"SELECT * FROM `{table_name}` LIMIT :n"), {"n": limit_samples}
                    ).fetchall()
                    if rows:
                        cols = list(rows[0]._mapping.keys())
                        samples = [dict(row._mapping) for row in rows]
                    else:
                        cols, samples = [], []
                    meta[table_name] = {"columns": cols, "samples": samples}
                except Exception as e:
                    logger.error(f"Error fetching table '{table_name}': {e}")
                    meta[table_name] = {"columns": [], "samples": []}
    except Exception as e:
        logger.error(f"Error fetching schema metadata: {e}")
    return meta

def validate_sql(sql: str) -> bool:
    sql_lower = sql.strip().lower()
    forbidden = ["delete", "update", "insert", "drop", "alter", "truncate"]
    return sql_lower.startswith("select") and not any(word in sql_lower for word in forbidden)

# -------------------- Main API --------------------
@app.post("/api/ask")
async def ask(req: AskRequest):
    try:
        question = req.question
        logger.info(f"Received question: {question}")

        schema = fetch_schema_metadata()

        # Generate plan
        plan_prompt = f"""
        You are an expert data analyst. Based on the database schema below and the user's question, create a step-by-step plan to answer the question.
        Produce only JSON with key 'plan'.
        Schema: {json.dumps(schema, indent=2)}
        User Question: "{question}"
        """
        plan_txt = llm_complete(plan_prompt)
        try:
            plan = json.loads(plan_txt)
        except Exception:
            plan = {"plan": plan_txt}

        # Generate SQL
        sql_prompt = f"""
        Based on the database schema and the plan, write a safe SQL SELECT statement.
        Produce only SQL.
        Schema: {json.dumps(schema, indent=2)}
        Plan: {json.dumps(plan)}
        """
        sql = llm_complete(sql_prompt)
        if not validate_sql(sql):
            sql = "SELECT 1;"

        # Execute SQL safely
        try:
            sql_for_exec = sql if "limit" in sql.lower() else sql.strip().rstrip(';') + " LIMIT 1000;"
            df = pd.read_sql_query(sql_for_exec, con=engine)
        except Exception as e:
            logger.error(f"SQL Execution error: {e}")
            df = pd.DataFrame()

        # Generate final answer
        result_summary = df_to_json_safe(df.head(20))
        final_prompt = f"""
        Synthesize a concise answer.
        Original Question: "{question}"
        Execution Plan: {json.dumps(plan)}
        Retrieved Data:
        {json.dumps(result_summary)}
        """
        answer = llm_complete(final_prompt)

        # Return JSON-safe response
        response = {
            "answer": str(answer),
            "sql": str(sql),
            "table": result_summary,
        }
        return JSONResponse(status_code=200, content=deep_json_safe(response))

    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        fallback = {
            "answer": "An error occurred but returning safe JSON.",
            "sql": "",
            "table": [],
            "error": str(e)
        }
        return JSONResponse(status_code=200, content=deep_json_safe(fallback))
