import React from 'react'
import { motion, useReducedMotion } from 'motion/react'

interface WhyCardProps {
  title: string
  description: string
}

export default function WhyCard({ title, description }: WhyCardProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      className="why-card"
      style={{
        background: 'rgba(8, 24, 42, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        padding: 24,
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: 'var(--radius-md, 12px)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.35)',
        textAlign: 'left',
      }}
      whileHover={shouldReduceMotion ? {} : { y: -3 }}
      transition={{ duration: 0.2, ease: [0.2, 0.9, 0.3, 1] }}
    >
      <h3 className="why-card-title" style={{ marginBottom: 8, color: '#f8fafc', fontSize: 17, fontWeight: 800 }}>
        {title}
      </h3>
      <p className="why-card-desc" style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.6, margin: 0 }}>
        {description}
      </p>
    </motion.div>
  )
}
