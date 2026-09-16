import { useEffect, useRef } from 'react'

const PARTICLE_COUNT = 25
const COLORS = [
  'rgba(23, 168, 229, 0.5)',
  'rgba(255, 138, 29, 0.4)',
  'rgba(54, 211, 153, 0.4)',
]

export default function AnimatedBackground() {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const fragments: HTMLDivElement[] = []

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const dot = document.createElement('div')
      dot.className = 'particle'
      const size = 2 + Math.random() * 3
      const color = COLORS[Math.floor(Math.random() * COLORS.length)]
      const left = Math.random() * 100
      const duration = 15 + Math.random() * 20
      const delay = Math.random() * duration

      dot.style.width = `${size}px`
      dot.style.height = `${size}px`
      dot.style.left = `${left}%`
      dot.style.background = color
      dot.style.animationDuration = `${duration}s`
      dot.style.animationDelay = `-${delay}s`

      container.appendChild(dot)
      fragments.push(dot)
    }

    return () => {
      fragments.forEach((dot) => dot.remove())
    }
  }, [])

  return (
    <div className="auth-bg" aria-hidden="true">
      <div
        className="auth-bg-img"
        style={{ backgroundImage: "url('/assets/auth_showcase_right.png')" }}
      />
      <div className="auth-bg-overlay" />
      <div className="auth-bg-grid" />
      <div className="orb orb-orange" />
      <div className="orb orb-blue" />
      <div className="orb orb-green" />
      <div className="particles" ref={containerRef} />
    </div>
  )
}
