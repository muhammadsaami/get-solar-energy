import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function BillAnalyzer() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyzeBill = async () => {
    if (!file) { setError('Please select a bill image'); return; }
    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await axios.post('http://localhost:8000/api/analyze-bill', formData);
      if (res.data.success) {
        setResult(res.data.data);
      } else {
        setError(res.data.error);
      }
    } catch (err) {
      setError('Analysis failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6fa' }}>
      <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)', padding: '20px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: '#f39c12', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>⚡ Bill Analyzer</h1>
        <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none' }}>← Back to Dashboard</Link>
      </div>

      <div style={{ padding: '30px', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', color: '#333' }}>Upload Electricity Bill</h2>
          <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])}
            style={{ width: '100%', padding: '15px', border: '2px dashed #ddd', borderRadius: '8px', marginBottom: '15px', cursor: 'pointer' }} />
          {file && <p style={{ color: '#27ae60', marginBottom: '15px' }}>✓ Selected: {file.name}</p>}
          {error && <p style={{ color: '#e74c3c', marginBottom: '15px' }}>{error}</p>}
          <button onClick={analyzeBill} disabled={loading}
            style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #f39c12, #e67e22)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
            {loading ? '🔄 Analyzing with AI...' : '⚡ Analyze Bill'}
          </button>
        </div>

        {result && (
          <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', color: '#27ae60' }}>✅ Analysis Result</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
              {[
                { label: 'Customer Name', value: result.customer_name, icon: '👤' },
                { label: 'Billing Period', value: result.billing_period, icon: '📅' },
                { label: 'Monthly Units', value: `${result.monthly_units} kWh`, icon: '⚡' },
                { label: 'Bill Amount', value: `Rs ${result.bill_amount}`, icon: '💰' },
                { label: 'Per Unit Rate', value: `Rs ${result.per_unit_rate}/kWh`, icon: '📊' },
                { label: 'Recommended Solar', value: `${result.recommended_kw} kW`, icon: '☀️' },
                { label: 'Monthly Savings', value: `Rs ${result.monthly_savings_rs}`, icon: '💵' },
                { label: 'Payback Period', value: `${result.payback_years} years`, icon: '📈' },
              ].map((item, i) => (
                <div key={i} style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '20px' }}>{item.icon}</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>{item.value}</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BillAnalyzer;