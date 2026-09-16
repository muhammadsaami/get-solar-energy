import { describe, it, expect } from 'vitest'
import {
  motionDurations,
  motionEasings,
  motionTransforms,
  defaultTransition,
  getTransition,
  fadeIn,
  fadeUp,
  pageEnter,
  modalEnter,
  cardHover,
  buttonTap,
  createStaggerContainer,
  createReducedVariants,
} from '../index'

describe('Motion System Tokens & Transitions', () => {
  it('has consistent duration tokens', () => {
    expect(motionDurations.instant).toBe(0)
    expect(motionDurations.fast).toBe(0.18)
    expect(motionDurations.normal).toBe(0.28)
    expect(motionDurations.slow).toBe(0.45)
  })

  it('has calibrated enterprise easing curves', () => {
    expect(motionEasings.primary).toEqual([0.16, 1, 0.3, 1])
    expect(motionEasings.cinematic).toEqual([0.2, 0.9, 0.3, 1])
  })

  it('provides appropriate transitions with reduced motion fallback', () => {
    const normal = getTransition('default', false)
    expect(normal.duration).toBe(motionDurations.normal)

    const reduced = getTransition('default', true)
    expect(reduced.duration).toBe(motionDurations.instant)
  })
})

describe('Motion System Variants', () => {
  it('defines valid fadeIn, fadeUp, and pageEnter variants', () => {
    expect(fadeIn.initial).toEqual({ opacity: 0 })
    expect(fadeUp.initial).toEqual({ opacity: 0, y: 16 })
    expect(pageEnter.initial).toEqual({ opacity: 0, y: motionTransforms.pageEnterY })
  })

  it('defines subtle interaction values for cards and buttons', () => {
    expect(cardHover.whileHover.y).toBe(-3)
    expect(buttonTap.whileTap.scale).toBe(0.98)
  })

  it('creates custom stagger containers', () => {
    const custom = createStaggerContainer(0.1, 0.2)
    expect(custom.animate).toEqual({
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    })
  })

  it('createReducedVariants strips transforms and sets duration to instant', () => {
    const reduced = createReducedVariants(fadeUp)
    expect(reduced.initial).toEqual({
      opacity: 0,
      transition: { duration: motionDurations.instant },
    })
    expect(reduced.animate).toEqual({
      opacity: 1,
      transition: { duration: motionDurations.instant },
    })
    // Ensure y transform is stripped in reduced variants
    expect((reduced.initial as { y?: number }).y).toBeUndefined()
    expect((reduced.animate as { y?: number }).y).toBeUndefined()
  })
})
