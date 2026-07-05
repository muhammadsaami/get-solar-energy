import React, { useRef, useState } from 'react';
import { usePlanning } from '../contexts/PlanningContext';
import RoofSummaryCard from '../components/planning/RoofSummaryCard';
import { MdCloudUpload, MdInfoOutline } from 'react-icons/md';

export default function Roof() {
  const { roofAnalysis, roofLoading, uploadRoofImage, error } = usePlanning();
  const fileInputRef = useRef(null);
  
  // Form State
  const [selectedFile, setSelectedFile] = useState(null);
  const [lengthFt, setLengthFt] = useState('');
  const [widthFt, setWidthFt] = useState('');
  const [city, setCity] = useState('');
  const [validationError, setValidationError] = useState('');
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    setValidationError('');
    const ext = file.name.split('.').pop().toLowerCase();
    if (!['jpg', 'jpeg', 'png'].includes(ext)) {
      setValidationError('Unsupported format. Please upload JPG or PNG.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setValidationError('File size exceeds 5MB limit.');
      return;
    }
    setSelectedFile(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (!selectedFile) {
      setValidationError('Rooftop image file is required.');
      return;
    }
    const len = parseFloat(lengthFt);
    const wid = parseFloat(widthFt);

    if (isNaN(len) || len <= 0) {
      setValidationError('Please enter a positive value for Roof Length.');
      return;
    }
    if (isNaN(wid) || wid <= 0) {
      setValidationError('Please enter a positive value for Roof Width.');
      return;
    }
    if (!city.trim()) {
      setValidationError('City name is required.');
      return;
    }

    const res = await uploadRoofImage(selectedFile, len, wid, city.trim());
    if (res.success) {
      setSelectedFile(null);
      setLengthFt('');
      setWidthFt('');
      setCity('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '30px', maxWidth: '900px', margin: '0 auto' }}>
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: '900', margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
          My Roof suitability
        </h1>
        <p style={{ fontSize: '15px', color: 'var(--text-secondary)', margin: 0 }}>
          Detailed satellite evaluations mapping usable space, slope orientations, and shading profiles.
        </p>
      </div>

      {(error || validationError) && (
        <div style={{
          padding: '15px',
          background: 'rgba(244,63,94,0.1)',
          border: '1px solid rgba(244,63,94,0.2)',
          color: '#f43f5e',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '700',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <MdInfoOutline style={{ fontSize: '18px' }} />
          {validationError || error}
        </div>
      )}

      {/* Roof Sizing Form card */}
      <div className="glass-card" style={{
        padding: '30px',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        background: 'rgba(8, 24, 42, 0.72)'
      }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
          
          {/* File drag-drop input zone */}
          <div
            style={{
              padding: '30px',
              border: '1px dashed rgba(255,255,255,0.15)',
              background: dragActive ? 'rgba(23,168,229,0.03)' : 'rgba(255,255,255,0.02)',
              borderRadius: '12px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: 'none' }}
              onChange={handleChange}
              accept="image/png, image/jpeg, image/jpg"
            />
            <span style={{ fontSize: '32px', display: 'block', marginBottom: '8px' }}>
              <MdCloudUpload style={{ color: 'var(--color-blue)' }} />
            </span>
            <span style={{ fontSize: '14px', fontWeight: '800', display: 'block', marginBottom: '4px' }}>
              {selectedFile ? `Selected: ${selectedFile.name}` : 'Upload Rooftop/Satellite Snapshot'}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Supports JPG, PNG formats up to 5MB
            </span>
          </div>

          {/* Sizing Numeric Fields grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '750', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Roof Length (ft)
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="e.g. 30"
                value={lengthFt}
                onChange={(e) => setLengthFt(e.target.value)}
                style={{
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '750', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                Roof Width (ft)
              </label>
              <input
                type="number"
                step="any"
                required
                placeholder="e.g. 25"
                value={widthFt}
                onChange={(e) => setWidthFt(e.target.value)}
                style={{
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '750', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                City
              </label>
              <input
                type="text"
                required
                placeholder="e.g. New Delhi"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={{
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '8px',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  outline: 'none'
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={roofLoading}
            style={{
              padding: '14px 28px',
              alignSelf: 'flex-start',
              background: 'linear-gradient(135deg, var(--color-orange), #ff9d3d)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(255,138,29,0.15)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'opacity 0.2s ease'
            }}
          >
            {roofLoading ? 'Analyzing Roof...' : 'Analyze Roof'}
          </button>

        </form>
      </div>

      {roofLoading ? (
        <div className="glass-card" style={{ padding: '45px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', background: 'rgba(8, 24, 42, 0.72)' }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <div className="spinner" style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--color-blue)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            Evaluating shading profiles and usable surface calculations with GenAI...
          </div>
        </div>
      ) : roofAnalysis ? (
        <RoofSummaryCard analysis={roofAnalysis} />
      ) : (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: '#475569', border: '1px solid rgba(255,255,255,0.05)' }}>
          Roof suitability analysis pending. Provide rooftop parameters above to evaluate.
        </div>
      )}
    </div>
  );
}
