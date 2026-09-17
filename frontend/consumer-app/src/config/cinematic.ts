export interface CinematicParallaxConfig {
  scale?: {
    base: number
    factor: number
    min?: number
    max?: number
  }
  translateX?: {
    factor: number
  }
  translateY?: {
    factor: number
    min?: number
  }
  useAbsolute?: boolean
}

export interface CinematicPreset {
  cameraType: string
  parallax?: CinematicParallaxConfig
}

export const CINEMATIC_PRESETS: Record<string, CinematicPreset> = {
  technology: {
    cameraType: 'technology',
    parallax: {
      scale: { base: 1.05, factor: 0.03, min: 1 },
      useAbsolute: true,
    },
  },
  savings: {
    cameraType: 'savings',
    parallax: {
      scale: { base: 1.08, factor: 0.06, min: 1 },
      useAbsolute: true,
    },
  },
  conversion: {
    cameraType: 'conversion',
    parallax: {
      scale: { base: 1.05, factor: 0.04, min: 1 },
      useAbsolute: true,
    },
  },
}
