import React from 'react'
import { motion, useReducedMotion } from 'motion/react'

interface DiagnosticsCardProps {
  value: string
  label: string
}

export default function DiagnosticsCard({ value, label }: DiagnosticsCardProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      className="qa-hud-card"
      whileHover={shouldReduceMotion ? {} : { y: -3 }}
      transition={{ duration: 0.2, ease: [0.2, 0.9, 0.3, 1] }}
    >
      <span className="hud-check">{'\u2713'}</span>
      <div className="hud-info">
        <span className="hud-value">{value}</span>
        <span className="hud-label">{label}</span>
      </div>
    </motion.div>
  )
}
