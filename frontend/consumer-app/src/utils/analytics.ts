type CTAPayload =
  | string
  | { action: string; location?: string; timestamp?: number; [key: string]: unknown }

export function trackCTA(payload: CTAPayload) {
  if (typeof payload === 'string') {
    payload = { action: payload, location: 'unknown', timestamp: Date.now() }
  }
  console.log('[CTA]', payload)
}
