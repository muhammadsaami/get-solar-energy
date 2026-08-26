import React from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useSceneVisibility } from '../../hooks/useSceneVisibility'
import TechnologyContent from './TechnologyContent'
import DiagnosticsGrid from './DiagnosticsGrid'

export default function TechnologyScene() {
  const shouldReduceMotion = useReducedMotion()
  const sceneRef = useSceneVisibility<HTMLElement>({ camera: 'technology' })

  return (
    <article
      ref={sceneRef}
      className="cinematic-scene scene-technology"
      id="sceneTechnology"
      data-camera="technology"
    >
      <div className="cinematic-color-grade" />
      <div className="scene-transition-mask top" />
      <div className="scene-transition-mask bottom" />
      <div className="layer-bg">
        <img
          src="/assets/Cinematic/Asset 5.webp"
          alt="Technology and QA Inspection"
          loading="lazy"
        />
      </div>
      <div className="lighting-overlay lighting-cool" />

      <motion.div
        className="qa-container layer-fg scene-element"
        initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <TechnologyContent />
        <DiagnosticsGrid />
      </motion.div>
    </article>
  )
}
