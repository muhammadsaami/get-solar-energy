export type AnalysisMode = 'camera' | 'satellite'

export type UploadState = 'idle' | 'uploading' | 'complete' | 'error'

export interface UploadProgress {
  percent: number
  status: string
}

export interface AddressSearchResult {
  display_name: string
  lat: string
  lon: string
}

export interface SatelliteCaptureMetadata {
  blob: Blob
  blobUrl: string
  lat: number
  lng: number
  zoom: number
  timestamp: string
  resolution: string
  locationLabel: string
}

export interface RoofAnalysisData {
  roof_area_sqft: number
  facing_direction: string
  compass_angle: number | null
  roof_condition: string
  roof_type: string
  shading_issues: string
  solar_potential: string
  obstacles: string
  recommended_system: string
  system_size_kw: number
  total_panels: number
  panel_rows: number
  panels_per_row: number
  total_legs: number
  front_legs: number
  back_legs: number
  front_leg_height_ft: number
  back_leg_height_ft: number
  monthly_generation_units: number
  annual_generation_units: number
  analysis_notes: string
  suitabilityScore: number
  shadePercent: string
  satellite_analysis?: boolean
  filename?: string
}

export interface RoofAnalyzerState {
  mode: AnalysisMode
  cameraFile: File | null
  lengthFt: string
  widthFt: string
  city: string
  isCameraValid: boolean
  
  // Satellite state
  searchQuery: string
  searchResults: AddressSearchResult[]
  isSearching: boolean
  selectedLocation: { lat: number; lng: number; label: string } | null
  captureData: SatelliteCaptureMetadata | null
  captureStatus: string | null
  isMapLoaded: boolean
  isCapturing: boolean
  activeLayer: 'street' | 'satellite'
  
  // Upload & processing
  roofUploadState: UploadState
  roofProgress: UploadProgress
  roofError: string | null
  analysis: RoofAnalysisData | null
}

export interface RoofAnalyzerHandlers {
  setMode: (mode: AnalysisMode) => void
  handleCameraFileSelect: (file: File) => void
  setLengthFt: (val: string) => void
  setWidthFt: (val: string) => void
  setCity: (val: string) => void
  handleAddressSearch: (query: string) => void
  selectAddressResult: (result: AddressSearchResult) => void
  toggleMapLayer: (layer: 'street' | 'satellite') => void
  captureSatelliteView: () => void
  triggerCameraAnalysis: () => void
  triggerSatelliteAnalysis: () => void
  retryRoofUpload: () => void
  resetRoofAnalysis: () => void
  dismissSearchResults: () => void
}

export interface RoofAnalyzerReturn extends RoofAnalyzerState, RoofAnalyzerHandlers {
  mapContainerRef: React.RefObject<HTMLDivElement | null>
}
