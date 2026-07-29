import { useState, useEffect, useRef } from 'react'
import { useReducedMotion } from './useReducedMotion'

export interface MetricConfig {
  key: string
  endValue: number
  label: string
  prefix?: string
  suffix?: string
  delay?: number
  duration?: number
  decimals?: number
}

function formatValue(
  value: number,
  prefix = '',
  suffix = '',
  decimals = 0,
): string {
  let formatted: string
  if (decimals > 0) {
    formatted = value.toFixed(decimals)
  } else {
    formatted = Math.round(value).toLocaleString('en-IN')
  }
  return prefix + formatted + suffix
}

export function useIntersectionCounter(metrics: MetricConfig[]) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [hasAnimated, setHasAnimated] = useState(false)
  const reducedMotion = useReducedMotion()

  const initValues: Record<string, string> = {}
  for (const m of metrics) {
    initValues[m.key] = '-'
  }
  const [values, setValues] = useState<Record<string, string>>(initValues)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const timeouts: number[] = []
    const frames: number[] = []

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        observer.disconnect()
        setHasAnimated(true)

        if (reducedMotion) {
          const finalValues: Record<string, string> = {}
          for (const m of metrics) {
            finalValues[m.key] = formatValue(
              m.endValue,
              m.prefix,
              m.suffix,
              m.decimals,
            )
          }
          setValues(finalValues)
          return
        }

        for (const m of metrics) {
          const delay = m.delay ?? 0
          const duration = m.duration ?? 2000

          const timeoutId = window.setTimeout(() => {
            const startTime = performance.now()

            function step(timestamp: number) {
              const elapsed = timestamp - startTime
              const progress = Math.min(elapsed / duration, 1)
              const eased = 1 - Math.pow(1 - progress, 4)

              const current = m.endValue * eased
              setValues((prev) => ({
                ...prev,
                [m.key]: formatValue(
                  current,
                  m.prefix,
                  m.suffix,
                  m.decimals,
                ),
              }))

              if (progress < 1) {
                const frame = requestAnimationFrame(step)
                frames.push(frame)
              }
            }

            const frame = requestAnimationFrame(step)
            frames.push(frame)
          }, delay)

          timeouts.push(timeoutId)
        }
      },
      { threshold: 0.1 },
    )

    observer.observe(container)

    return () => {
      observer.disconnect()
      for (const t of timeouts) {
        clearTimeout(t)
      }
      for (const f of frames) {
        cancelAnimationFrame(f)
      }
    }
  }, [metrics, reducedMotion])

  return { values, containerRef, hasAnimated }
}
