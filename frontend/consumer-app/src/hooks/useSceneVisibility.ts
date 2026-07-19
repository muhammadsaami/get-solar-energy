import { useEffect, useRef } from 'react'
import { useReducedMotion } from './useReducedMotion'
import { useMediaQuery } from './useMediaQuery'

export type CameraType =
  | 'arrival'
  | 'estimate'
  | 'roof'
  | 'installation'
  | 'technology'
  | 'savings'
  | 'lifestyle'
  | 'conversion'

export interface UseSceneVisibilityOptions {
  camera?: CameraType
  staggerSelector?: string
  staggerDelay?: number
  initialDelay?: number
}

function applyCameraParallax(
  scene: HTMLElement,
  camera: CameraType,
  progress: number,
  scrollY: number,
) {
  const bgLayer = scene.querySelector<HTMLElement>('.layer-bg')
  if (!bgLayer) return

  switch (camera) {
    case 'arrival': {
      const scalePush = 1 + scrollY * 0.00005
      bgLayer.style.transform = `scale(${Math.max(1, Math.min(1.05, scalePush))})`
      break
    }
    case 'estimate': {
      const focalY = progress * 15
      bgLayer.style.transform = `translateY(${focalY}px) scale(1.02)`
      break
    }
    case 'roof': {
      const riseY = Math.max(-40, progress * 30)
      bgLayer.style.transform = `translateY(${riseY}px) scale(1.03)`
      break
    }
    case 'installation': {
      const panX = progress * -25
      bgLayer.style.transform = `translateX(${panX}px) scale(1.04)`
      break
    }
    case 'technology': {
      const macroPull = 1.05 - Math.abs(progress) * 0.03
      bgLayer.style.transform = `scale(${Math.max(1, macroPull)})`
      break
    }
    case 'savings': {
      const dronePull = 1.08 - Math.abs(progress) * 0.06
      bgLayer.style.transform = `scale(${Math.max(1, dronePull)})`
      break
    }
    case 'lifestyle': {
      bgLayer.style.transform = 'translateY(0) scale(1)'
      break
    }
    case 'conversion': {
      const ctaPush = 1 + Math.max(0, -progress) * 0.04
      bgLayer.style.transform = `scale(${Math.min(1.06, ctaPush)}) translateY(${progress * 15}px)`
      break
    }
  }
}

export function useSceneVisibility<T extends HTMLElement = HTMLElement>(
  options?: UseSceneVisibilityOptions,
) {
  const sceneRef = useRef<T>(null)
  const reducedMotion = useReducedMotion()
  const isMobile = useMediaQuery('(max-width: 767px)')

  const { camera, staggerSelector, staggerDelay = 150, initialDelay = 0 } =
    options || {}

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return

    const timeouts: number[] = []
    let isIntersecting = false

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            isIntersecting = true
            entry.target.classList.add('is-playing')
            entry.target.setAttribute('data-intersecting', 'true')

            // Trigger discrete entry animations for inner elements (excluding step-sequenced elements)
            const innerElements = entry.target.querySelectorAll(
              '.scene-element:not(.step-6):not(.step-7):not(.step-8), .why-card',
            )
            innerElements.forEach((el) => el.classList.add('is-visible'))

            // Handle optional staggered animations for items matching staggerSelector
            if (staggerSelector) {
              const staggeredElements =
                entry.target.querySelectorAll(staggerSelector)
              staggeredElements.forEach((el, index) => {
                const timer = window.setTimeout(() => {
                  el.classList.add('animate-in')
                }, initialDelay + index * staggerDelay)
                timeouts.push(timer)
              })
            }
          } else {
            isIntersecting = false
            entry.target.setAttribute('data-intersecting', 'false')
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '300px 0px',
      },
    )

    observer.observe(scene)

    // Setup parallax animation frame loop if camera is specified and motion is allowed
    let ticking = false
    let rafId = 0

    const handleScroll = () => {
      if (!camera || reducedMotion || isMobile || !isIntersecting) return

      if (!ticking) {
        rafId = requestAnimationFrame(() => {
          if (sceneRef.current) {
            const rect = sceneRef.current.getBoundingClientRect()
            const progress = rect.top / window.innerHeight
            applyCameraParallax(
              sceneRef.current,
              camera,
              progress,
              window.scrollY,
            )
          }
          ticking = false
        })
        ticking = true
      }
    }

    if (camera && !reducedMotion && !isMobile) {
      window.addEventListener('scroll', handleScroll, { passive: true })
    }

    return () => {
      observer.disconnect()
      timeouts.forEach((t) => clearTimeout(t))
      if (camera) {
        window.removeEventListener('scroll', handleScroll)
        cancelAnimationFrame(rafId)
      }
    }
  }, [
    camera,
    staggerSelector,
    staggerDelay,
    initialDelay,
    reducedMotion,
    isMobile,
  ])

  return sceneRef
}

export default useSceneVisibility
