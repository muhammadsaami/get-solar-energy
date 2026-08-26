/**
 * GET Solar Energy — Motion Variants
 * Enterprise-grade, GPU-accelerated variants for motion/react
 */

import type { Variants } from 'motion/react'
import { motionDurations, motionEasings, motionStaggers, motionTransforms } from './tokens'
import { defaultTransition, pageTransition, modalTransition, drawerTransition } from './transitions'

export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: defaultTransition,
  },
  exit: {
    opacity: 0,
    transition: defaultTransition,
  },
}

export const fadeUp: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: defaultTransition,
  },
  exit: {
    opacity: 0,
    y: -16,
    transition: defaultTransition,
  },
}

export const fadeDown: Variants = {
  initial: { opacity: 0, y: -16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: defaultTransition,
  },
  exit: {
    opacity: 0,
    y: 16,
    transition: defaultTransition,
  },
}

export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.96 },
  animate: {
    opacity: 1,
    scale: 1,
    transition: defaultTransition,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    transition: defaultTransition,
  },
}

export const slideInLeft: Variants = {
  initial: { opacity: 0, x: -24 },
  animate: {
    opacity: 1,
    x: 0,
    transition: defaultTransition,
  },
  exit: {
    opacity: 0,
    x: -24,
    transition: defaultTransition,
  },
}

export const slideInRight: Variants = {
  initial: { opacity: 0, x: 24 },
  animate: {
    opacity: 1,
    x: 0,
    transition: defaultTransition,
  },
  exit: {
    opacity: 0,
    x: 24,
    transition: defaultTransition,
  },
}

export const pageEnter: Variants = {
  initial: { opacity: 0, y: motionTransforms.pageEnterY },
  animate: {
    opacity: 1,
    y: 0,
    transition: pageTransition,
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: motionDurations.fast, ease: motionEasings.easeIn },
  },
}

export const modalEnter: Variants = {
  initial: { opacity: 0, scale: motionTransforms.modalEnterScale, y: 8 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: modalTransition,
  },
  exit: {
    opacity: 0,
    scale: motionTransforms.modalEnterScale,
    y: 8,
    transition: { duration: motionDurations.fast, ease: motionEasings.easeIn },
  },
}

export const drawerEnter: Variants = {
  initial: { opacity: 0, x: '100%' },
  animate: {
    opacity: 1,
    x: 0,
    transition: drawerTransition,
  },
  exit: {
    opacity: 0,
    x: '100%',
    transition: drawerTransition,
  },
}

export const cardHover = {
  whileHover: {
    y: motionTransforms.cardHoverY,
    transition: { duration: motionDurations.fast, ease: motionEasings.primary },
  },
} as const

export const buttonTap = {
  whileTap: {
    scale: motionTransforms.buttonTapScale,
    transition: { duration: motionDurations.fast, ease: motionEasings.easeOut },
  },
} as const

export function createStaggerContainer(
  stagger: number = motionStaggers.normal,
  delayChildren = 0.05
): Variants {
  return {
    initial: { opacity: 0 },
    animate: {
      opacity: 1,
      transition: {
        staggerChildren: stagger,
        delayChildren,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: stagger / 2,
        staggerDirection: -1,
      },
    },
  }
}

export const staggerContainer = createStaggerContainer()

/**
 * Strips transforms, scales, and delays for users who prefer reduced motion
 */
export function createReducedVariants(baseVariants: Variants): Variants {
  const reduced: Variants = {}
  for (const [key, val] of Object.entries(baseVariants)) {
    if (typeof val === 'object' && val !== null) {
      reduced[key] = {
        opacity: (val as { opacity?: number }).opacity ?? 1,
        transition: { duration: motionDurations.instant },
      }
    } else {
      reduced[key] = val
    }
  }
  return reduced
}
