import { useEffect, useRef } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import RoofVisualization from './RoofVisualization'
import SuitabilityGrid from './SuitabilityGrid'
import RecommendationBadge from './RecommendationBadge'

export default function RoofSuitabilityScene() {
  const sectionRef = useRef<HTMLElement>(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    const section = sectionRef.current
    if (!section) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          section.classList.add('is-playing')
          section
            .querySelectorAll<HTMLElement>('.scene-element, .why-card')
            .forEach((el) => el.classList.add('is-visible'))
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '300px 0px' },
    )

    if (reducedMotion) {
      section.classList.add('is-playing')
      section
        .querySelectorAll<HTMLElement>('.scene-element, .why-card')
        .forEach((el) => {
          el.classList.add('is-visible')
          el.style.opacity = '1'
          el.style.transform = 'none'
        })
      return
    }

    observer.observe(section)
    return () => observer.disconnect()
  }, [reducedMotion])

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
          src="/frontend/assets/Cinematic/Asset 3.webp"
          alt="Roof suitability analysis"
          loading="lazy"
        />
      </div>
      <div className="lighting-overlay lighting-warm" />

      <div
        className="suitability-container layer-fg scene-element"
        style={{ position: 'relative', zIndex: 2 }}
      >
        <RoofVisualization />

        <div className="suitability-story-column" style={{ flex: 1 }}>
          <div className="story-header scene-element step-6">
            <h2 className="section-title" style={{ textAlign: 'left' }}>
              Your Roof Has Great Solar Potential
            </h2>
            <p className="section-subtitle" style={{ textAlign: 'left' }}>
              We analyzed your location for sunlight exposure and roof space.
            </p>
          </div>

          <SuitabilityGrid />

          <div className="suitability-recommendation scene-element step-7">
            <RecommendationBadge text="Highly Suitable" />
            <p className="recommendation-text">
              Based on your estimate, <strong>12-14 panels</strong> will fit
              comfortably on your roof, offseting 90% of your energy needs.
            </p>
          </div>

          <div className="suitability-action scene-element step-8">
            <a href="#sceneInstallation" className="btn-hero-primary btn-icon">
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
            </a>
          </div>
        </div>
      </div>
    </article>
  )
}
