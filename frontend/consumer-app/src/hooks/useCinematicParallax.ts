import { useEffect } from 'react'
import { useReducedMotion } from './useReducedMotion'
import { useMediaQuery } from './useMediaQuery'
import type { CinematicPreset, CinematicParallaxConfig } from '../config/cinematic'

function applyParallax(
  scene: HTMLElement,
  config: CinematicParallaxConfig,
  progress: number,
) {
  const bgLayer = scene.querySelector<HTMLElement>('.layer-bg')
  if (!bgLayer) return

  const p = config.useAbsolute ? Math.abs(progress) : progress
  const transforms: string[] = []

  if (config.scale) {
    let s = config.scale.base - p * config.scale.factor
    if (config.scale.min !== undefined) s = Math.max(config.scale.min, s)
    if (config.scale.max !== undefined) s = Math.min(config.scale.max, s)
    transforms.push(`scale(${s})`)
  }

  if (config.translateX) {
    transforms.push(`translateX(${p * config.translateX.factor}px)`)
  }

  if (config.translateY) {
    let y = p * config.translateY.factor
    if (config.translateY.min !== undefined) y = Math.max(config.translateY.min, y)
    transforms.push(`translateY(${y}px)`)
  }

  bgLayer.style.transform = transforms.join(' ')
  bgLayer.style.willChange = 'transform'
}

export function useCinematicParallax(
  sceneRef: React.RefObject<HTMLElement | null>,
  preset: CinematicPreset,
) {
  const reducedMotion = useReducedMotion()
  const isMobile = useMediaQuery('(max-width: 767px)')

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene || reducedMotion || isMobile || !preset.parallax) return

    let ticking = false
    let intersecting = false

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          scene.classList.add('is-playing')
          intersecting = true
        } else {
          intersecting = false
        }
      },
      { threshold: 0.1, rootMargin: '300px 0px' },
    )
    observer.observe(scene)

    const handleScroll = () => {
      if (!ticking && intersecting) {
        requestAnimationFrame(() => {
          ticking = false
          const rect = scene.getBoundingClientRect()
          const progress = rect.top / window.innerHeight
          applyParallax(scene, preset.parallax!, progress)
        })
        ticking = true
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', handleScroll)
    }
  }, [sceneRef, preset, reducedMotion, isMobile])
}
