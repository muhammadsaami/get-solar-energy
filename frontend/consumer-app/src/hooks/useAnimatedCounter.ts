import { useState, useEffect, useRef } from 'react'
import { useReducedMotion } from './useReducedMotion'

interface AnimatedCounterOptions {
  prefix?: string
  suffix?: string
  decimals?: number
  duration?: number
  isPrefix?: boolean
  enabled?: boolean
}

function formatValue(
  value: number,
  prefix: string,
  suffix: string,
  decimals: number,
  isPrefix: boolean,
): string {
  let formatted: string
  if (decimals > 0) {
    formatted = value.toFixed(decimals)
  } else {
    formatted = Math.round(value).toLocaleString('en-IN')
  }
  return isPrefix ? prefix + formatted + suffix : formatted + suffix
}

export function useAnimatedCounter(
  end: number,
  options: AnimatedCounterOptions = {},
): string {
  const {
    prefix = '',
    suffix = '',
    decimals = 0,
    duration = 1000,
    isPrefix = false,
    enabled = false,
  } = options

  const reducedMotion = useReducedMotion()

  const initValue = reducedMotion
    ? formatValue(end, prefix, suffix, decimals, isPrefix)
    : formatValue(0, prefix, suffix, decimals, isPrefix)

  const [display, setDisplay] = useState(initValue)
  const frameRef = useRef(0)

  useEffect(() => {
    if (!enabled) return

    if (reducedMotion) {
      setDisplay(formatValue(end, prefix, suffix, decimals, isPrefix))
      return
    }

    const startTime = performance.now()

    function step(timestamp: number) {
      const elapsed = timestamp - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)

      const current = end * eased
      setDisplay(formatValue(current, prefix, suffix, decimals, isPrefix))

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step)
      }
    }

    frameRef.current = requestAnimationFrame(step)

    return () => {
      cancelAnimationFrame(frameRef.current)
    }
  }, [enabled, end, prefix, suffix, decimals, duration, isPrefix, reducedMotion])

  return display
}
