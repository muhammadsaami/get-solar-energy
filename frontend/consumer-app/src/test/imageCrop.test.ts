import { describe, it, expect } from 'vitest'
import { getBaseScale, clampOffset } from '../utils/imageCrop'

describe('imageCrop utility functions', () => {
  describe('getBaseScale', () => {
    it('calculates the scale needed to cover the crop circle for landscape images', () => {
      // 1000x500 image, crop circle diameter 240
      // Scale to cover width = 240/1000 = 0.24
      // Scale to cover height = 240/500 = 0.48
      // Must use Math.max to ensure full coverage without gaps -> 0.48
      const scale = getBaseScale({ width: 1000, height: 500 }, 240)
      expect(scale).toBeCloseTo(0.48, 4)
    })

    it('calculates the scale needed to cover the crop circle for portrait images', () => {
      // 500x1000 image, crop circle diameter 240
      // Scale to cover width = 240/500 = 0.48
      // Scale to cover height = 240/1000 = 0.24
      // Must use 0.48
      const scale = getBaseScale({ width: 500, height: 1000 }, 240)
      expect(scale).toBeCloseTo(0.48, 4)
    })

    it('handles square images properly', () => {
      const scale = getBaseScale({ width: 500, height: 500 }, 240)
      expect(scale).toBeCloseTo(0.48, 4)
    })

    it('handles non-positive dimensions gracefully without crashing', () => {
      expect(getBaseScale({ width: 0, height: 500 }, 240)).toBe(1)
      expect(getBaseScale({ width: 500, height: -10 }, 240)).toBe(1)
      expect(getBaseScale({ width: 500, height: 500 }, 0)).toBe(1)
    })
  })

  describe('clampOffset', () => {
    it('allows zero offset when image is centered', () => {
      const clamped = clampOffset({ x: 0, y: 0 }, { width: 1000, height: 500 }, 240, 1.0)
      expect(clamped.x).toBe(0)
      expect(clamped.y).toBe(0)
    })

    it('clamps horizontal dragging so image does not pull away from edge (landscape)', () => {
      // Image 1000x500 at base scale 0.48:
      // renderedWidth = 480px, renderedHeight = 240px
      // maxOffsetX = (480 - 240) / 2 = 120px
      // maxOffsetY = (240 - 240) / 2 = 0px
      const clampedWithin = clampOffset({ x: 50, y: 0 }, { width: 1000, height: 500 }, 240, 1.0)
      expect(clampedWithin.x).toBe(50)
      expect(clampedWithin.y).toBe(0)

      const clampedExcess = clampOffset({ x: 300, y: 50 }, { width: 1000, height: 500 }, 240, 1.0)
      expect(clampedExcess.x).toBe(120)
      expect(clampedExcess.y).toBe(0) // Cannot move vertically at 1.0x since height exactly covers 240px

      const clampedNegative = clampOffset({ x: -300, y: -50 }, { width: 1000, height: 500 }, 240, 1.0)
      expect(clampedNegative.x).toBe(-120)
      expect(clampedNegative.y).toBe(0)
    })

    it('expands allowable drag offset when zoom increases', () => {
      // At zoom 2.0x:
      // renderedWidth = 1000 * 0.48 * 2 = 960px
      // maxOffsetX = (960 - 240) / 2 = 360px
      // renderedHeight = 500 * 0.48 * 2 = 480px
      // maxOffsetY = (480 - 240) / 2 = 120px
      const clamped = clampOffset({ x: 250, y: 100 }, { width: 1000, height: 500 }, 240, 2.0)
      expect(clamped.x).toBe(250)
      expect(clamped.y).toBe(100)

      const clampedExcess = clampOffset({ x: 500, y: 200 }, { width: 1000, height: 500 }, 240, 2.0)
      expect(clampedExcess.x).toBe(360)
      expect(clampedExcess.y).toBe(120)
    })
  })
})
