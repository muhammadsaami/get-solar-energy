import React from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useAuthStatus } from '../../hooks/useAuthStatus'
import { trackCTA } from '../../utils/analytics'

export default function CTAButtons() {
  const shouldReduceMotion = useReducedMotion()
  const { isAuthenticated } = useAuthStatus()

  return (
    <div
      className="final-buttons"
      style={{ display: 'flex', justifyContent: 'center', gap: 20 }}
    >
      <motion.a
        href={isAuthenticated ? '/app/home' : '/signup'}
        className="btn-hero-primary"
        onClick={() =>
          trackCTA({
            action: 'final_assessment',
            location: 'scene_final',
            timestamp: Date.now(),
          })
        }
        style={{ fontSize: 18, padding: '18px 40px' }}
        whileHover={shouldReduceMotion ? {} : { y: -2 }}
        whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
        transition={{ duration: 0.15 }}
      >
        Start Free Assessment
      </motion.a>
      <motion.a
        href={isAuthenticated ? '/app/home' : '/login'}
        className="btn-hero-secondary"
        onClick={() =>
          trackCTA({
            action: 'demo_dashboard',
            location: 'scene_final',
            timestamp: Date.now(),
          })
        }
        style={{
          fontSize: 18,
          padding: '18px 40px',
          background: 'rgba(255,255,255,0.1)',
          backdropFilter: 'blur(10px)',
        }}
        whileHover={shouldReduceMotion ? {} : { y: -2 }}
        whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
        transition={{ duration: 0.15 }}
      >
        View Demo Dashboard
      </motion.a>
    </div>
  )
}
