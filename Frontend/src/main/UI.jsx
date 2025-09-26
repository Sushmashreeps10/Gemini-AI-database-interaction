import React, { useState, useEffect } from 'react';

// --- Helper Components (No external libraries needed) ---

// Icon components to avoid dependencies
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const LoaderIcon = () => <svg className="loader-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>;
const ServerCrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>;
const MessageSquareIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>;
const TableIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18"></path><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="M3 10h18"></path><path d="M3 16h18"></path></svg>;
const BarChartIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>;

// Simple Bar Chart component to avoid dependencies
const SimpleBarChart = ({ data }) => {
  if (!data || data.length === 0) return null;
  const maxValue = Math.max(...data.map(d => d.sales));

  return (
    <div className="chart-container">
      {data.map((item, index) => (
        <div key={index} className="chart-bar-wrapper" title={`${item.name}: ${item.sales}`}>
          <div className="chart-bar" style={{ height: `${(item.sales / maxValue) * 100}%` }}></div>
          <span className="chart-label">{item.name}</span>
        </div>
      ))}
    </div>
  );
};


// Main App Component
export default function App() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [tableData, setTableData] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setAnswer("Welcome! Ask a business question like 'What are the sales projections for next quarter?' to get started.");
  }, []);

  // Mock function to simulate an API call
  // --- inside your App component ---

  const handleAsk = async () => {
    if (!question.trim()) return;

    setIsLoading(true);
    setError(null);
    setAnswer("");
    setTableData([]);
    setChartData([]);

    try {
      // ✅ Corrected fetch URL to match FastAPI backend
      const response = await fetch("http://127.0.0.1:8000/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });


      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      setAnswer(data.answer);
      setTableData(data.table || []);
      setChartData(data.chart?.data || []); // chart data structure from backend
    } catch (err) {
      console.error(err);
      setError(
        "It seems we hit a snag. Could you please try rephrasing your question or check the server?"
      );
    } finally {
      setIsLoading(false);
    }
  };


  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleAsk();
  };

  // All CSS is defined here. No need for external stylesheets or build tools.
  const AppStyles = () => (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

      :root {
        --bg-color: #111827;
        --card-bg-color: #1f2937;
        --border-color: #374151;
        --text-color: #d1d5db;
        --text-light-color: #9ca3af;
        --accent-color: #6d28d9;
        --accent-hover-color: #5b21b6;
        --error-color: #be123c;
        --error-bg-color: rgba(159, 18, 57, 0.1);
      }

      .ai-agent-app {
        font-family: 'Inter', sans-serif;
        background-color: var(--bg-color);
        color: var(--text-color);
        min-height: 100vh;
        padding: 2rem;
        display: flex;
        justify-content: center;
        align-items: flex-start;
      }

      .main-container {
        width: 100%;
        max-width: 1024px;
      }
      
      .app-header {
        text-align: center;
        margin-bottom: 2rem;
      }

      .app-header h1 {
        font-size: 2.5rem;
        font-weight: 700;
        background: linear-gradient(to right, #8b5cf6, #3b82f6);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      .app-header p {
        color: var(--text-light-color);
        margin-top: 0.5rem;
      }
      
      .input-wrapper {
        position: relative;
        margin-bottom: 2rem;
      }

      .input-wrapper svg {
        position: absolute;
        left: 1rem;
        top: 50%;
        transform: translateY(-50%);
        color: var(--text-light-color);
      }
      
      .question-input {
        width: 100%;
        padding: 1rem 1rem 1rem 3rem;
        background-color: var(--card-bg-color);
        border: 1px solid var(--border-color);
        border-radius: 9999px;
        color: var(--text-color);
        font-size: 1rem;
        transition: border-color 0.3s, box-shadow 0.3s;
      }

      .question-input:focus {
        outline: none;
        border-color: var(--accent-color);
        box-shadow: 0 0 0 3px rgba(109, 40, 217, 0.5);
      }
      
      .ask-button {
        position: absolute;
        right: 0.5rem;
        top: 50%;
        transform: translateY(-50%);
        padding: 0.6rem 1.5rem;
        background-color: var(--accent-color);
        color: white;
        border: none;
        border-radius: 9999px;
        font-weight: 600;
        cursor: pointer;
        transition: background-color 0.3s;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .ask-button:hover {
        background-color: var(--accent-hover-color);
      }

      .ask-button:disabled {
        background-color: #4b5563;
        cursor: not-allowed;
      }

      .content-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }

      @media (min-width: 1024px) {
        .content-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      .card {
        background-color: var(--card-bg-color);
        border: 1px solid var(--border-color);
        border-radius: 0.75rem;
        padding: 1.5rem;
      }
      
      .full-width-card {
        grid-column: 1 / -1;
      }
      
      .card-header {
        display: flex;
        align-items: center;
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: 1rem;
        color: #a78bfa;
      }

      .card-header svg {
        margin-right: 0.75rem;
      }
      
      .loader-container {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        min-height: 200px;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      .loader-icon {
        animation: spin 1s linear infinite;
        color: var(--accent-color);
        width: 40px;
        height: 40px;
      }
      
      .error-card {
        background-color: var(--error-bg-color);
        border: 1px solid var(--error-color);
        color: #fecdd3;
        display: flex;
        align-items: center;
      }

      .error-card svg {
        color: #fb7185;
        margin-right: 0.75rem;
        flex-shrink: 0;
      }

      .data-table {
        width: 100%;
        border-collapse: collapse;
      }
      .data-table th, .data-table td {
        padding: 0.75rem;
        text-align: left;
        border-bottom: 1px solid var(--border-color);
      }
      .data-table th {
        color: var(--text-light-color);
        text-transform: capitalize;
      }
      .data-table tbody tr:last-child td {
        border-bottom: none;
      }
      .data-table tbody tr:hover {
        background-color: rgba(255, 255, 255, 0.05);
      }

      .chart-container {
        display: flex;
        align-items: flex-end;
        justify-content: space-around;
        height: 250px;
        width: 100%;
        padding: 1rem 0 0 0;
      }
      .chart-bar-wrapper {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-end;
        height: 100%;
      }
      .chart-bar {
        width: 50%;
        background-color: var(--accent-color);
        border-radius: 4px 4px 0 0;
        transition: height 0.5s ease-out, background-color 0.3s;
      }
       .chart-bar-wrapper:hover .chart-bar {
        background-color: var(--accent-hover-color);
       }
      .chart-label {
        margin-top: 0.5rem;
        font-size: 0.75rem;
        color: var(--text-light-color);
      }
    `}</style>
  );

  return (
    <div className="ai-agent-app">
      <AppStyles />
      <div className="main-container">
        <header className="app-header">
          <h1>AI Data Agent</h1>
          <p>Your intelligent assistant for business insights</p>
        </header>

        <div className="input-wrapper">
          <SearchIcon />
          <input
            type="text"
            className="question-input"
            placeholder="e.g., 'Project sales for the next quarter'"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
          <button onClick={handleAsk} className="ask-button" disabled={isLoading}>
            {isLoading ? <LoaderIcon /> : 'Ask'}
          </button>
        </div>

        <main>
          {isLoading && (
            <div className="card loader-container">
              <LoaderIcon />
              <p style={{ marginTop: '1rem' }}>Analyzing data...</p>
            </div>
          )}

          {error && (
            <div className="card error-card">
              <ServerCrashIcon />
              <p>{error}</p>
            </div>
          )}

          {!isLoading && !error && (
            <div className="content-grid">
              {answer && (
                <div className="card full-width-card">
                  <div className="card-header"><MessageSquareIcon /> Response</div>
                  <p>{answer}</p>
                </div>
              )}

              {tableData.length > 0 && (
                <div className="card">
                  <div className="card-header"><TableIcon /> Data Breakdown</div>
                  <table className="data-table">
                    <thead>
                      <tr>{Object.keys(tableData[0]).map(col => <th key={col}>{col}</th>)}</tr>
                    </thead>
                    <tbody>
                      {tableData.map((row, i) => (
                        <tr key={i}>{Object.values(row).map((val, j) => <td key={j}>{val}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {chartData.length > 0 && (
                <div className="card">
                  <div className="card-header"><BarChartIcon /> Sales Performance</div>
                  <SimpleBarChart data={chartData} />
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
