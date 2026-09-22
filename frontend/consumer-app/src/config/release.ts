/**
 * Release gates.
 *
 * Vendor Portal and Technician Portal are NOT publicly released.
 * Only Admin may access their operational routes; other roles receive
 * a Coming Soon state (owning role) or the existing AccessDenied state.
 *
 * Roof Vision AI is NOT publicly released either. The customer release
 * renders a Coming Soon experience and never mounts the analysis workflow
 * (no uploads, no satellite/geocoding calls, no AI quota consumption).
 * To release the feature, set ROOF_VISION_RELEASED = true. The full
 * implementation is preserved in RoofAnalyzerWorkspace.
 */
export const VENDOR_PORTAL_RELEASED = false
export const TECHNICIAN_PORTAL_RELEASED = false
export const ROOF_VISION_RELEASED = false
