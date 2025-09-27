import React, { useState, useCallback } from 'react';

const UploadIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>;
const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const LoaderIcon = () => <svg className="loader-icon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
const AlertTriangleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>;
const TableIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18"></path><rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="M3 10h18"></path><path d="M3 16h18"></path></svg>;

export default function App() {
  const [file, setFile] = useState(null);
  const [question, setQuestion] = useState("");
  const [response, setResponse] = useState(null);
  const [status, setStatus] = useState({ loading: false, error: null, success: null });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls'))) {
      setFile(selectedFile);
      setStatus({ loading: false, error: null, success: null });
    } else {
      setStatus({ loading: false, error: "Please select a valid Excel file (.xlsx or .xls).", success: null });
    }
  };

  const handleUpload = useCallback(async () => {
    if (!file) {
      setStatus({ loading: false, error: "No file selected to upload.", success: null });
      return;
    }
    setStatus({ loading: true, error: null, success: null });
    setResponse(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upload failed");
      
      setStatus({ loading: false, error: null, success: `Successfully processed: ${Object.keys(data.processed_tables).length} sheet(s). You can now ask questions.` });
    } catch (err) {
      setStatus({ loading: false, error: `Upload Error: ${err.message}`, success: null });
    }
  }, [file]);

  const handleAsk = async () => {
    if (!question.trim()) {
      setStatus({ ...status, error: "Please enter a question." });
      return;
    }
    setStatus({ loading: true, error: null, success: status.success });
    setResponse(null);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to get answer.");
      
      setResponse(data);
      setStatus({ loading: false, error: null, success: status.success });
    } catch (err) {
      setStatus({ loading: false, error: `Analysis Error: ${err.message}`, success: status.success });
    }
  };

  return (
    <>
      <style>{`
        :root { --bg: #0B1120; --card-bg: #171F2E; --border: #2A3346; --text: #E2E8F0; --text-light: #94A3B8; --accent: #818CF8; --accent-hover: #6366F1; --success: #34D399; --error: #F87171; }
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: var(--bg); color: var(--text); }
        .app-container { max-width: 900px; margin: 2rem auto; padding: 2rem; display: flex; flex-direction: column; gap: 2rem; }
        .header { text-align: center; }
        .header h1 { font-size: 2.5rem; color: var(--accent); margin: 0; }
        .card { background-color: var(--card-bg); border: 1px solid var(--border); border-radius: 0.75rem; padding: 1.5rem; }
        .file-upload-area { text-align: center; border: 2px dashed var(--border); padding: 2rem; border-radius: 0.5rem; }
        .file-upload-area p { margin: 1rem 0; color: var(--text-light); }
        .file-upload-area button { background-color: var(--accent); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; transition: background-color 0.2s; }
        .file-upload-area button:hover { background-color: var(--accent-hover); }
        .input-group { display: flex; gap: 0.5rem; }
        .input-group input { flex-grow: 1; background: var(--bg); border: 1px solid var(--border); color: var(--text); padding: 0.75rem; border-radius: 0.5rem; }
        .input-group button { background-color: var(--accent); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.5rem; cursor: pointer; }
        .status-box { padding: 1rem; border-radius: 0.5rem; display: flex; align-items: center; gap: 0.5rem; }
        .status-box.loading { color: #A78BFA; }
        .status-box.error { background-color: rgba(248, 113, 113, 0.1); color: var(--error); }
        .status-box.success { background-color: rgba(52, 211, 153, 0.1); color: var(--success); }
        .response-area h3 { border-bottom: 1px solid var(--border); padding-bottom: 0.5rem; }
        .data-table { width: 100%; border-collapse: collapse; }
        .data-table th, .data-table td { padding: 0.5rem; text-align: left; border-bottom: 1px solid var(--border); }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loader-icon { animation: spin 1s linear infinite; }
      `}</style>
      <div className="app-container">
        <header className="header">
          <h1>AI Data Agent</h1>
          <p>Upload an Excel file and ask questions about your data.</p>
        </header>

        <section className="card">
          <h2>1. Upload Your Data</h2>
          <div className="file-upload-area">
            <UploadIcon />
            <p>{file ? `Selected: ${file.name}` : "Drag & drop or click to select an Excel file"}</p>
            <input type="file" id="file-upload" accept=".xlsx, .xls" onChange={handleFileChange} style={{ display: 'none' }} />
            <button onClick={() => document.getElementById('file-upload').click()}>Choose File</button>
          </div>
          {file && (
            <div className="input-group" style={{ marginTop: '1rem' }}>
              <button onClick={handleUpload} disabled={status.loading} style={{ width: '100%' }}>
                {status.loading && !response ? <LoaderIcon /> : 'Process File'}
              </button>
            </div>
          )}
        </section>

        {(status.error || status.success) && (
            <div className={`status-box ${status.error ? 'error' : 'success'}`}>
                {status.error ? <AlertTriangleIcon /> : <CheckCircleIcon />}
                <span>{status.error || status.success}</span>
            </div>
        )}

        {status.success && (
          <section className="card">
            <h2>2. Ask a Question</h2>
            <div className="input-group">
              <input 
                type="text" 
                placeholder="e.g., 'What is the total sales per country?'" 
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
                disabled={status.loading}
              />
              <button onClick={handleAsk} disabled={status.loading}>
                {status.loading ? <LoaderIcon /> : 'Ask'}
              </button>
            </div>
          </section>
        )}
        
        {response && (
          <section className="card response-area">
            <h3>Answer</h3>
            <p>{response.answer}</p>
            
            {response.table && response.table.length > 0 && (
                <>
                    <h3>Data Table</h3>
                    <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>{Object.keys(response.table[0]).map(key => <th key={key}>{key}</th>)}</tr>
                            </thead>
                            <tbody>
                                {response.table.map((row, i) => (
                                    <tr key={i}>{Object.values(row).map((val, j) => <td key={j}>{String(val)}</td>)}</tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
          </section>
        )}
      </div>
    </>
  );
}
