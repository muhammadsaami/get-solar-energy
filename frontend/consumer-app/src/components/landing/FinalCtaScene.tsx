import React from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useSceneVisibility } from '../../hooks/useSceneVisibility'
import CTAContent from './CTAContent'
import CTAButtons from './CTAButtons'

export default function FinalCtaScene() {
  const shouldReduceMotion = useReducedMotion()
  const sceneRef = useSceneVisibility<HTMLElement>({ camera: 'conversion' })

  return (
    <article
      ref={sceneRef}
      className="cinematic-scene scene-final"
      id="sceneFinal"
      data-camera="conversion"
    >
      <div className="cinematic-color-grade" />
      <div className="scene-transition-mask top" />
      <div className="scene-transition-mask bottom" />
      <div className="layer-bg">
        <img
          src="/assets/Cinematic/Asset 15.webp"
          alt="Your Solar Journey"
          loading="lazy"
        />
      </div>
      <div
        className="lighting-overlay lighting-warm"
        style={{
          background:
            'linear-gradient(0deg, rgba(6,15,31,0.95) 0%, rgba(6,15,31,0.4) 100%)',
        }}
      />

      <motion.div
        className="hero-container layer-fg scene-element"
        style={{
          width: '100%',
          maxWidth: 1200,
          padding: '0 5%',
          position: 'relative',
          zIndex: 2,
          textAlign: 'center',
        }}
        initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <CTAContent />
        <CTAButtons />
      </motion.div>
    </article>
  )
}
