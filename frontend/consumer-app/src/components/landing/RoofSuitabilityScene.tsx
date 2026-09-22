import React from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useSceneVisibility } from '../../hooks/useSceneVisibility'
import { ROOF_VISION_RELEASED } from '../../config/release'
import RoofVisualization from './RoofVisualization'
import SuitabilityGrid from './SuitabilityGrid'
import RecommendationBadge from './RecommendationBadge'

export default function RoofSuitabilityScene() {
  const shouldReduceMotion = useReducedMotion()
  const sectionRef = useSceneVisibility<HTMLElement>({ camera: 'roof' })

  return (
    <article
      ref={sectionRef}
      className="cinematic-scene scene-roof roof-suitability-section"
      id="sceneRoof"
      data-camera="roof"
    >
      <div className="cinematic-color-grade" />
      <div className="scene-transition-mask top" />
      <div className="scene-transition-mask bottom" />
      <div className="layer-bg">
        <img
          src="/assets/Cinematic/Asset 3.webp"
          alt="Roof suitability analysis"
          loading="lazy"
        />
      </div>
      <div className="lighting-overlay lighting-warm" />

      <div
        className="suitability-container layer-fg scene-element"
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          width: '100%',
          maxWidth: 1200,
          padding: '0 5%',
          gap: 60,
          alignItems: 'center',
        }}
      >
        <RoofVisualization />

        <motion.div
          className="suitability-story-column"
          style={{ flex: 1 }}
          initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.55, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="story-header scene-element step-6">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--accent-orange)',
                  background: 'rgba(247, 147, 30, 0.1)',
                  border: '1px solid rgba(247, 147, 30, 0.3)',
                  padding: '4px 12px',
                  borderRadius: '999px',
                  whiteSpace: 'nowrap',
                }}
              >
                ✨ Coming Soon
              </span>
              <h2 className="section-title" style={{ textAlign: 'left', margin: 0 }}>
                Roof Vision AI
              </h2>
            </div>
            <p className="section-subtitle" style={{ textAlign: 'left' }}>
              {ROOF_VISION_RELEASED
                ? 'We evaluate satellite imagery, roof tilt, and irradiance to engineer optimal solar placement for your home.'
                : "Coming soon, you'll be able to explore solar potential, shading, orientation, and estimated generation from your roof."}
            </p>
          </div>

          {!ROOF_VISION_RELEASED && (
            <p
              style={{
                fontSize: '10px',
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
                margin: '16px 0 0',
                textAlign: 'left',
              }}
            >
              Planned AI insights
            </p>
          )}

          <SuitabilityGrid />

          <div className="suitability-recommendation scene-element step-7">
            <RecommendationBadge text="Engineering Assessment" />
            <p className="recommendation-text">
              {ROOF_VISION_RELEASED
                ? 'Every system layout is custom-engineered during the technical site survey to maximize annual energy yield and architectural aesthetics.'
                : 'When it arrives, every system layout will be custom-engineered during the technical site survey to maximize annual energy yield and architectural aesthetics.'}
            </p>
          </div>

          <div className="suitability-action scene-element step-8">
            <motion.a
              href="#sceneInstallation"
              className="btn-hero-primary btn-icon"
              whileHover={shouldReduceMotion ? {} : { y: -2 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              Explore Installation
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                style={{ width: 18, height: 18, marginLeft: 6 }}
              >
                <path
                  fillRule="evenodd"
                  d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </motion.a>
          </div>
        </motion.div>
      </div>
    </article>
  )
}
