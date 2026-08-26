import React from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useSceneVisibility } from '../../hooks/useSceneVisibility'
import SavingsStats from './SavingsStats'
import { trackCTA } from '../../utils/analytics'

export default function SavingsScene() {
  const shouldReduceMotion = useReducedMotion()
  const sceneRef = useSceneVisibility<HTMLElement>({ camera: 'savings' })

  return (
    <article
      ref={sceneRef}
      className="cinematic-scene scene-savings"
      id="sceneSavings"
      data-camera="savings"
    >
      <div className="cinematic-color-grade" />
      <div className="scene-transition-mask top" />
      <div className="scene-transition-mask bottom" />
      <div className="layer-bg">
        <img
          src="/assets/Cinematic/Asset 6.webp"
          alt="Neighborhood Solar Scale"
          id="savingsParallaxImg"
          loading="lazy"
        />
      </div>
      <div className="lighting-overlay lighting-cool" />

      <div
        className="hero-container layer-fg scene-element"
        style={{
          width: '100%',
          maxWidth: 1200,
          padding: '0 5%',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <motion.div
          style={{
            background: 'rgba(8, 24, 42, 0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            padding: 50,
            borderRadius: 'var(--radius-lg)',
            maxWidth: 550,
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          }}
          initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          <h2
            className="section-title"
            style={{ textAlign: 'left', fontSize: 42 }}
          >
            Scale Your Savings.
          </h2>
          <p
            className="section-subtitle"
            style={{ textAlign: 'left', marginBottom: 30 }}
          >
            Join thousands of Indian families who have eliminated their
            electricity bills and secured their energy independence.
          </p>

          <SavingsStats />

          <motion.a
            href="#sceneFinal"
            className="btn-hero-primary"
            onClick={() => trackCTA('savings_scene_cta')}
            whileHover={shouldReduceMotion ? {} : { y: -2 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
            transition={{ duration: 0.15 }}
          >
            Calculate Your Share
          </motion.a>
        </motion.div>
      </div>
    </article>
  )
}
