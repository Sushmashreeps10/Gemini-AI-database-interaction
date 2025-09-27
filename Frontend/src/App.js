import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import UI from "./main/UI";   

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<UI />} />
      </Routes>
    </Router>
  );
}

export default App;
