export interface IdleMonitorOptions {
  timeoutMs: number
  onIdle?: () => void
  onActive?: () => void
}

const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  'mousemove',
  'keydown',
  'touchstart',
  'scroll',
  'mousedown',
  'pointerdown',
  'wheel',
]

export interface IdleMonitor {
  start(): void
  stop(): void
  markActive(): void
  isIdle(): boolean
}

export function createIdleMonitor(options: IdleMonitorOptions): IdleMonitor {
  const { timeoutMs, onIdle, onActive } = options
  let timer: ReturnType<typeof setTimeout> | null = null
  let idle = false
  let running = false

  const clearTimer = () => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  const startTimer = () => {
    clearTimer()
    timer = setTimeout(() => {
      if (!running) return
      idle = true
      onIdle?.()
    }, timeoutMs)
  }

  const markActive = () => {
    if (!running) return
    const wasIdle = idle
    idle = false
    if (wasIdle) onActive?.()
    startTimer()
  }

  const handleActivity = () => markActive()
  const handleVisibility = () => {
    if (document.visibilityState === 'visible') markActive()
  }

  return {
    start() {
      if (running || typeof window === 'undefined') return
      running = true
      idle = false
      ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, handleActivity, { passive: true }))
      document.addEventListener('visibilitychange', handleVisibility)
      startTimer()
    },

    stop() {
      if (!running) return
      running = false
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, handleActivity))
      document.removeEventListener('visibilitychange', handleVisibility)
      clearTimer()
    },

    markActive,

    isIdle() {
      return idle
    },
  }
}
