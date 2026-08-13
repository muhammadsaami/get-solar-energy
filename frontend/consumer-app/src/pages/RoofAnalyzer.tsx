import React, { useRef, useEffect } from 'react'
import DashboardSprites from '../components/dashboard/DashboardSprites'
import { useRoofAnalyzer } from '../hooks/useRoofAnalyzer'
import type { RoofAnalysisData } from '../hooks/roofAnalyzer.types'

export default function RoofAnalyzer() {
  const {
    mode,
    cameraFile,
    lengthFt,
    widthFt,
    city,
    isCameraValid,
    searchQuery,
    searchResults,
    isSearching,
    selectedLocation,
    captureData,
    captureStatus,
    isCapturing,
    activeLayer,
    roofUploadState,
    roofProgress,
    roofError,
    analysis,
    mapContainerRef,
    setMode,
    handleCameraFileSelect,
    setLengthFt,
    setWidthFt,
    setCity,
    handleAddressSearch,
    selectAddressResult,
    toggleMapLayer,
    captureSatelliteView,
    triggerCameraAnalysis,
    triggerSatelliteAnalysis,
    retryRoofUpload,
    dismissSearchResults,
  } = useRoofAnalyzer()

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const defaultReadiness = 92
  const defaultArea = '380 sq ft'
  const defaultShade = '8%'
  const defaultSystemSize = '5.2 kW'

  const d: RoofAnalysisData | null = analysis

  // Click outside closes address results (matching legacy behavior)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const wrapper = document.querySelector('.satellite-search-wrapper')
      if (wrapper && !wrapper.contains(e.target as Node)) {
        dismissSearchResults()
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [dismissSearchResults])

  return (
    <>
      <DashboardSprites />
      <div className="ew-page tab-content active" role="tabpanel" aria-label="roof analysis" id="tab-roof-analysis">
        <div className="tab-grid-layout" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
          {/* LEFT COLUMN: Dual Mode Form + Map + Results */}
          <div className="card-glass" style={{ padding: 'var(--space-5)' }}>
            <div className="card-header" style={{ marginBottom: 'var(--space-3)' }}>
              <span className="card-title">Rooftop Structural Assessment</span>
            </div>

            {/* Mode Toggle Pill Strip */}
            <div className="card-glass" style={{ padding: '4px', marginBottom: 'var(--space-4)' }}>
              <div className="ew-nav-pill-bar" role="tablist" aria-label="Analysis mode">
                <button
                  className={`ew-nav-pill ${mode === 'camera' ? 'active' : ''}`}
                  id="roofModeCamera"
                  role="tab"
                  aria-selected={mode === 'camera'}
                  onClick={() => setMode('camera')}
                >
                  Camera Photo Upload
                </button>
                <button
                  className={`ew-nav-pill ${mode === 'satellite' ? 'active' : ''}`}
                  id="roofModeSatellite"
                  role="tab"
                  aria-selected={mode === 'satellite'}
                  onClick={() => setMode('satellite')}
                >
                  Satellite Analysis {mode === 'satellite' && <span className="badge badge-warning badge-sm" id="satelliteBetaBadge" style={{ marginLeft: 6 }}>Beta</span>}
                </button>
              </div>
            </div>

            {/* ======== CAMERA MODE PANEL ======== */}
            <div className={`satellite-panel ${mode === 'camera' ? 'active' : ''}`} id="roofCameraPanel" role="tabpanel">
              <div
                className="form-upload"
                id="roofDragDropArea"
                style={{
                  marginBottom: 'var(--space-4)',
                  cursor: 'pointer',
                  padding: 'var(--space-6)',
                  borderRadius: 'var(--radius-md)',
                  border: '1.5px dashed var(--border-color)',
                  background: 'var(--bg-input)',
                  textAlign: 'center',
                  transition: 'all var(--transition-fast)',
                }}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--color-green)'; e.currentTarget.style.backgroundColor = 'rgba(54,211,153,0.08)' }}
                onDragLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.backgroundColor = 'var(--bg-input)' }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.currentTarget.style.borderColor = 'var(--border-color)'
                  e.currentTarget.style.backgroundColor = 'var(--bg-input)'
                  if (e.dataTransfer.files.length > 0) handleCameraFileSelect(e.dataTransfer.files[0])
                }}
              >
                <svg style={{ width: '36px', height: '36px', stroke: 'var(--color-green)', fill: 'none', strokeWidth: '1.5', margin: '0 auto var(--space-2)' }} viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                {cameraFile ? (
                  <span style={{ color: 'var(--color-green)', fontWeight: 700, display: 'block', fontSize: '13px' }}>✓ {cameraFile.name}</span>
                ) : (
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600, display: 'block', fontSize: '13px' }}>
                    Drag &amp; drop rooftop photograph here, or <span style={{ color: 'var(--color-blue)', textDecoration: 'underline' }}>browse file</span>
                  </span>
                )}
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>Supports PNG, JPG, JPEG up to 10MB</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  id="roofFileInput"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => { if (e.target.files?.length) handleCameraFileSelect(e.target.files[0]) }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label htmlFor="roofLengthInput" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>Roof Length (ft) *</label>
                  <input
                    type="number"
                    id="roofLengthInput"
                    min="0.1"
                    step="0.1"
                    placeholder="e.g. 40"
                    value={lengthFt}
                    onChange={(e) => setLengthFt(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '12px' }}
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label htmlFor="roofWidthInput" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>Roof Width (ft) *</label>
                  <input
                    type="number"
                    id="roofWidthInput"
                    min="0.1"
                    step="0.1"
                    placeholder="e.g. 30"
                    value={widthFt}
                    onChange={(e) => setWidthFt(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '12px' }}
                  />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label htmlFor="roofCityInput" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>Installation City *</label>
                  <input
                    type="text"
                    id="roofCityInput"
                    placeholder="e.g. Mumbai, Jaipur, Bangalore"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '12px' }}
                  />
                </div>
              </div>

              <button
                className={`btn btn-primary${roofUploadState === 'uploading' ? ' loading' : ''}`}
                id="roofAnalyzeBtn"
                disabled={!isCameraValid || roofUploadState === 'uploading'}
                onClick={triggerCameraAnalysis}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  opacity: isCameraValid ? 1 : 0.45,
                  cursor: isCameraValid ? 'pointer' : 'not-allowed',
                }}
              >
                {roofUploadState === 'uploading' ? 'Analyzing Roof Geometry...' : 'Analyze Rooftop Geometry'}
              </button>
            </div>

            {/* ======== SATELLITE MODE PANEL ======== */}
            <div className={`satellite-panel ${mode === 'satellite' ? 'active' : ''}`} id="roofSatellitePanel" role="tabpanel">
              {/* Beta Banner */}
              <div style={{ padding: '8px 12px', borderRadius: '6px', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)', marginBottom: 'var(--space-3)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="badge badge-warning badge-sm">Beta</span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  Satellite imagery estimate. An on-site engineering check will confirm precision measurements.
                </span>
              </div>

              {/* Three-Step Workflow Indicator */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-3)', padding: '6px 10px', background: 'var(--bg-input)', borderRadius: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', fontWeight: 700, color: selectedLocation ? 'var(--color-green)' : 'var(--color-cyan)' }}>
                  <span style={{ width: 18, height: 18, borderRadius: '50%', background: selectedLocation ? 'var(--color-green)' : 'var(--color-cyan)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>1</span>
                  <span>Search</span>
                </div>
                <span style={{ color: 'var(--border-color)' }}>──</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', fontWeight: 700, color: captureData ? 'var(--color-green)' : selectedLocation ? 'var(--color-cyan)' : 'var(--text-muted)' }}>
                  <span style={{ width: 18, height: 18, borderRadius: '50%', background: captureData ? 'var(--color-green)' : selectedLocation ? 'var(--color-cyan)' : 'rgba(255,255,255,0.1)', color: captureData || selectedLocation ? '#000' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>2</span>
                  <span>Capture</span>
                </div>
                <span style={{ color: 'var(--border-color)' }}>──</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', fontWeight: 700, color: analysis ? 'var(--color-green)' : captureData ? 'var(--color-cyan)' : 'var(--text-muted)' }}>
                  <span style={{ width: 18, height: 18, borderRadius: '50%', background: analysis ? 'var(--color-green)' : captureData ? 'var(--color-cyan)' : 'rgba(255,255,255,0.1)', color: analysis || captureData ? '#000' : 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>3</span>
                  <span>Analyze</span>
                </div>
              </div>

              {/* Address Search */}
              <div className="satellite-search-wrapper" style={{ position: 'relative', marginBottom: 'var(--space-3)' }}>
                <input
                  type="text"
                  id="satelliteAddressInput"
                  placeholder="Search residential address or building location..."
                  autoComplete="off"
                  aria-label="Search address"
                  value={searchQuery}
                  onChange={(e) => handleAddressSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchResults.length > 0) {
                      selectAddressResult(searchResults[0])
                    }
                    if (e.key === 'Escape') {
                      dismissSearchResults()
                    }
                  }}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', fontSize: '12px' }}
                />
                {searchResults.length > 0 && (
                  <div className="satellite-address-results" id="satelliteAddressResults" role="listbox" style={{ display: 'block', position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10, background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '6px', marginTop: 4, maxHeight: 180, overflowY: 'auto' }}>
                    {searchResults.map((res, idx) => (
                      <div
                        key={idx}
                        className="satellite-address-result-item"
                        role="option"
                        aria-selected={false}
                        onClick={() => selectAddressResult(res)}
                        style={{ padding: '8px 12px', fontSize: '11px', color: 'var(--text-primary)', cursor: 'pointer', borderBottom: '1px solid var(--border-subtle)' }}
                      >
                        {res.display_name}
                      </div>
                    ))}
                  </div>
                )}
                {isSearching && (
                  <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', paddingLeft: '8px' }}>Searching location...</div>
                )}
              </div>

              <div className="satellite-location-label" id="satelliteLocationLabel" style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
                {selectedLocation ? `Selected: ${selectedLocation.label}` : 'Search for an address to center the map.'}
              </div>

              {/* Map Container */}
              <div className="satellite-map-container" id="satelliteMap" ref={mapContainerRef} style={{ height: '220px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)', marginBottom: 'var(--space-3)' }} />

              {/* Layer Toggle & Capture Button */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 'var(--space-3)' }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    className={`btn btn-ghost btn-sm ${activeLayer === 'street' ? 'active' : ''}`}
                    id="satelliteToggleStreet"
                    aria-pressed={activeLayer === 'street'}
                    onClick={() => toggleMapLayer('street')}
                    style={{ fontSize: '11px', padding: '4px 10px' }}
                  >
                    Street
                  </button>
                  <button
                    className={`btn btn-ghost btn-sm ${activeLayer === 'satellite' ? 'active' : ''}`}
                    id="satelliteToggleSat"
                    aria-pressed={activeLayer === 'satellite'}
                    onClick={() => toggleMapLayer('satellite')}
                    style={{ fontSize: '11px', padding: '4px 10px' }}
                  >
                    Satellite
                  </button>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  id="satelliteCaptureBtn"
                  onClick={captureSatelliteView}
                  aria-label="Capture current map view"
                  disabled={isCapturing}
                  style={{ fontSize: '11px', padding: '5px 12px' }}
                >
                  {isCapturing ? 'Capturing...' : 'Capture Map Frame'}
                </button>
              </div>

              {/* Capture Validation Status */}
              {captureStatus && (
                <div className="satellite-capture-status" id="satelliteCaptureStatus" role="alert" style={{ fontSize: '11px', color: 'var(--color-yellow)', marginBottom: 'var(--space-2)' }}>
                  {captureStatus}
                </div>
              )}

              {/* Analyze Button (satellite mode) */}
              <button
                className={`btn btn-primary${roofUploadState === 'uploading' ? ' loading' : ''}`}
                id="roofAnalyzeBtnSatellite"
                disabled={!captureData || roofUploadState === 'uploading'}
                onClick={triggerSatelliteAnalysis}
                style={{ width: '100%', padding: '10px 16px', fontSize: '12px' }}
              >
                {roofUploadState === 'uploading' ? 'Analyzing Satellite Capture...' : 'Analyze Satellite Photogrammetry'}
              </button>
            </div>

            {/* Shared Progress Bar */}
            <div
              className="scan-progress-bar-wrapper"
              id="roofScanProgressBox"
              style={{
                display: roofUploadState === 'uploading' ? 'block' : 'none',
                marginTop: 'var(--space-3)',
                background: 'var(--bg-input)',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px', color: 'var(--text-primary)' }}>
                <span id="roofScanStatus">{roofProgress.status || 'Analyzing shading & roof azimuth...'}</span>
                <span id="roofScanPercent" style={{ fontWeight: 800, color: 'var(--color-green)' }}>{roofProgress.percent}%</span>
              </div>
              <div style={{ height: '5px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden', width: '100%' }}>
                <div id="roofScanProgressFill" style={{ width: `${roofProgress.percent}%`, height: '100%', background: 'var(--color-green)', transition: 'width 0.1s ease' }} />
              </div>
            </div>

            {/* Shared Error Box */}
            <div
              id="roofAnalysisErrorBox"
              style={{
                display: roofUploadState === 'error' ? 'block' : 'none',
                marginTop: 'var(--space-3)',
                padding: '10px 14px',
                borderRadius: '6px',
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '11px', color: 'var(--color-red)', display: 'block', marginBottom: '8px', fontWeight: 600 }}>
                {roofError || 'Analysis failed. Please check the file format or try again.'}
              </span>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                id="roofAnalysisRetryBtn"
                onClick={retryRoofUpload}
              >
                Retry Upload
              </button>
            </div>

            {/* Shared Analysis Results */}
            {d && (
              <div id="roofAnalysisResults" style={{ display: 'block', marginTop: 'var(--space-4)', borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-3)' }}>
                <div className="card-base" style={{ '--card-theme': '54, 211, 153', marginBottom: 'var(--space-3)', padding: '10px 12px' } as React.CSSProperties}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(54, 211, 153, 0.15)', paddingBottom: '6px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--color-green)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Roof Analytics Snapshot</span>
                    <span id="snapTagBadge" className={`badge badge-sm ${d.satellite_analysis ? 'badge-warning' : 'badge-success'}`}>
                      {d.satellite_analysis ? 'BETA' : 'EXTRACTED'}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', textAlign: 'center' }}>
                    <div>
                      <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Roof Suitability</span>
                      <span style={{ fontSize: '15px', fontWeight: 900, color: 'var(--color-green)', display: 'block', marginTop: '2px' }} id="snapRoofSuitability">{d.suitabilityScore}%</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Recommended Size</span>
                      <span style={{ fontSize: '15px', fontWeight: 900, color: 'var(--color-cyan)', display: 'block', marginTop: '2px' }} id="snapRoofSystemSize">{d.system_size_kw} kW</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Monthly Gen</span>
                      <span style={{ fontSize: '15px', fontWeight: 900, color: 'var(--color-cyan)', display: 'block', marginTop: '2px' }} id="snapRoofMonthlyGen">{d.monthly_generation_units} units</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Number of Panels</span>
                      <span style={{ fontSize: '15px', fontWeight: 900, color: 'var(--color-orange)', display: 'block', marginTop: '2px' }} id="snapRoofPanels">{d.total_panels}</span>
                    </div>
                  </div>
                </div>

                <div className="ew-divider-head">
                  <h3 className="ew-divider-title">Detected Structural Parameters</h3>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', padding: '6px 10px', borderRadius: '4px' }}>
                    <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Roof Area (sqft)</span>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-primary)' }} id="resTotalRoofArea">{d.roof_area_sqft} sq ft</span>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', padding: '6px 10px', borderRadius: '4px' }}>
                    <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Facing Direction</span>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-primary)' }} id="resFacingDirection">{d.facing_direction}</span>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', padding: '6px 10px', borderRadius: '4px' }}>
                    <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Compass Angle</span>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-primary)' }} id="resCompassAngle">{d.compass_angle ? `${d.compass_angle}°` : 'Not Available'}</span>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', padding: '6px 10px', borderRadius: '4px' }}>
                    <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Roof Condition</span>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-primary)' }} id="resRoofCondition">{d.roof_condition}</span>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', padding: '6px 10px', borderRadius: '4px' }}>
                    <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>Solar Potential</span>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-green)' }} id="resSolarPotential">{d.solar_potential}</span>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', padding: '6px 10px', borderRadius: '4px' }}>
                    <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>System Size (kW)</span>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--color-cyan)' }} id="resSystemSizeKw">{d.system_size_kw} kW</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: KPI Cards Stack */}
          <div className="kpis-stack-column" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div className="card-base" style={{ '--card-theme': '54, 211, 153' } as React.CSSProperties}>
              <div className="kpi-header-row">
                <span className="kpi-title">Solar Readiness Score</span>
                <svg className="kpi-title-icon green" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></svg>
              </div>
              <div className="kpi-value-block">
                <span className="kpi-value-text" id="roofTabReadiness">{d ? `${d.suitabilityScore}%` : `${defaultReadiness}%`}</span>
              </div>
              <p className="kpi-card-subdesc" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Azimuth: 180° South (Optimal)</p>
            </div>

            <div className="card-base" style={{ '--card-theme': '23, 168, 229' } as React.CSSProperties}>
              <div className="kpi-header-row">
                <span className="kpi-title">Usable Roof Area</span>
                <svg className="kpi-title-icon blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></svg>
              </div>
              <div className="kpi-value-block">
                <span className="kpi-value-text" id="roofTabArea">{d ? `${d.roof_area_sqft} sq ft` : defaultArea}</span>
              </div>
              <p className="kpi-card-subdesc" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Out of 520 sq ft total area</p>
            </div>

            <div className="card-base" style={{ '--card-theme': '255, 138, 29' } as React.CSSProperties}>
              <div className="kpi-header-row">
                <span className="kpi-title">Shade Factor</span>
                <svg className="kpi-title-icon orange" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
              </div>
              <div className="kpi-value-block">
                <span className="kpi-value-text" id="roofTabShade">{d ? d.shadePercent : defaultShade}</span>
              </div>
              <p className="kpi-card-subdesc" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Minimal shade from surrounding structures</p>
            </div>

            <div className="card-base" style={{ '--card-theme': '23, 168, 229' } as React.CSSProperties}>
              <div className="kpi-header-row">
                <span className="kpi-title">Recommended System Size</span>
                <svg className="kpi-title-icon blue" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
              </div>
              <div className="kpi-value-block">
                <span className="kpi-value-text" id="roofTabSystemSize">{d ? `${d.system_size_kw} kW` : defaultSystemSize}</span>
              </div>
              <p className="kpi-card-subdesc" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Fits 16 high-efficiency panels</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
