import React, { useState, useRef } from 'react';

const PHOTO_CATEGORIES = [
  { value: 'all', label: 'All', icon: 'icon-camera' },
  { value: 'roof', label: 'Roof', icon: 'icon-roof' },
  { value: 'panels', label: 'Panels Area', icon: 'icon-layout-dashboard' },
  { value: 'electrical_panel', label: 'Electrical Panel', icon: 'icon-energy-production' },
  { value: 'meter', label: 'Meter', icon: 'icon-electricity-consumption' },
  { value: 'structure', label: 'Structure', icon: 'icon-wrench' },
  { value: 'obstacles', label: 'Obstacles', icon: 'icon-alert-triangle' },
  { value: 'shading', label: 'Shading', icon: 'icon-alert-triangle' },
  { value: 'access', label: 'Access Path', icon: 'icon-route' },
  { value: 'other', label: 'Other', icon: 'icon-camera' },
];

const MOCK_PHOTOS = [
  { id: 1, file_name: 'roof_overview.jpg', photo_category: 'roof', caption: 'South-facing roof section', timestamp: '2026-07-28 10:30', file_size: 2048 },
  { id: 2, file_name: 'electrical_panel.jpg', photo_category: 'electrical_panel', caption: 'Main electrical panel location', timestamp: '2026-07-28 10:45', file_size: 1536 },
  { id: 3, file_name: 'obstacle_ac.jpg', photo_category: 'obstacles', caption: 'AC unit on north-east corner', timestamp: '2026-07-28 11:00', file_size: 1800 },
];

export default function PhotoGallery({ surveyId, photos: externalPhotos, onAddPhoto, onDeletePhoto }) {
  const [photos, setPhotos] = useState(externalPhotos || MOCK_PHOTOS);
  const [dragActive, setDragActive] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const fileInputRef = useRef(null);

  const handleDrag = (e) => { e.preventDefault(); e.stopPropagation(); if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true); else if (e.type === 'dragleave') setDragActive(false); };

  const handleDrop = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); if (e.dataTransfer.files?.length > 0) handleFiles(e.dataTransfer.files); };

  const handleFileSelect = (e) => { if (e.target.files?.length > 0) handleFiles(e.target.files); };

  const handleFiles = (files) => {
    Array.from(files).forEach((file) => {
      const newPhoto = {
        id: Date.now() + Math.random(),
        file_name: file.name,
        photo_category: selectedCategory === 'all' ? 'other' : selectedCategory,
        caption: file.name,
        timestamp: new Date().toLocaleString('en-IN'),
        file_size: Math.round(file.size / 1024),
        file_path: URL.createObjectURL(file),
      };
      setPhotos(prev => [newPhoto, ...prev]);
      if (onAddPhoto) onAddPhoto(surveyId, newPhoto);
    });
  };

  const handleDelete = (photoId) => { setPhotos(prev => prev.filter(p => p.id !== photoId)); if (onDeletePhoto) onDeletePhoto(photoId); };

  const filteredPhotos = selectedCategory === 'all' ? photos : photos.filter(p => p.photo_category === selectedCategory);
  const categoryCounts = {};
  photos.forEach(p => { categoryCounts[p.photo_category] = (categoryCounts[p.photo_category] || 0) + 1; });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      <div className="card-glass" style={{
        padding: 'var(--space-5)',
        border: `2px dashed ${dragActive ? 'var(--color-orange)' : 'var(--glass-border)'}`,
        background: dragActive ? 'rgba(255,138,29,0.05)' : 'transparent',
        transition: 'all var(--transition-normal)',
        textAlign: 'center', cursor: 'pointer',
      }}
        onDragEnter={handleDrag} onDragOver={handleDrag} onDragLeave={handleDrag} onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter') fileInputRef.current?.click(); }}
        role="button" tabIndex={0} aria-label="Upload photos"
      >
        <input ref={fileInputRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handleFileSelect} aria-hidden="true" />
        <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', background: 'var(--color-orange-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto var(--space-3)' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <use href="#icon-camera" />
          </svg>
        </div>
        <p style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 var(--space-1)' }}>
          Drop photos here or click to browse
        </p>
        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)', margin: 0 }}>Supports JPG, PNG, WEBP &middot; Max 10MB each</p>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        {PHOTO_CATEGORIES.map(cat => (
          <button key={cat.value} type="button"
            onClick={() => setSelectedCategory(cat.value)}
            style={{
              padding: '4px 12px', fontSize: 'var(--font-size-xs)', fontWeight: 600,
              background: selectedCategory === cat.value ? 'var(--color-orange)' : 'var(--bg-tertiary)',
              color: selectedCategory === cat.value ? 'white' : 'var(--text-secondary)',
              border: 'none', borderRadius: 'var(--radius-full)', cursor: 'pointer',
              transition: 'all var(--transition-fast)',
              display: 'flex', alignItems: 'center', gap: 'var(--space-1)',
            }}
            aria-label={`Filter by ${cat.label}`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <use href={`#${cat.icon}`} />
            </svg>
            {cat.label} {cat.value !== 'all' && categoryCounts[cat.value] ? `(${categoryCounts[cat.value]})` : ''}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
          {filteredPhotos.length} photo(s)
        </span>
        <div style={{ display: 'flex', gap: 'var(--space-1)', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)', padding: 2 }}>
          {['grid', 'list'].map(m => (
            <button key={m}
              className={viewMode === m ? 'btn-primary' : 'btn-ghost'}
              onClick={() => setViewMode(m)}
              style={{
                padding: '6px 10px', border: 'none', borderRadius: 'var(--radius-sm)',
                background: viewMode === m ? 'var(--glass-bg)' : 'transparent',
                cursor: 'pointer', color: viewMode === m ? 'var(--text-primary)' : 'var(--text-muted)',
                transition: 'all var(--transition-fast)',
              }}
              aria-label={`${m} view`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {m === 'grid' ? (
                  <><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></>
                ) : (
                  <><line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" /></>
                )}
              </svg>
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
          {filteredPhotos.map((photo) => (
            <div key={photo.id} className="card-glass" style={{
              padding: 'var(--space-2)', position: 'relative', overflow: 'hidden',
              transition: 'all var(--transition-normal)',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--glass-border-active)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.transform = 'none' }}
            >
              <div style={{
                width: '100%', height: 120, borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, var(--bg-tertiary), var(--bg-card))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--space-2)',
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <use href="#icon-camera" />
                </svg>
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {photo.caption || photo.file_name}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{photo.timestamp}</div>
              <button
                onClick={() => handleDelete(photo.id)}
                style={{
                  position: 'absolute', top: 8, right: 8, width: 24, height: 24,
                  borderRadius: 'var(--radius-full)', border: 'none',
                  background: 'rgba(0,0,0,0.5)', color: 'white', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', opacity: 0, transition: 'opacity var(--transition-fast)',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '0'; }}
                aria-label="Delete photo"
              >
                &times;
              </button>
              <div style={{ position: 'absolute', top: 8, left: 8, padding: '2px 8px', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '10px', fontWeight: 600 }}>
                {PHOTO_CATEGORIES.find(c => c.value === photo.photo_category)?.label || photo.photo_category}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          {filteredPhotos.map((photo) => (
            <div key={photo.id} className="card-glass" style={{
              padding: 'var(--space-3) var(--space-4)',
              display: 'grid', gridTemplateColumns: '28px 1fr auto auto',
              gap: 'var(--space-3)', alignItems: 'center',
              transition: 'all var(--transition-fast)',
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--glass-border-active)' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--glass-border)' }}
            >
              <div style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', background: 'var(--color-blue-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <use href="#icon-camera" />
                </svg>
              </div>
              <div>
                <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{photo.caption || photo.file_name}</div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>{photo.timestamp} &middot; {photo.file_size ? `${Math.round(photo.file_size / 1024)} MB` : ''}</div>
              </div>
              <span style={{ fontSize: 'var(--font-size-xs)', padding: '2px 10px', borderRadius: 'var(--radius-full)', background: 'var(--bg-tertiary)', color: 'var(--text-muted)', fontWeight: 500 }}>
                {PHOTO_CATEGORIES.find(c => c.value === photo.photo_category)?.label || photo.photo_category}
              </span>
              <button onClick={() => handleDelete(photo.id)} className="btn btn-ghost btn-xs" style={{ color: 'var(--color-red)' }} aria-label="Delete photo">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}