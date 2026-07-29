import { useEffect, useRef } from 'react'

const PARTICLE_COUNT = 20

export default function AmbientBackground() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const particles: HTMLDivElement[] = []

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const particle = document.createElement('div')
      const size = 2 + Math.random() * 4

      particle.style.position = 'absolute'
      particle.style.width = `${size}px`
      particle.style.height = `${size}px`
      particle.style.background = Math.random() > 0.5 ? '#00B5E2' : '#F59E0B'
      particle.style.borderRadius = '50%'
      particle.style.opacity = `${Math.random() * 0.15 + 0.05}`
      particle.style.top = `${Math.random() * 100}%`
      particle.style.left = `${Math.random() * 100}%`

      const floatDuration = Math.random() * 15 + 15
      particle.style.animation = `floatParticle ${floatDuration}s infinite linear alternate`

      container.appendChild(particle)
      particles.push(particle)
    }

    if (!document.getElementById('landingParticleKeyframes')) {
      const styleSheet = document.createElement('style')
      styleSheet.id = 'landingParticleKeyframes'
      styleSheet.textContent = `
        @keyframes floatParticle {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(${Math.random() * 80 - 40}px, ${Math.random() * 80 - 40}px) scale(1.3); }
        }
      `
      document.head.appendChild(styleSheet)
    }

    return () => {
      for (const p of particles) {
        p.remove()
      }
    }
  }, [])

  return (
    <div className="background-glow-atmosphere" aria-hidden="true">
      <div className="solar-glow-left" />
      <div className="energy-glow-right" />
      <div className="particle-ambient-container" id="ambientParticles" ref={containerRef} />
    </div>
  )
}
