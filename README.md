# get-solar-energy
India's Solar AI Platform

## Phase 16.0B — Satellite Roof Analysis (Beta)

### Architecture
- **Backend**: `POST /api/analyze-roof` accepts optional `source` param (`"camera"` | `"satellite"`). Returns `satellite_analysis` flag and Beta disclaimer in `analysis_notes` when `source="satellite"`.
- **Frontend**: Two-mode UI within roof analysis tab:
  - **Camera Upload** (default, unchanged): drag-drop photo + dimensions → API
  - **Satellite Analysis** (Beta): Leaflet map with OSM/ESRI tiles, Nominatim address search, html2canvas map capture → same API with `source=satellite`
- **Validation Framework** (deferred to Phase 16.1): `prototype/` directory contains standalone KPI evaluator (`validate_satellite.py`), label validator (`validate_labels.py`), and report generator (`generate_report.py`).

### Key Files
| File | Role |
|---|---|
| `backend/roof.py` | Analyzes roof images via Gemini 2.5 Flash |
| `frontend/js/modules/satellite-roof.js` | Leaflet map, address search, capture, mode management |
| `frontend/js/services/geocoding.service.js` | Nominatim geocoding abstraction |
| `frontend/styles/satellite-roof.css` | Map container, toggle, beta badge, banner |
| `frontend/dashboard.html` | Two-mode roof analysis tab |
| `prototype/*` | Deferred validation framework |

### Conditions
- Satellite results are marked as **BETA** in both UI and API response.
- Analysis notes include disclaimer: *"Results are estimated from satellite imagery and should be confirmed through an on-site survey."*
- No production accuracy certification until Phase 16.1 validation is complete.
