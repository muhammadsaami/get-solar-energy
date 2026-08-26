/**
 * GET Solar Energy — Motion Tokens
 * Design System Authority: .agents/AGENTS.md Motion Language
 */

export const motionDurations = {
  instant: 0,
  fast: 0.18, // 180ms - Micro-interactions, button presses, tooltips
  normal: 0.28, // 280ms - Card lifts, dropdowns, alerts, tab switches
  slow: 0.45, // 450ms - Page transitions, scene reveals, modal sheets
} as const

export type MotionDuration = keyof typeof motionDurations

export const motionEasings = {
  // Primary enterprise easing: deliberate, calm, deceleration curve
  primary: [0.16, 1, 0.3, 1] as const,
  // Cinematic camera & layout reveal curve
  cinematic: [0.2, 0.9, 0.3, 1] as const,
  // Standard acceleration curves
  easeOut: [0, 0, 0.2, 1] as const,
  easeIn: [0.4, 0, 1, 1] as const,
  easeInOut: [0.4, 0, 0.2, 1] as const,
} as const

export type MotionEasing = keyof typeof motionEasings

export const motionStaggers = {
  fast: 0.05,
  normal: 0.08,
  slow: 0.12,
} as const

export const motionTransforms = {
  cardHoverY: -3,
  buttonTapScale: 0.98,
  pageEnterY: 12,
  modalEnterScale: 0.97,
} as const
