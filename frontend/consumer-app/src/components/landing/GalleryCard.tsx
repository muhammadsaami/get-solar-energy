import React from 'react'
import { motion, useReducedMotion } from 'motion/react'
import GalleryOverlay from './GalleryOverlay'

interface GalleryCardProps {
  image: string
  alt: string
  title: string
  description: string
}

export default function GalleryCard({ image, alt, title, description }: GalleryCardProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      style={{
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        aspectRatio: '4/5',
      }}
      whileHover={shouldReduceMotion ? {} : { y: -4, scale: 1.015 }}
      transition={{ duration: 0.25, ease: [0.2, 0.9, 0.3, 1] }}
    >
      <img
        src={image}
        alt={alt}
        loading="lazy"
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
      <GalleryOverlay title={title} description={description} />
    </motion.div>
  )
}
