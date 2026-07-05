import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function ROICalculator() {
  const [form, setForm] = useState({ monthly_units: '', per_unit_rate: '', recommended_kw: '', city: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const calculateROI = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('http://localhost:8000/api/calculate-roi', {
        monthly_units: parseFloat(form.monthly_units),
        per_unit_rate: parseFloat(form.per_unit_rate),
        recommended_kw: parseFloat(form.recommended_kw),
        city: form.city
      });
      if (res.data.success) {
        setResult(res.data.data);
      } else {
        setError(res.data.error);
      }
    } catch (err) {
      setError('Calculation failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6fa' }}>
      <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)', padding: '20px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: '#2980b9', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>💰 ROI Calculator</h1>
        <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none' }}>← Back to Dashboard</Link>
      </div>

      <div style={{ padding: '30px', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', color: '#333' }}>Enter Your Details</h2>
          {[
            { key: 'monthly_units', label: 'Monthly Units (kWh)', placeholder: 'e.g. 350' },
            { key: 'per_unit_rate', label: 'Per Unit Rate (Rs)', placeholder: 'e.g. 7.5' },
            { key: 'recommended_kw', label: 'Solar System Size (kW)', placeholder: 'e.g. 3' },
            { key: 'city', label: 'City', placeholder: 'e.g. Lucknow' },
          ].map(field => (
            <div key={field.key} style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#555', fontWeight: 'bold' }}>{field.label}</label>
              <input
                type="text"
                placeholder={field.placeholder}
                value={form[field.key]}
                onChange={e => setForm({ ...form, [field.key]: e.target.value })}
                style={{ width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box' }}
              />
            </div>
          ))}
          {error && <p style={{ color: '#e74c3c' }}>{error}</p>}
          <button onClick={calculateROI} disabled={loading}
            style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #2980b9, #3498db)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
            {loading ? '🔄 Calculating...' : '💰 Calculate ROI'}
          </button>
        </div>

        {result && (
          <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', color: '#2980b9' }}>✅ ROI Results</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
              {[
                { label: 'System Cost', value: `Rs ${result.system_cost_rs?.toLocaleString()}`, icon: '💸' },
                { label: 'Monthly Generation', value: `${result.monthly_generation_units} units`, icon: '⚡' },
                { label: 'Monthly Savings', value: `Rs ${result.monthly_savings_rs?.toLocaleString()}`, icon: '💰' },
                { label: 'Annual Savings', value: `Rs ${result.annual_savings_rs?.toLocaleString()}`, icon: '📈' },
                { label: 'Payback Period', value: `${result.payback_years} years`, icon: '⏳' },
                { label: '25 Year Savings', value: `Rs ${result.savings_25_years_rs?.toLocaleString()}`, icon: '🏆' },
                { label: 'CO2 Saved/Year', value: `${result.co2_saved_kg_per_year} kg`, icon: '🌱' },
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

export default ROICalculator;