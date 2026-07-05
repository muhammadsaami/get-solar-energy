import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

function RoofAnalyzer() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [city, setCity] = useState('');
  const isFormValid = file && Number(length) > 0 && Number(width) > 0 && city.trim().length > 0;

  const analyzeRoof = async () => {
    if (!file) { setError('Please select a roof image'); return; }
    setLoading(true);
    setError('');
    
    // Legacy roof upload disabled – the Roof Analyzer page now handles uploads with required fields.
    // dropArea.addEventListener('drop', (e) => {
    //   e.preventDefault();
    //   dropArea.style.borderColor = 'var(--border-color)';
    //   dropArea.style.backgroundColor = 'transparent';
    //   if (e.dataTransfer.files.length > 0) {
    //     // Previously: handleRoofFile(e.dataTransfer.files[0]);
    //   }
    // });

    // fileInput.addEventListener('change', (e) => {
    //   if (e.target.files.length > 0) {
    //     // Previously: handleRoofFile(e.target.files[0]);
    //   }
    // });

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('length_ft', length);
      formData.append('width_ft', width);
      formData.append('city', city);
      
      // Log FormData contents for debugging
      for (const pair of formData.entries()) {
        console.log(pair[0], pair[1]);
      }
      
      const res = await axios.post('http://localhost:8000/api/analyze-roof', formData);
      if (res.data.success) {
        setResult(res.data.data);
      } else {
        setError(res.data.error);
      }
      } catch (err) {
        if (err.response && err.response.status === 422) {
          setError('Please fill out all required fields correctly.');
        } else {
          setError('Analysis failed. Please try again.');
        }
      }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f6fa' }}>
      <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)', padding: '20px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ color: '#27ae60', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>🏠 Roof Analyzer</h1>
        <Link to="/dashboard" style={{ color: 'white', textDecoration: 'none' }}>← Back to Dashboard</Link>
      </div>

      <div style={{ padding: '30px', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', color: '#333' }}>Roof Analyzer Inputs</h2>
          <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])}
            style={{ width: '100%', padding: '15px', border: '2px dashed #ddd', borderRadius: '8px', marginBottom: '15px', cursor: 'pointer' }} />
          <input type="number" placeholder="Roof Length (ft)" value={length}
            onChange={e => setLength(e.target.value)} min="0"
            style={{ width: '100%', padding: '12px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '6px' }} />
          <input type="number" placeholder="Roof Width (ft)" value={width}
            onChange={e => setWidth(e.target.value)} min="0"
            style={{ width: '100%', padding: '12px', marginBottom: '10px', border: '1px solid #ddd', borderRadius: '6px' }} />
          <input type="text" placeholder="City" value={city}
            onChange={e => setCity(e.target.value)}
            style={{ width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '6px' }} />
          {file && <p style={{ color: '#27ae60', marginBottom: '15px' }}>✓ Selected: {file.name}</p>}
          {error && <p style={{ color: '#e74c3c', marginBottom: '15px' }}>{error}</p>}
          <button onClick={analyzeRoof} disabled={!isFormValid || loading}
            style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #27ae60, #2ecc71)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
            {loading ? '🔄 Analyzing Roof...' : '🏠 Analyze Roof'}
          </button>
        </div>

        {result && (
          <div style={{ background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px', color: '#27ae60' }}>✅ Roof Analysis Result</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
              [
                { label: 'Solar Readiness Score', value: `${result.solar_readiness_score ?? result.solarPotential ?? ''}%`, icon: '⚡' },
                { label: 'Usable Roof Area', value: `${result.usable_roof_area_sqft ?? result.roofAreaSqFt ?? ''} sq ft`, icon: '📐' },
                { label: 'Shade Factor', value: `${result.shade_factor ?? result.shadingIssues ?? ''}`, icon: '🌥️' },
                { label: 'Recommended System Size', value: `${result.recommended_system_size_kw ?? result.systemSizeKw ?? ''} kW`, icon: '🏡' },
                { label: 'Panel Layout', value: result.panel_layout ?? `${result.panelRows ?? ''}x${result.panelsPerRow ?? ''}`, icon: '🔲' },
                { label: 'Mounting Legs', value: result.mounting_legs ?? result.totalLegs ?? '', icon: '🔧' },
                { label: 'Monthly Generation', value: `${result.monthly_generation_kwh ?? result.monthlyGenerationUnits ?? ''} kWh`, icon: '📅' },
                { label: 'Annual Generation', value: `${result.annual_generation_kwh ?? result.annualGenerationUnits ?? ''} kWh`, icon: '📈' },
                { label: 'Analysis Notes', value: result.analysis_notes ?? result.analysisNotes ?? '', icon: '📝' },
              ].map((item, i) => (
                <div key={i} style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '20px' }}>{item.icon}</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#333' }}>{item.value}</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>{item.label}</div>
                </div>
              ))
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default RoofAnalyzer;