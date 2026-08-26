import React from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useSceneVisibility } from '../../hooks/useSceneVisibility'
import GalleryGrid from './GalleryGrid'

const GALLERY_ITEMS = [
  {
    image: '/assets/Cinematic/Asset 7.webp',
    alt: 'Smart Home Integration',
    title: 'Smart Home Ready',
    description: 'Seamlessly integrate with your existing smart devices.',
  },
  {
    image: '/assets/Cinematic/Asset 8.webp',
    alt: 'Family Comfort',
    title: '24/7 Comfort',
    description: 'Run your heavy appliances without worrying about the bill.',
  },
  {
    image: '/assets/Cinematic/Asset 9.webp',
    alt: 'Real-time Monitoring',
    title: 'Live Monitoring',
    description: 'Track generation and consumption in real-time.',
  },
  {
    image: '/assets/Cinematic/Asset 10.webp',
    alt: 'Battery Storage',
    title: 'Battery Backup',
    description: 'Optional storage solutions for true independence.',
  },
  {
    image: '/assets/Cinematic/Asset 11.webp',
    alt: 'Weather Resilience',
    title: 'Weather Proof',
    description: 'Engineered to withstand monsoons and high winds.',
  },
  {
    image: '/assets/Cinematic/Asset 13.webp',
    alt: 'Evening Transition',
    title: 'Grid Sync',
    description: 'Seamless net-metering ensures you never lose power.',
  },
]

export default function LifestyleGallery() {
  const shouldReduceMotion = useReducedMotion()
  const sceneRef = useSceneVisibility<HTMLElement>({ camera: 'lifestyle' })

  return (
    <article
      ref={sceneRef}
      className="cinematic-scene scene-lifestyle"
      id="sceneLifestyle"
      data-camera="lifestyle"
      style={{
        padding: '100px 0',
        background: 'var(--bg-deep-blue)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div className="cinematic-color-grade" />
      <div className="scene-transition-mask top" />
      <div className="scene-transition-mask bottom" />
      <motion.div
        className="hero-container layer-fg scene-element"
        style={{
          width: '100%',
          maxWidth: 1400,
          padding: '0 5%',
          position: 'relative',
          zIndex: 2,
          textAlign: 'center',
          marginBottom: 60,
        }}
        initial={shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 className="section-title">Powering the Modern Indian Home</h2>
        <p
          className="section-subtitle"
          style={{ maxWidth: 600, margin: '0 auto' }}
        >
          From EV charging to uninterrupted AC during summer outages. Experience
          the peace of mind that comes with complete energy independence.
        </p>
      </motion.div>

      <motion.div
        style={{ width: '100%' }}
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.6, delay: shouldReduceMotion ? 0 : 0.15 }}
      >
        <GalleryGrid items={GALLERY_ITEMS} />
      </motion.div>
    </article>
  )
}
