import React from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useSceneVisibility } from '../../hooks/useSceneVisibility'
import GalleryGrid from './GalleryGrid'

const GALLERY_ITEMS = [
  {
    image: '/assets/Cinematic/solar_installation_1.png',
    alt: 'Residential rooftop solar installation',
    description: '"The team explained everything clearly and kept us updated throughout the installation. The whole process was smooth, and we’re very happy with the support we received."',
    footer: 'Homeowner',
  },
  {
    image: '/assets/Cinematic/solar_installation_2.png',
    alt: 'Elevated residential solar panel installation',
    description: '"From the first call to the final installation, the GSE team was professional and responsive. They answered our questions properly and made the whole process easy for us."',
    footer: 'Homeowner',
  },
  {
    image: '/assets/Cinematic/solar_installation_3.png',
    alt: 'Solar panel array on residential rooftop',
    description: '"It’s been a good experience with GET Solar Energy. The system has been running smoothly, and the team has been available whenever we needed help."',
    footer: 'Homeowner',
  },
  {
    image: '/assets/Cinematic/solar_installation_4.png',
    alt: 'Residential rooftop solar canopy installation',
    description: '"GSE handled everything from the site survey to installation and approvals. We didn’t have to worry about managing different parts of the process ourselves."',
    footer: 'Homeowner',
  },
  {
    image: '/assets/Cinematic/solar_installation_5.png',
    alt: 'Rooftop solar panel array structure',
    description: '"The quality of the work has been very good. The system has been working reliably, and the team has been straightforward and easy to deal with."',
    footer: 'Homeowner',
  },
  {
    image: '/assets/Cinematic/solar_installation_6.jpeg',
    alt: 'Residential rooftop solar panel array installation',
    description: '"We wanted a solar system that we could depend on for the long term. GSE guided us through the process, completed the installation properly, and the system has been performing well."',
    footer: 'Homeowner',
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
        <h2 className="section-title">People Who Make GSE Family Stronger</h2>
        <p
          className="section-subtitle"
          style={{ maxWidth: 600, margin: '0 auto' }}
        >
          Real homes. Real people. Real trust in clean energy.
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
