import { useRef } from 'react'
import { useCinematicParallax } from '../../hooks/useCinematicParallax'
import { CINEMATIC_PRESETS } from '../../config/cinematic'
import CTAContent from './CTAContent'
import CTAButtons from './CTAButtons'

export default function FinalCtaScene() {
  const sceneRef = useRef<HTMLElement>(null)
  useCinematicParallax(sceneRef, CINEMATIC_PRESETS.conversion)

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
          src="/frontend/assets/Cinematic/Asset 15.webp"
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

      <div
        className="hero-container layer-fg scene-element"
        style={{
          width: '100%',
          maxWidth: 1200,
          padding: '0 5%',
          position: 'relative',
          zIndex: 2,
          textAlign: 'center',
        }}
      >
        <CTAContent />
        <CTAButtons />
      </div>
    </article>
  )
}
