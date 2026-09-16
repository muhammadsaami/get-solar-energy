import React from 'react'
import { motion, useReducedMotion } from 'motion/react'

interface SuitabilityCardProps {
  icon: string
  label: string
  value: string
}

export default function SuitabilityCard({ icon, label, value }: SuitabilityCardProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      className="insight-card"
      whileHover={shouldReduceMotion ? {} : { y: -3 }}
      transition={{ duration: 0.2, ease: [0.2, 0.9, 0.3, 1] }}
    >
      <div className="insight-icon">{icon}</div>
      <div className="insight-content">
        <span className="insight-label">{label}</span>
        <span className="insight-value">{value}</span>
      </div>
    </motion.div>
  )
}
