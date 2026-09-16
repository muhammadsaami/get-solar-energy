import React from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { type MetricConfig, useIntersectionCounter } from '../../hooks/useIntersectionCounter'
import { useSceneVisibility } from '../../hooks/useSceneVisibility'
import { trackCTA } from '../../utils/analytics'

const METRICS: MetricConfig[] = [
  {
    key: 'warrantyYears',
    endValue: 25,
    label: 'Years Performance Life',
    suffix: '+',
    delay: 0,
  },
  {
    key: 'billReduction',
    endValue: 90,
    label: 'Typical Bill Reduction',
    prefix: '~',
    suffix: '%',
    delay: 150,
  },
  {
    key: 'discomCoverage',
    endValue: 100,
    label: 'MNRE / PM Surya Ghar',
    suffix: '% Ready',
    delay: 300,
  },
]

export default function HeroScene() {
  const shouldReduceMotion = useReducedMotion()
  const sceneRef = useSceneVisibility<HTMLElement>({
    camera: 'arrival',
    staggerSelector: '.hero-stat-item',
    staggerDelay: 150,
  })

  const containerVariants = {
    hidden: { opacity: shouldReduceMotion ? 1 : 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.09,
        delayChildren: shouldReduceMotion ? 0 : 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: shouldReduceMotion ? 1 : 0, y: shouldReduceMotion ? 0 : 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: shouldReduceMotion ? 0 : 0.55,
        ease: [0.16, 1, 0.3, 1],
      },
    },
  }

  const { values, containerRef } = useIntersectionCounter(METRICS)

  return (
    <article
      className="cinematic-scene scene-hero"
      id="sceneHero"
      data-camera="arrival"
      ref={sceneRef}
    >
      <div className="cinematic-color-grade" />
      <div className="scene-transition-mask top" />
      <div className="scene-transition-mask bottom" />
      <div className="layer-bg">
        <img
          src="/assets/Cinematic/Asset 1.webp"
          alt="Premium solar home"
          fetchPriority="high"
        />
      </div>
      <div className="lighting-overlay lighting-warm" />

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
          className="hero-left-col"
          style={{
            maxWidth: 600,
            position: 'relative',
            padding: 40,
            borderRadius: 'var(--radius-lg)',
          }}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="text-scrim-overlay" />

          <motion.div variants={itemVariants} className="hero-badge-container">
            <div className="hero-accent-badge">
              <span className="badge-check-icon">{'\u2713'}</span>
              Trusted Solar Solutions Across India
            </div>
          </motion.div>

          <motion.h1 variants={itemVariants} className="hero-main-title">
            Analyze. Plan. <br />
            <span className="highlight-orange">Save</span> with Solar.
          </motion.h1>

          <motion.p variants={itemVariants} className="hero-description-paragraph">
            Design your custom solar layout, calculate your exact savings, and verify
            government subsidies.
          </motion.p>

          <motion.div variants={itemVariants} className="hero-action-ctas">
            <motion.a
              href="#sceneEstimate"
              className="btn-hero-primary"
              onClick={() => trackCTA('hero_primary')}
              whileHover={shouldReduceMotion ? {} : { y: -2 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              Start Free Assessment
            </motion.a>
            <motion.a
              href="#sceneInstallation"
              className="btn-hero-secondary"
              onClick={() => trackCTA('hero_secondary')}
              whileHover={shouldReduceMotion ? {} : { y: -2 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
              transition={{ duration: 0.15 }}
            >
              See How It Works
            </motion.a>
          </motion.div>

          <motion.div variants={itemVariants} className="hero-trust-pills">
            <span className="trust-pill">{'\u{1F1EE}\u{1F1F3}'} PM Surya Ghar Ready</span>
            <span className="trust-pill">Government Subsidy Support</span>
            <span className="trust-pill">PAN India Coverage</span>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="hero-stats-grid"
            id="metricsStrip"
            ref={containerRef}
            style={{ marginTop: 40 }}
          >
            <div className="hero-stat-item" id="metricCard1">
              <span className="stat-num" id="metricWarranty">
                {values.warrantyYears}
              </span>
              <span className="stat-lbl">Years Performance Life</span>
            </div>
            <div className="hero-stat-item" id="metricCard2">
              <span className="stat-num" id="metricBillReduction">
                {values.billReduction}
              </span>
              <span className="stat-lbl">Typical Bill Reduction</span>
            </div>
            <div className="hero-stat-item" id="metricCard3">
              <span className="stat-num" id="metricDiscomCoverage">
                {values.discomCoverage}
              </span>
              <span className="stat-lbl">PM Surya Ghar Ready</span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </article>
  )
}
