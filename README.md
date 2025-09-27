# Gemini-AI-database-interaction.
The AI Data Agent is a web application that transforms how users interact with their data. It allows anyone to upload an Excel spreadsheet, and then ask complex questions about that data in plain English. The application leverages a powerful AI model to understand the user's intent, query the data, and provide clear, insightful answers, effectively turning any spreadsheet into an interactive database.

Core Features
Excel File Upload: A user-friendly interface to upload any Excel file (.xlsx, .xls).

Automated Data Cleaning & Ingestion: The Python backend automatically processes each sheet in the uploaded file. It sanitizes table and column names, handles messy data (like unnamed columns), and intelligently infers data types (numbers, dates, text) before saving the data into a structured SQL database.

Natural Language Querying: Users can ask questions in conversational language (e.g., "What were the total sales last quarter?" or "Who are the top 5 employees by performance?").

AI-Powered SQL Generation: The backend uses Google's Gemini AI model to analyze the database schema and the user's question, dynamically generating a precise SQL query to retrieve the correct information.

Dynamic Data Response: The application presents the results of the query in a clear, readable table format directly in the user interface.

AI-Generated Summaries: Along with the raw data, the Gemini model provides a concise, natural language summary that directly answers the user's original question.

Tech Stack
Frontend: React.js for a modern, responsive user interface. All components and styling are self-contained within a single file for simplicity.

Backend: Python with the FastAPI framework for creating a high-performance, asynchronous API.

Database: MySQL, managed with SQLAlchemy for robust data storage and interaction.

Data Processing: The Pandas library is used for all data manipulation, cleaning, and preparation tasks.

AI & Language Model: Google's Gemini model (gemini-1.5-flash-latest) for natural language understanding and SQL generation.

How It Works (Application Flow)
Upload: The user selects an Excel file in the React frontend. The file is sent to the /api/upload endpoint on the FastAPI backend.

Process & Store: The backend receives the file, uses Pandas to read and clean every sheet, creates a unique SQL table for each sheet, and inserts the cleaned data.

Ask: The user types a question into the input field, which is sent to the /api/ask endpoint.

Analyze & Query: The backend provides the database schema and the user's question to the Gemini model. The AI returns a precise SQL query.

Execute & Respond: The backend executes this SQL query against the database, retrieves the results into a Pandas DataFrame, and sends the data back to the frontend.

Summarize: The retrieved data is sent back to the Gemini model one last time to generate a human-readable summary, which is also sent to the frontend.

Display: The React frontend displays the AI's summary and the structured data table to the user.


To run Python code - uvicorn main:app --reload

To run ReactJS code - npm start

<img width="1920" height="1079" alt="image" src="https://github.com/user-attachments/assets/964192f2-6844-4e10-8f22-3d4cdd0e6149" />
<img width="1894" height="1077" alt="image" src="https://github.com/user-attachments/assets/ac5672e8-1da6-45a3-9fc0-34f840fd72dc" />


