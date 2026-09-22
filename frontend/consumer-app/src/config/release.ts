/**
 * Portal release gates.
 *
 * Vendor Portal and Technician Portal are NOT publicly released.
 * Only Admin may access their operational routes; other roles receive
 * a Coming Soon state (owning role) or the existing AccessDenied state.
 * Mirrors the Roof Vision ROOF_VISION_RELEASED pattern.
 */
export const VENDOR_PORTAL_RELEASED = false
export const TECHNICIAN_PORTAL_RELEASED = false
