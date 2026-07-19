import { useEffect, useRef } from 'react'
import { useScrollPosition } from '../../hooks/useScrollPosition'

export default function ScrollProgress() {
  const scrollY = useScrollPosition()
  const scrollableHeightRef = useRef(0)

  useEffect(() => {
    const updateHeight = () => {
      scrollableHeightRef.current =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight
    }

    updateHeight()
    window.addEventListener('resize', updateHeight, { passive: true })
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  const maxScroll = scrollableHeightRef.current
  const scrolled = maxScroll > 0 ? (scrollY / maxScroll) * 100 : 0

  return (
    <div
      className="scroll-progress-indicator"
      style={{ width: `${Math.min(scrolled, 100)}%` }}
      role="progressbar"
      aria-valuenow={Math.round(scrolled)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Page scroll progress"
    />
  )
}
