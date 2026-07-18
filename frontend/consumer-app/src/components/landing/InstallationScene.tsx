import { useEffect, useRef } from 'react'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import WhyCard from './WhyCard'

const CARDS = [
  {
    title: 'Accurate Technology',
    description:
      'Deep learning obstruction detection ensures every panel is placed for maximum yield.',
  },
  {
    title: 'End-to-End Guidance',
    description:
      'We handle DISCOM approvals, net metering setup, and PM Surya Ghar subsidies on your behalf.',
  },
]

export default function InstallationScene() {
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
      className="cinematic-scene scene-installation"
      id="sceneInstallation"
      data-camera="installation"
    >
      <div className="cinematic-color-grade" />
      <div className="scene-transition-mask top" />
      <div className="scene-transition-mask bottom" />
      <div className="layer-bg">
        <img
          src="/frontend/assets/Cinematic/Asset 4.webp"
          alt="Professional solar installation"
          loading="lazy"
          style={{ transformOrigin: 'center right' }}
        />
      </div>
      <div className="lighting-overlay" />

      <div
        className="hero-container layer-fg scene-element"
        style={{
          width: '100%',
          maxWidth: 1200,
          padding: '0 5%',
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <div className="hero-left-col" style={{ maxWidth: 500 }}>
          <h2 className="section-title" style={{ textAlign: 'left' }}>
            Precision Engineering. <br />
            Flawless Execution.
          </h2>
          <p
            className="section-subtitle"
            style={{ textAlign: 'left', marginBottom: 30 }}
          >
            From structural roof assessments to premium hardware mounting, our
            certified EPC partners ensure your system is built to last 25+ years
            in the toughest Indian climates.
          </p>

          <div
            className="why-grid"
            style={{ gridTemplateColumns: '1fr', gap: 20 }}
          >
            {CARDS.map((card) => (
              <WhyCard
                key={card.title}
                title={card.title}
                description={card.description}
              />
            ))}
          </div>
        </div>
      </div>
    </article>
  )
}
