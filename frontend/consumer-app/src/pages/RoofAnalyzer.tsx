import React from 'react'
import RoofAnalyzerWorkspace from './RoofAnalyzerWorkspace'
import RoofComingSoon from '../components/roof/RoofComingSoon'

// Release gate for Roof Vision AI.
// The customer release does NOT include roof analysis: the page renders a
// Coming Soon experience and never mounts the analysis workflow (no uploads,
// no satellite/geocoding calls, no AI quota consumption).
// To release the feature, set ROOF_VISION_RELEASED = true. The full
// implementation is preserved in RoofAnalyzerWorkspace.
const ROOF_VISION_RELEASED = false

export { ROOF_VISION_RELEASED }

export default function RoofAnalyzer() {
  if (!ROOF_VISION_RELEASED) {
    return <RoofComingSoon />
  }

  return <RoofAnalyzerWorkspace />
}
