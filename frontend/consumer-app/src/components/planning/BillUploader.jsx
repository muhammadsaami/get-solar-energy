import React, { useState, useRef } from 'react';
import { usePlanning } from '../../contexts/PlanningContext';

export default function BillUploader() {
  const { uploadBill } = usePlanning();
  const [dragActive, setDragActive] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const fileInputRef = useRef(null);

  const processFile = async (file) => {
    const fileType = file.name.split('.').pop().toLowerCase();
    if (!['pdf', 'jpg', 'jpeg', 'png'].includes(fileType)) {
      setStatusMessage('Error: Unsupported file type. Please upload PDF, JPG, or PNG.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage('Error: File size exceeds 5MB limit.');
      return;
    }

    setStatusMessage('Uploading...');
    setUploadPercent(10);
    
    // Simulate upload progress
    const interval = setInterval(() => {
      setUploadPercent(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 20;
      });
    }, 150);

    const res = await uploadBill(file);
    clearInterval(interval);
    
    if (res.success) {
      setUploadPercent(100);
      setStatusMessage('Upload Complete! Processing bill intelligence...');
      setTimeout(() => {
        setUploadPercent(0);
        setStatusMessage('');
      }, 2000);
    } else {
      setUploadPercent(0);
      setStatusMessage(`Upload failed: ${res.error}`);
    }
  };

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
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="glass-card" style={{
      padding: '40px',
      border: '1px dashed rgba(255,255,255,0.15)',
      background: dragActive ? 'rgba(255,138,29,0.05)' : 'rgba(8, 24, 42, 0.72)',
      borderRadius: '16px',
      textAlign: 'center',
      cursor: 'pointer',
      transition: 'all var(--duration-fast) var(--ease-standard)'
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
        accept=".pdf,.jpg,.jpeg,.png"
      />
      <div style={{ fontSize: '40px', marginBottom: '15px' }}>📁</div>
      <h3 style={{ fontSize: '18px', fontWeight: '800', margin: '0 0 10px 0' }}>
        Upload Your Electricity Bill
      </h3>
      <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 20px 0' }}>
        Drag and drop your utility bill here, or click to browse (PDF, JPG, PNG up to 5MB)
      </p>

      {uploadPercent > 0 && (
        <div style={{ width: '100%', maxWidth: '300px', margin: '0 auto 15px auto' }}>
          <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${uploadPercent}%`, height: '100%', background: 'var(--color-orange)', transition: 'width 0.15s ease' }} />
          </div>
        </div>
      )}

      {statusMessage && (
        <div style={{
          fontSize: '13px',
          fontWeight: '700',
          color: statusMessage.startsWith('Error') ? '#f43f5e' : 'var(--color-blue)'
        }}>
          {statusMessage}
        </div>
      )}
    </div>
  );
}
