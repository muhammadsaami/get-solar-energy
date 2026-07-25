import { useState, useRef, useCallback, useEffect } from 'react'
import api from '../services/api/client'
import L from 'leaflet'
import html2canvas from 'html2canvas'
import type { Map as LeafletMap, TileLayer as LeafletTileLayer, Marker as LeafletMarker } from 'leaflet'
import type {
  AnalysisMode,
  UploadState,
  UploadProgress,
  AddressSearchResult,
  SatelliteCaptureMetadata,
  RoofAnalysisData,
  RoofAnalyzerReturn,
} from './roofAnalyzer.types'
import {
  MAX_FILE_SIZE,
  VALID_EXTENSIONS,
  VALID_IMAGE_TYPES,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  MIN_CAPTURE_ZOOM,
  TILE_PROVIDERS,
  SEARCH_DEBOUNCE_MS,
} from './roofAnalyzer.constants'

const LS_KEY_ROOF = 'lastRoofAnalysis'

const CAPTURE_SCALE = 2
const LOCATION_TIMEOUT_MS = 15000

function readLS<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') {
      localStorage.removeItem(key)
      return null
    }
    return parsed as T
  } catch {
    localStorage.removeItem(key)
    return null
  }
}

function writeLS(key: string, data: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch {
    // silently ignore storage errors
  }
}

function safeNum(val: unknown, fallback = 0): number {
  const n = Number(val)
  return isFinite(n) ? n : fallback
}

function enrichRoofData(apiData: Record<string, unknown>, filename = 'roof_image.png', isSatellite = false): RoofAnalysisData {
  const roofAreaSqft = safeNum(apiData.roof_area_sqft || apiData.roofAreaSqFt)
  const facingDirection = String(apiData.facing_direction || apiData.facingDirection || 'South (180°)')
  const compassAngle = apiData.compass_angle != null ? safeNum(apiData.compass_angle) : 180
  const roofCondition = String(apiData.roof_condition || apiData.roofCondition || 'Good')
  const roofType = String(apiData.roof_type || apiData.roofType || 'Flat Concrete')
  const shadingIssues = String(apiData.shading_issues || apiData.shadingIssues || 'None / Minimal')
  const solarPotential = String(apiData.solar_potential || apiData.solarPotential || 'High')
  const obstacles = String(apiData.obstacles || 'Water tank (Small)')
  const recommendedSystem = String(apiData.recommended_system || apiData.recommendedSystem || '5.2 kW Standard Array')
  const systemSizeKw = safeNum(apiData.system_size_kw || apiData.systemSizeKw) || 5.2
  const totalPanels = safeNum(apiData.total_panels || apiData.totalPanels) || 16
  const panelRows = safeNum(apiData.panel_rows || apiData.panelRows) || 2
  const panelsPerRow = safeNum(apiData.panels_per_row || apiData.panelsPerRow) || 8
  const totalLegs = safeNum(apiData.total_legs || apiData.totalLegs) || 12
  const frontLegs = safeNum(apiData.front_legs || apiData.frontLegs) || 6
  const backLegs = safeNum(apiData.back_legs || apiData.backLegs) || 6
  const frontLegHeightFt = safeNum(apiData.front_leg_height_ft || apiData.frontLegHeightFt) || 1.5
  const backLegHeightFt = safeNum(apiData.back_leg_height_ft || apiData.backLegHeightFt) || 3.8
  const monthlyGen = safeNum(apiData.monthly_generation_units || apiData.monthlyGen) || 650
  const annualGen = safeNum(apiData.annual_generation_units || apiData.annualGen) || (monthlyGen * 12)
  const analysisNotes = String(apiData.analysis_notes || apiData.analysisNotes || 'Optimal South facing tilt detected with high solar yield potential.')

  const potLower = solarPotential.toLowerCase()
  let suitabilityScore = 92
  if (potLower.includes('high')) suitabilityScore = 92
  else if (potLower.includes('medium')) suitabilityScore = 75
  else if (potLower.includes('low')) suitabilityScore = 50

  let shadePercent = '8%'
  const shadeLower = shadingIssues.toLowerCase()
  if (shadeLower.includes('none') || shadeLower.includes('minimal')) shadePercent = '0%'
  else if (shadeLower.includes('partial')) shadePercent = '15%'
  else if (shadeLower.includes('heavy')) shadePercent = '30%'

  return {
    roof_area_sqft: roofAreaSqft || 380,
    facing_direction: facingDirection,
    compass_angle: compassAngle,
    roof_condition: roofCondition,
    roof_type: roofType,
    shading_issues: shadingIssues,
    solar_potential: solarPotential,
    obstacles,
    recommended_system: recommendedSystem,
    system_size_kw: systemSizeKw,
    total_panels: totalPanels,
    panel_rows: panelRows,
    panels_per_row: panelsPerRow,
    total_legs: totalLegs,
    front_legs: frontLegs,
    back_legs: backLegs,
    front_leg_height_ft: frontLegHeightFt,
    back_leg_height_ft: backLegHeightFt,
    monthly_generation_units: monthlyGen,
    annual_generation_units: annualGen,
    analysis_notes: analysisNotes,
    suitabilityScore,
    shadePercent,
    satellite_analysis: isSatellite,
    filename,
  }
}

export function useRoofAnalyzer(): RoofAnalyzerReturn {
  const [mode, setMode] = useState<AnalysisMode>('camera')
  const [cameraFile, setCameraFile] = useState<File | null>(null)
  const [lengthFt, setLengthFt] = useState('')
  const [widthFt, setWidthFt] = useState('')
  const [city, setCity] = useState('')
  
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<AddressSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; label: string } | null>(null)
  const [captureData, setCaptureData] = useState<SatelliteCaptureMetadata | null>(null)
  const [captureStatus, setCaptureStatus] = useState<string | null>(null)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [activeLayer, setActiveLayer] = useState<'street' | 'satellite'>('satellite')

  const [roofUploadState, setRoofUploadState] = useState<UploadState>('idle')
  const [roofProgress, setRoofProgress] = useState<UploadProgress>({ percent: 0, status: '' })
  const [roofError, setRoofError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<RoofAnalysisData | null>(null)

  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<LeafletMap | null>(null)
  const tileLayerRef = useRef<LeafletTileLayer | null>(null)
  const markerRef = useRef<LeafletMarker | null>(null)
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const captureInProgressRef = useRef(false)
  const analysisInProgressRef = useRef(false)
  const tilesLoadedRef = useRef(false)
  const tileLoadTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const captureTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [isCapturing, setIsCapturing] = useState(false)

  const isCameraValid = Boolean(
    cameraFile &&
    Number(lengthFt) > 0 &&
    Number(widthFt) > 0 &&
    city.trim().length > 0
  )

  const clearProgressInterval = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
  }, [])

  // Initialize Leaflet Map safely
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    const container = mapContainerRef.current
    const map = L.map(container, {
      center: [DEFAULT_CENTER.lat, DEFAULT_CENTER.lng],
      zoom: DEFAULT_ZOOM,
      zoomControl: true,
    })

    const initialProvider = TILE_PROVIDERS.satellite
    const tileLayer = L.tileLayer(initialProvider.url, {
      maxZoom: initialProvider.maxZoom,
      attribution: initialProvider.attribution,
    }).addTo(map)

    tileLayerRef.current = tileLayer
    mapInstanceRef.current = map
    setIsMapLoaded(true)

    // Tile loading tracking (matching legacy satellite-roof.js behavior)
    tilesLoadedRef.current = false

    map.on('tileload', () => {
      tilesLoadedRef.current = true
      if (tileLoadTimerRef.current) {
        clearTimeout(tileLoadTimerRef.current)
        tileLoadTimerRef.current = null
      }
    })

    map.on('zoomend', () => {
      tilesLoadedRef.current = false
      if (tileLoadTimerRef.current) clearTimeout(tileLoadTimerRef.current)
      tileLoadTimerRef.current = setTimeout(() => { tilesLoadedRef.current = true }, 2000)
    })

    map.on('moveend', () => {
      // placeholder for capture button re-evaluation on move
    })

    return () => {
      if (tileLoadTimerRef.current) clearTimeout(tileLoadTimerRef.current)
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        tileLayerRef.current = null
        markerRef.current = null
      }
    }
  }, [])

  // Trigger map invalidate size on tab switch
  useEffect(() => {
    if (mode === 'satellite' && mapInstanceRef.current) {
      const timer = setTimeout(() => {
        mapInstanceRef.current?.invalidateSize()
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [mode])

  // Toggle map layers
  const toggleMapLayer = useCallback((layerType: 'street' | 'satellite') => {
    setActiveLayer(layerType)
    if (!mapInstanceRef.current) return
    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current)
    }
    const provider = TILE_PROVIDERS[layerType]
    tileLayerRef.current = L.tileLayer(provider.url, {
      maxZoom: provider.maxZoom,
      attribution: provider.attribution,
    }).addTo(mapInstanceRef.current)
  }, [])

  // Address search with Nominatim geocoding API
  const handleAddressSearch = useCallback((query: string) => {
    setSearchQuery(query)
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    if (!query.trim() || query.trim().length < 3) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    setIsSearching(true)
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query.trim())}&limit=5`, {
          headers: { 'Accept-Language': 'en' },
        })
        if (!res.ok) throw new Error('Search request failed')
        const data: AddressSearchResult[] = await res.json()
        setSearchResults(data || [])
      } catch {
        setSearchResults([])
      } finally {
        setIsSearching(false)
      }
    }, SEARCH_DEBOUNCE_MS)
  }, [])

  // Select search result
  const selectAddressResult = useCallback((result: AddressSearchResult) => {
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)
    setSearchResults([])
    setSearchQuery(result.display_name)
    setSelectedLocation({ lat, lng, label: result.display_name })

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 18, { animate: true })
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng])
      } else {
        markerRef.current = L.marker([lat, lng]).addTo(mapInstanceRef.current)
      }
    }
  }, [])

  // Roof dimension estimation from map bounds (matching legacy satellite-roof.js)
  const estimateDimensions = useCallback(() => {
    if (!mapInstanceRef.current) return { length: 40, width: 30 }
    const bounds = mapInstanceRef.current.getBounds()
    const ne = bounds.getNorthEast()
    const sw = bounds.getSouthWest()
    const latDiff = Math.abs(ne.lat - sw.lat) * 111320
    const lngDiff = Math.abs(ne.lng - sw.lng) * 111320 * Math.cos((ne.lat + sw.lat) / 2 * Math.PI / 180)
    const estLength = Math.max(Math.round(lngDiff * 0.3), 20)
    const estWidth = Math.max(Math.round(latDiff * 0.3), 15)
    return { length: Math.min(estLength, 200), width: Math.min(estWidth, 150) }
  }, [])

  // Capture satellite view using html2canvas (matching legacy behavior)
  const captureSatelliteView = useCallback(() => {
    if (!mapInstanceRef.current) return
    if (captureInProgressRef.current || analysisInProgressRef.current) return

    // Validate prerequisites
    if (!selectedLocation) {
      setCaptureStatus('Search for an address first.')
      return
    }

    const currentZoom = mapInstanceRef.current.getZoom()
    if (currentZoom < MIN_CAPTURE_ZOOM) {
      setCaptureStatus(`Zoom in closer (current zoom: ${currentZoom}, minimum required: ${MIN_CAPTURE_ZOOM}).`)
      return
    }

    if (!tilesLoadedRef.current) {
      setCaptureStatus('Map tiles still loading. Please wait.')
      return
    }

    setCaptureStatus(null)
    captureInProgressRef.current = true
    setIsCapturing(true)

    // Start 15s timeout (matching legacy LOCATION_TIMEOUT_MS)
    if (captureTimeoutRef.current) clearTimeout(captureTimeoutRef.current)
    captureTimeoutRef.current = setTimeout(() => {
      if (captureInProgressRef.current) {
        captureInProgressRef.current = false
        setIsCapturing(false)
        setCaptureStatus('Capture timed out. Please try again.')
      }
    }, LOCATION_TIMEOUT_MS)

    const mapEl = mapContainerRef.current
    if (!mapEl) {
      captureInProgressRef.current = false
      setIsCapturing(false)
      if (captureTimeoutRef.current) clearTimeout(captureTimeoutRef.current)
      return
    }

    const center = mapInstanceRef.current.getCenter()

    // Hide Leaflet controls before capture (matching legacy _doCapture)
    const originalOverflow = mapEl.style.overflow
    const originalPosition = mapEl.style.position
    mapEl.style.overflow = 'hidden'
    mapEl.style.position = 'relative'

    const controls = mapEl.querySelectorAll('.leaflet-control-zoom, .leaflet-control-attribution') as NodeListOf<HTMLElement>
    controls.forEach((c) => { c.style.display = 'none' })

    html2canvas(mapEl, {
      useCORS: true,
      scale: CAPTURE_SCALE,
      allowTaint: false,
      backgroundColor: '#06111f',
      logging: false,
    }).then((canvas) => {
      // Restore controls and styles
      controls.forEach((c) => { c.style.display = '' })
      mapEl.style.overflow = originalOverflow
      mapEl.style.position = originalPosition

      if (captureTimeoutRef.current) clearTimeout(captureTimeoutRef.current)

      canvas.toBlob((blob) => {
        if (!blob) {
          captureInProgressRef.current = false
          setIsCapturing(false)
          setCaptureStatus('Failed to create image. Try again.')
          return
        }

        const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        const resolution = `${canvas.width} x ${canvas.height} px`
        const locationLabel = selectedLocation?.label || `${center.lat.toFixed(4)}°, ${center.lng.toFixed(4)}°`
        const blobUrl = URL.createObjectURL(blob)

        // Estimate dimensions from map bounds (matching legacy _estimateDimensions)
        const dims = estimateDimensions()
        setLengthFt(String(dims.length))
        setWidthFt(String(dims.width))

        setCaptureData({
          blob,
          blobUrl,
          lat: center.lat,
          lng: center.lng,
          zoom: currentZoom,
          timestamp,
          resolution,
          locationLabel,
        })

        captureInProgressRef.current = false
        setIsCapturing(false)
      }, 'image/png')
    }).catch(() => {
      // Restore controls and styles on error
      controls.forEach((c) => { c.style.display = '' })
      mapEl.style.overflow = originalOverflow
      mapEl.style.position = originalPosition

      if (captureTimeoutRef.current) clearTimeout(captureTimeoutRef.current)
      captureInProgressRef.current = false
      setIsCapturing(false)
      setCaptureStatus('Map capture failed. Switch to Camera Upload mode.')
    })
  }, [selectedLocation, estimateDimensions, mapContainerRef])

  const handleCameraFileSelect = useCallback((file: File) => {
    setRoofError(null)
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    const isValid = VALID_IMAGE_TYPES.includes(file.type) || VALID_EXTENSIONS.includes(ext)
    if (!isValid) {
      setRoofError('Please upload a valid image file (PNG, JPG, JPEG, WEBP)')
      return
    }
    if (file.size > MAX_FILE_SIZE) {
      setRoofError('File size exceeds 10MB limit.')
      return
    }
    setCameraFile(file)
  }, [])

  const runRoofAnalysis = useCallback((file: File | Blob, filename: string, isSatellite: boolean) => {
    setRoofError(null)
    setRoofUploadState('uploading')
    setRoofProgress({ percent: 0, status: 'Analyzing shading & roof azimuth...' })

    let progress = 0
    const statuses = [
      'Scanning roof contours...',
      'Calculating roof azimuth & pitch...',
      'Analyzing solar shading factors...',
      'Estimating usable roof area & panel capacity...',
      'Generating roof analysis snapshot...',
    ]

    clearProgressInterval()
    progressIntervalRef.current = setInterval(() => {
      if (progress < 90) {
        progress += 15
        if (progress > 90) progress = 90
        const idx = Math.min(Math.floor(progress / 20), statuses.length - 1)
        setRoofProgress({ percent: progress, status: statuses[idx] })
      }
    }, 250)

    const formData = new FormData()
    formData.append('image', file, filename)
    if (lengthFt) formData.append('length_ft', lengthFt)
    if (widthFt) formData.append('width_ft', widthFt)
    if (city) formData.append('city', city)

    api.post('/analyze-roof', formData)
      .then((res) => {
        clearProgressInterval()
        analysisInProgressRef.current = false
        setRoofProgress({ percent: 100, status: 'Roof Analysis Complete' })
        const result = res.data
        const apiData = result?.data || result || {}
        const enriched = enrichRoofData(apiData as Record<string, unknown>, filename, isSatellite)
        setAnalysis(enriched)
        writeLS(LS_KEY_ROOF, enriched)
        setRoofUploadState('complete')
      })
      .catch((err: unknown) => {
        clearProgressInterval()
        analysisInProgressRef.current = false
        const msg = (err as { response?: { data?: { detail?: string } }, message?: string })?.response?.data?.detail || (err as Error)?.message || 'Roof analysis failed. Please try again.'
        setRoofError(msg)
        setRoofUploadState('error')
      })
  }, [clearProgressInterval, city, lengthFt, widthFt])

  const triggerCameraAnalysis = useCallback(() => {
    if (!cameraFile) return
    if (analysisInProgressRef.current) return
    analysisInProgressRef.current = true
    runRoofAnalysis(cameraFile, cameraFile.name, false)
  }, [cameraFile, runRoofAnalysis])

  const triggerSatelliteAnalysis = useCallback(() => {
    if (!captureData) return
    if (analysisInProgressRef.current) return
    analysisInProgressRef.current = true
    runRoofAnalysis(captureData.blob, 'satellite_capture.png', true)
  }, [captureData, runRoofAnalysis])

  const retryRoofUpload = useCallback(() => {
    setRoofError(null)
    setRoofUploadState('idle')
    setRoofProgress({ percent: 0, status: '' })
  }, [])

  // Dismiss search results without clearing query (matching legacy click-outside behavior)
  const dismissSearchResults = useCallback(() => {
    setSearchResults([])
  }, [])

  const resetRoofAnalysis = useCallback(() => {
    setAnalysis(null)
    setRoofUploadState('idle')
    setRoofProgress({ percent: 0, status: '' })
    setRoofError(null)
    setCameraFile(null)
    setCaptureData(null)
    localStorage.removeItem(LS_KEY_ROOF)
  }, [])

  // Restore state on initial mount
  useEffect(() => {
    const saved = readLS<Record<string, unknown>>(LS_KEY_ROOF)
    if (saved) {
      const enriched = enrichRoofData(saved, saved.filename as string ?? 'roof_analysis.png', Boolean(saved.satellite_analysis))
      setAnalysis(enriched)
      setRoofUploadState('complete')
    }
  }, [])

  return {
    mode,
    cameraFile,
    lengthFt,
    widthFt,
    city,
    isCameraValid,
    isCapturing,
    searchQuery,
    searchResults,
    isSearching,
    selectedLocation,
    captureData,
    captureStatus,
    isMapLoaded,
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
    resetRoofAnalysis,
    dismissSearchResults,
  }
}
