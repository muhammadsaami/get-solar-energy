import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import BillAnalyzer from './pages/BillAnalyzer';
import RoofAnalyzer from './pages/RoofAnalyzer';
import ROICalculator from './pages/ROICalculator';
import Chat from './pages/Chat';
import Referral from './pages/Referral';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/bill-analyzer" element={<BillAnalyzer />} />
        <Route path="/roof-analyzer" element={<RoofAnalyzer />} />
        <Route path="/roi-calculator" element={<ROICalculator />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/referral" element={<Referral />} />
      </Routes>
    </Router>
  );
}

export default App;