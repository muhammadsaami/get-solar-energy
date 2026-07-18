import { useScrollPosition } from '../../hooks/useScrollPosition'

export default function ScrollProgress() {
  const scrollY = useScrollPosition()

  let scrolled = 0
  if (typeof document !== 'undefined') {
    const height =
      document.documentElement.scrollHeight -
      document.documentElement.clientHeight
    scrolled = height > 0 ? (scrollY / height) * 100 : 0
  }

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
