/**
 * GET Solar Energy — Motion Transitions
 * Reusable transition definitions for motion/react
 */

import { motionDurations, motionEasings } from './tokens'
import type { Transition } from 'motion/react'

export const defaultTransition: Transition = {
  duration: motionDurations.normal,
  ease: motionEasings.primary,
}

export const fastTransition: Transition = {
  duration: motionDurations.fast,
  ease: motionEasings.primary,
}

export const slowTransition: Transition = {
  duration: motionDurations.slow,
  ease: motionEasings.primary,
}

export const cinematicTransition: Transition = {
  duration: motionDurations.slow,
  ease: motionEasings.cinematic,
}

export const pageTransition: Transition = {
  duration: motionDurations.normal,
  ease: motionEasings.primary,
}

export const modalTransition: Transition = {
  duration: motionDurations.normal,
  ease: motionEasings.primary,
}

export const drawerTransition: Transition = {
  duration: motionDurations.normal,
  ease: motionEasings.primary,
}

export const microInteractionTransition: Transition = {
  duration: motionDurations.fast,
  ease: motionEasings.easeOut,
}

export const reducedMotionTransition: Transition = {
  duration: motionDurations.instant,
  ease: 'linear',
}

export function getTransition(
  type: 'default' | 'fast' | 'slow' | 'page' | 'modal' | 'drawer' | 'micro' = 'default',
  reduced = false
): Transition {
  if (reduced) return reducedMotionTransition
  switch (type) {
    case 'fast':
      return fastTransition
    case 'slow':
      return slowTransition
    case 'page':
      return pageTransition
    case 'modal':
      return modalTransition
    case 'drawer':
      return drawerTransition
    case 'micro':
      return microInteractionTransition
    case 'default':
    default:
      return defaultTransition
  }
}
