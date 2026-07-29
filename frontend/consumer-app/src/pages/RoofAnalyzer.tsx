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
      <div className="tab-content active" role="tabpanel" aria-label="roof analysis" id="tab-roof-analysis">
        <div className="tab-header-block">
          <h2 className="tab-heading">Roof Analysis</h2>
          <p className="tab-subheading">Analyze your rooftop using camera photos or satellite imagery.</p>
        </div>

        <div className="tab-grid-layout" style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: '20px', marginBottom: '20px' }}>
          {/* LEFT COLUMN: Dual Mode Form + Map + Results */}
          <div className="card-glass">
            <div className="card-header">
              <span className="card-title">Roof Assessment</span>
            </div>

            {/* Mode Toggle Pill Strip */}
            <div className="satellite-mode-toggle" role="tablist" aria-label="Analysis mode">
              <button
                className={`btn btn-sm ${mode === 'camera' ? 'btn-primary active' : 'btn-ghost'}`}
                id="roofModeCamera"
                role="tab"
                aria-selected={mode === 'camera'}
                onClick={() => setMode('camera')}
              >
                Camera Upload
              </button>
              <button
                className={`btn btn-sm ${mode === 'satellite' ? 'btn-primary active' : 'btn-ghost'}`}
                id="roofModeSatellite"
                role="tab"
                aria-selected={mode === 'satellite'}
                onClick={() => setMode('satellite')}
              >
                Satellite Analysis {mode === 'satellite' && <span className="badge badge-warning badge-sm" id="satelliteBetaBadge">Beta</span>}
              </button>
            </div>

            {/* ======== CAMERA MODE PANEL ======== */}
            <div className={`satellite-panel ${mode === 'camera' ? 'active' : ''}`} id="roofCameraPanel" role="tabpanel">
              <div
                className="form-upload"
                id="roofDragDropArea"
                style={{ marginBottom: 'var(--space-5)', cursor: 'pointer' }}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--accent-green)'; e.currentTarget.style.backgroundColor = 'rgba(54,211,153,0.08)' }}
                onDragLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.backgroundColor = 'transparent' }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.currentTarget.style.borderColor = 'var(--border-color)'
                  e.currentTarget.style.backgroundColor = 'transparent'
                  if (e.dataTransfer.files.length > 0) handleCameraFileSelect(e.dataTransfer.files[0])
                }}
              >
                <svg className="form-upload-icon" style={{ width: '40px', height: '40px', stroke: 'var(--color-green)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                {cameraFile ? (
                  <span className="form-upload-title" style={{ color: 'var(--accent-green)', fontWeight: '700' }}>✓ {cameraFile.name}</span>
                ) : (
                  <span className="form-upload-title">Drag &amp; drop rooftop image here, or <span className="btn-link">browse</span></span>
                )}
                <span className="form-upload-subtitle">Supports PNG, JPG, JPEG up to 10MB</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  id="roofFileInput"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={(e) => { if (e.target.files?.length) handleCameraFileSelect(e.target.files[0]) }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="form-label form-label-required" htmlFor="roofLengthInput">Roof Length (ft)</label>
                  <input
                    type="number"
                    className="form-input"
                    id="roofLengthInput"
                    min="0.1"
                    step="0.1"
                    placeholder="e.g. 40"
                    value={lengthFt}
                    onChange={(e) => setLengthFt(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label form-label-required" htmlFor="roofWidthInput">Roof Width (ft)</label>
                  <input
                    type="number"
                    className="form-input"
                    id="roofWidthInput"
                    min="0.1"
                    step="0.1"
                    placeholder="e.g. 30"
                    value={widthFt}
                    onChange={(e) => setWidthFt(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label className="form-label form-label-required" htmlFor="roofCityInput">City</label>
                  <input
                    type="text"
                    className="form-input"
                    id="roofCityInput"
                    placeholder="e.g. Mumbai"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
              </div>

              <button
                className={`btn btn-success btn-full${roofUploadState === 'uploading' ? ' loading' : ''}`}
                id="roofAnalyzeBtn"
                disabled={!isCameraValid || roofUploadState === 'uploading'}
                onClick={triggerCameraAnalysis}
                style={{
                  opacity: isCameraValid ? 1 : 0.45,
                  cursor: isCameraValid ? 'pointer' : 'not-allowed',
                  boxShadow: isCameraValid ? '0 4px 18px rgba(54,211,153,0.35)' : 'none',
                }}
              >
                {roofUploadState === 'uploading' ? 'Analyzing Roof...' : 'Analyze Roof'}
              </button>
            </div>

            {/* ======== SATELLITE MODE PANEL ======== */}
            <div className={`satellite-panel ${mode === 'satellite' ? 'active' : ''}`} id="roofSatellitePanel" role="tabpanel">
              {/* Beta Banner */}
              <div className="satellite-beta-banner">
                <span className="badge badge-warning badge-sm">Beta</span>
                <span>Results are estimated from satellite imagery and should be confirmed through an on-site survey before installation or purchasing decisions.</span>
              </div>

              {/* Three-Step Workflow Indicator */}
              <div className="satellite-step-indicator" aria-label="Workflow progress">
                <div className={`satellite-step ${selectedLocation ? 'completed' : 'active'}`} data-step="1">
                  <span className="step-num">1</span>
                  <span>Search</span>
                </div>
                <div className={`satellite-step-connector ${selectedLocation ? 'completed' : ''}`} data-connector="1" />
                <div className={`satellite-step ${captureData ? 'completed' : selectedLocation ? 'active' : ''}`} data-step="2">
                  <span className="step-num">2</span>
                  <span>Capture</span>
                </div>
                <div className={`satellite-step-connector ${captureData ? 'completed' : ''}`} data-connector="2" />
                <div className={`satellite-step ${analysis ? 'completed' : captureData ? 'active' : ''}`} data-step="3">
                  <span className="step-num">3</span>
                  <span>Analyze</span>
                </div>
              </div>

              {/* Address Search */}
              <div className="satellite-search-wrapper">
                <svg className="satellite-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  className="form-input"
                  id="satelliteAddressInput"
                  placeholder="Search address or location..."
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
                />
                {searchResults.length > 0 && (
                  <div className="satellite-address-results" id="satelliteAddressResults" role="listbox" style={{ display: 'block' }}>
                    {searchResults.map((res, idx) => (
                      <div
                        key={idx}
                        className="satellite-address-result-item"
                        role="option"
                        aria-selected={false}
                        onClick={() => selectAddressResult(res)}
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

              <div className="satellite-location-label" id="satelliteLocationLabel">
                {selectedLocation ? `Selected: ${selectedLocation.label}` : 'Search for an address to begin.'}
              </div>

              {/* Map Container */}
              <div className="satellite-map-container" id="satelliteMap" ref={mapContainerRef} />

              {/* Layer Toggle */}
              <div className="satellite-layer-toggle">
                <button
                  className={`btn btn-ghost btn-sm ${activeLayer === 'street' ? 'active' : ''}`}
                  id="satelliteToggleStreet"
                  aria-pressed={activeLayer === 'street'}
                  onClick={() => toggleMapLayer('street')}
                >
                  Street
                </button>
                <button
                  className={`btn btn-ghost btn-sm ${activeLayer === 'satellite' ? 'active' : ''}`}
                  id="satelliteToggleSat"
                  aria-pressed={activeLayer === 'satellite'}
                  onClick={() => toggleMapLayer('satellite')}
                >
                  Satellite
                </button>
              </div>

              {/* Capture Button */}
              <div className="satellite-capture-row">
                <button
                  className="btn btn-primary"
                  id="satelliteCaptureBtn"
                  onClick={captureSatelliteView}
                  aria-label="Capture current map view"
                  disabled={isCapturing}
                >
                  {isCapturing ? 'Capturing...' : 'Capture from Satellite'}
                </button>
              </div>

              {/* Capture Validation Status */}
              {captureStatus && (
                <div className="satellite-capture-status" id="satelliteCaptureStatus" role="alert" style={{ display: 'block' }}>
                  {captureStatus}
                </div>
              )}

              {/* Satellite Preview Card */}
              {captureData && (
                <div className="satellite-preview-card" id="satellitePreviewCard" style={{ display: 'block' }}>
                  <div className="preview-header">
                    <span className="preview-title">Satellite Capture</span>
                    <span className="badge badge-success badge-sm" id="satellitePreviewStatus">Ready for Analysis</span>
                  </div>
                  <div className="preview-body">
                    <div className="preview-thumb-wrap">
                      <img className="preview-thumb" id="satellitePreviewThumb" src={captureData.blobUrl} alt="Satellite capture preview" />
                    </div>
                    <div className="preview-details">
                      <div className="detail-row">
                        <span className="detail-label">Resolution</span>
                        <span className="detail-value" id="satellitePreviewRes">{captureData.resolution}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Captured</span>
                        <span className="detail-value" id="satellitePreviewTime">{captureData.timestamp}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-label">Location</span>
                        <span className="detail-value" id="satellitePreviewLoc">{captureData.locationLabel}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Analyze Button (satellite mode) */}
              <div className="satellite-analyze-area">
                <button
                  className={`btn btn-secondary btn-full${roofUploadState === 'uploading' ? ' loading' : ''}`}
                  id="roofAnalyzeBtnSatellite"
                  disabled={!captureData || roofUploadState === 'uploading'}
                  onClick={triggerSatelliteAnalysis}
                >
                  {roofUploadState === 'uploading' ? 'Analyzing Satellite Capture...' : 'Analyze Satellite Capture'}
                </button>
              </div>
            </div>

            {/* Shared Progress Bar */}
            <div
              className="scan-progress-bar-wrapper"
              id="roofScanProgressBox"
              style={{
                display: roofUploadState === 'uploading' ? 'block' : 'none',
                marginTop: '15px',
                background: 'var(--bg-input)',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
              }}
            >
              <div className="progress-info-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '6px', color: 'var(--text-navy)' }}>
                <span id="roofScanStatus">{roofProgress.status || 'Analyzing shading & roof azimuth...'}</span>
                <span id="roofScanPercent" style={{ fontWeight: '800', color: 'var(--accent-green)' }}>{roofProgress.percent}%</span>
              </div>
              <div className="progress-bar-track" style={{ height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden', width: '100%' }}>
                <div className="progress-bar-fill" id="roofScanProgressFill" style={{ width: `${roofProgress.percent}%`, height: '100%', background: 'var(--accent-green)', transition: 'width 0.1s ease' }} />
              </div>
            </div>

            {/* Shared Error Box */}
            <div
              id="roofAnalysisErrorBox"
              style={{
                display: roofUploadState === 'error' ? 'block' : 'none',
                marginTop: '15px',
                padding: '12px',
                borderRadius: '6px',
                background: 'rgba(231, 76, 60, 0.05)',
                border: '1px dashed rgba(231, 76, 60, 0.25)',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: '11px', color: '#ef4444', display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                {roofError || 'Analysis failed. Please check the file format or try again.'}
              </span>
              <button
                type="button"
                className="calc-btn"
                id="roofAnalysisRetryBtn"
                onClick={retryRoofUpload}
                style={{ margin: '0 auto', width: 'auto', padding: '6px 16px', fontSize: '11px', height: 'auto', borderColor: 'var(--accent-green)', color: 'var(--accent-green)', background: 'transparent' }}
              >
                Retry Upload
              </button>
            </div>

            {/* Shared Analysis Results */}
            {d && (
              <div id="roofAnalysisResults" style={{ display: 'block', marginTop: '15px', borderTop: '1px solid var(--border-color)', paddingTop: '15px' }}>
                <div className="card-base" style={{ '--card-theme': '54, 211, 153', marginBottom: '15px', padding: '12px 14px', background: 'rgba(54, 211, 153, 0.04)', border: '1px solid rgba(54, 211, 153, 0.25)' } as React.CSSProperties}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(54, 211, 153, 0.15)', paddingBottom: '6px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Roof Analytics Snapshot</span>
                    <span id="snapTagBadge" style={{ fontSize: '9px', background: d.satellite_analysis ? 'var(--color-yellow)' : 'var(--accent-green)', color: d.satellite_analysis ? '#000' : '#fff', padding: '1px 5px', borderRadius: '3px', fontWeight: '700', fontFamily: "'Outfit', sans-serif" }}>
                      {d.satellite_analysis ? 'BETA' : 'EXTRACTED'}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', textAlign: 'center' }}>
                    <div>
                      <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Roof Suitability</span>
                      <span style={{ fontSize: '16px', fontWeight: '900', color: 'var(--accent-green)', display: 'block', marginTop: '2px' }} id="snapRoofSuitability">{d.suitabilityScore}%</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Recommended Size</span>
                      <span style={{ fontSize: '16px', fontWeight: '900', color: 'var(--accent-blue)', display: 'block', marginTop: '2px' }} id="snapRoofSystemSize">{d.system_size_kw} kW</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Monthly Gen</span>
                      <span style={{ fontSize: '16px', fontWeight: '900', color: 'var(--accent-blue)', display: 'block', marginTop: '2px' }} id="snapRoofMonthlyGen">{d.monthly_generation_units} units</span>
                    </div>
                    <div>
                      <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Number of Panels</span>
                      <span style={{ fontSize: '16px', fontWeight: '900', color: 'var(--accent-orange)', display: 'block', marginTop: '2px' }} id="snapRoofPanels">{d.total_panels}</span>
                    </div>
                  </div>
                </div>

                <h3 style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-navy)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <svg style={{ width: '14px', height: '14px', stroke: 'var(--accent-green)', fill: 'none', strokeWidth: '2' }}><polyline points="22 11.08 20 11.08 17 22 12 1 7 22 4 11.08 2 11.08" /></svg>
                  Detected Roof Specifications
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', padding: '6px 10px', borderRadius: '4px' }}>
                    <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Roof Area (sqft)</span>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-navy)' }} id="resTotalRoofArea">{d.roof_area_sqft} sq ft</span>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', padding: '6px 10px', borderRadius: '4px' }}>
                    <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Facing Direction</span>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-navy)' }} id="resFacingDirection">{d.facing_direction}</span>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', padding: '6px 10px', borderRadius: '4px' }}>
                    <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Compass Angle</span>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-navy)' }} id="resCompassAngle">{d.compass_angle ? `${d.compass_angle}°` : 'Not Available'}</span>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', padding: '6px 10px', borderRadius: '4px' }}>
                    <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Roof Condition</span>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-navy)' }} id="resRoofCondition">{d.roof_condition}</span>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', padding: '6px 10px', borderRadius: '4px' }}>
                    <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Roof Type</span>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-navy)' }} id="resRoofType">{d.roof_type}</span>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', padding: '6px 10px', borderRadius: '4px' }}>
                    <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Shading Issues</span>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-navy)' }} id="resRoofShading">{d.shading_issues}</span>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', padding: '6px 10px', borderRadius: '4px' }}>
                    <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Solar Potential</span>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--accent-green)' }} id="resSolarPotential">{d.solar_potential}</span>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', padding: '6px 10px', borderRadius: '4px' }}>
                    <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Obstacles</span>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-navy)' }} id="resObstacles">{d.obstacles}</span>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', padding: '6px 10px', borderRadius: '4px' }}>
                    <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Recommended System</span>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--accent-blue)' }} id="resRoofRecommendedSolarSize">{d.recommended_system}</span>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', padding: '6px 10px', borderRadius: '4px' }}>
                    <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>System Size (kW)</span>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--accent-blue)' }} id="resSystemSizeKw">{d.system_size_kw} kW</span>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', padding: '6px 10px', borderRadius: '4px' }}>
                    <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Total Panels</span>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--accent-blue)' }} id="resRoofNumberOfPanels">{d.total_panels}</span>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', padding: '6px 10px', borderRadius: '4px' }}>
                    <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Panel Layout</span>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-navy)' }} id="resPanelLayout">{`${d.panel_rows} rows × ${d.panels_per_row} per row`}</span>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', padding: '6px 10px', borderRadius: '4px' }}>
                    <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Total Legs</span>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-navy)' }} id="resTotalLegs">{d.total_legs}</span>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', padding: '6px 10px', borderRadius: '4px' }}>
                    <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Front / Back Legs</span>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-navy)' }} id="resFrontBackLegs">{`${d.front_legs}F / ${d.back_legs}B`}</span>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', padding: '6px 10px', borderRadius: '4px' }}>
                    <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Front Leg Height (ft)</span>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-navy)' }} id="resFrontLegHeight">{d.front_leg_height_ft} ft</span>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', padding: '6px 10px', borderRadius: '4px' }}>
                    <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Back Leg Height (ft)</span>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-navy)' }} id="resBackLegHeight">{d.back_leg_height_ft} ft</span>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', padding: '6px 10px', borderRadius: '4px' }}>
                    <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Monthly Generation</span>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--accent-green)' }} id="resRoofMonthlyGeneration">{d.monthly_generation_units} units/month</span>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', padding: '6px 10px', borderRadius: '4px' }}>
                    <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Annual Generation</span>
                    <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--accent-green)' }} id="resAnnualGeneration">{d.annual_generation_units} units/year</span>
                  </div>
                  <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', padding: '6px 10px', borderRadius: '4px', gridColumn: 'span 2' }}>
                    <span style={{ fontSize: '8px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: '700' }}>Analysis Notes</span>
                    <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-navy)', lineHeight: '1.4' }} id="resAnalysisNotes">{d.analysis_notes}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: KPI Cards Stack */}
          <div className="kpis-stack-column" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className="card-base shadow-lift" style={{ '--card-theme': '54, 211, 153' } as React.CSSProperties}>
              <div className="kpi-header-row">
                <span className="kpi-title">Solar Readiness Score</span>
                <svg className="kpi-title-icon green"><use href="#icon-solar-readiness" xlinkHref="#icon-solar-readiness" /></svg>
              </div>
              <div className="kpi-value-block">
                <span className="kpi-value-text" id="roofTabReadiness">{d ? `${d.suitabilityScore}%` : `${defaultReadiness}%`}</span>
              </div>
              <p className="kpi-card-subdesc" style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>Azimuth: 180° South (Optimal)</p>
            </div>

            <div className="card-base shadow-lift" style={{ '--card-theme': '23, 168, 229' } as React.CSSProperties}>
              <div className="kpi-header-row">
                <span className="kpi-title">Usable Roof Area</span>
                <svg className="kpi-title-icon blue"><use href="#icon-roof" xlinkHref="#icon-roof" /></svg>
              </div>
              <div className="kpi-value-block">
                <span className="kpi-value-text" id="roofTabArea">{d ? `${d.roof_area_sqft} sq ft` : defaultArea}</span>
              </div>
              <p className="kpi-card-subdesc" style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>Out of 520 sq ft total area</p>
            </div>

            <div className="card-base shadow-lift" style={{ '--card-theme': '255, 138, 29' } as React.CSSProperties}>
              <div className="kpi-header-row">
                <span className="kpi-title">Shade Factor</span>
                <svg className="kpi-title-icon orange"><use href="#icon-settings" xlinkHref="#icon-settings" /></svg>
              </div>
              <div className="kpi-value-block">
                <span className="kpi-value-text" id="roofTabShade">{d ? d.shadePercent : defaultShade}</span>
              </div>
              <p className="kpi-card-subdesc" style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>Minimal shade from surrounding structures</p>
            </div>

            <div className="card-base shadow-lift" style={{ '--card-theme': '23, 168, 229' } as React.CSSProperties}>
              <div className="kpi-header-row">
                <span className="kpi-title">Recommended System Size</span>
                <svg className="kpi-title-icon blue"><use href="#icon-energy-production" xlinkHref="#icon-energy-production" /></svg>
              </div>
              <div className="kpi-value-block">
                <span className="kpi-value-text" id="roofTabSystemSize">{d ? `${d.system_size_kw} kW` : defaultSystemSize}</span>
              </div>
              <p className="kpi-card-subdesc" style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>Fits 16 high-efficiency panels</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
