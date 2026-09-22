import React from 'react'
import RoofAnalyzerWorkspace from './RoofAnalyzerWorkspace'
import RoofComingSoon from '../components/roof/RoofComingSoon'
import { ROOF_VISION_RELEASED } from '../config/release'

// Release gate for Roof Vision AI.
// The customer release does NOT include roof analysis: the page renders a
// Coming Soon experience and never mounts the analysis workflow (no uploads,
// no satellite/geocoding calls, no AI quota consumption).
// To release the feature, set ROOF_VISION_RELEASED = true in config/release.
// The full implementation is preserved in RoofAnalyzerWorkspace.
export { ROOF_VISION_RELEASED }

export default function RoofAnalyzer() {
  if (!ROOF_VISION_RELEASED) {
    return <RoofComingSoon />
  }

  return <RoofAnalyzerWorkspace />
}
