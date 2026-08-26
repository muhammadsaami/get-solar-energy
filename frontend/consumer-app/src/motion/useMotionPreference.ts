/**
 * GET Solar Energy — Motion Accessibility Hook
 * Standardizes reduced-motion checks across portals and components
 */

import { useReducedMotion } from 'motion/react'
import type { Variants, Transition } from 'motion/react'
import { createReducedVariants } from './variants'
import { reducedMotionTransition, defaultTransition } from './transitions'

export function useMotionPreference() {
  const shouldReduceMotion = useReducedMotion() ?? false

  return {
    shouldReduceMotion,
    getSafeVariants: (variants: Variants) =>
      shouldReduceMotion ? createReducedVariants(variants) : variants,
    getSafeTransition: (transition: Transition = defaultTransition) =>
      shouldReduceMotion ? reducedMotionTransition : transition,
    hoverLift: shouldReduceMotion ? {} : { y: -3 },
    tapScale: shouldReduceMotion ? {} : { scale: 0.98 },
  }
}
