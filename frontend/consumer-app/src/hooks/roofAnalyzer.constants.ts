export const API_BASE = 'http://localhost:8000/api'

export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

export const VALID_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
export const VALID_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']

export const DEFAULT_CENTER = { lat: 20.5937, lng: 78.9629 } // India Center
export const DEFAULT_ZOOM = 5
export const MIN_CAPTURE_ZOOM = 17
export const CAPTURE_ZOOM = 20

export const TILE_PROVIDERS = {
  street: {
    name: 'OpenStreetMap',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 20,
  },
  satellite: {
    name: 'ESRI World Imagery',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    maxZoom: 20,
  },
}

export const SEARCH_DEBOUNCE_MS = 350
