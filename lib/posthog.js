// Lightweight PostHog wrapper used across the app.
// Safe in production: no-ops if env key is missing.

import posthog from 'posthog-js'

let _inited = false

export function initPostHog() {
  if (typeof window === 'undefined' || _inited) return posthog
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'
  if (!key) return posthog

  posthog.init(key, {
    api_host: host,
    autocapture: true,          // <— enable autocapture
    capture_pageview: false,    // we’ll send pageviews ourselves (Next.js router)
    persistence: 'localStorage',
  })
  _inited = true
  return posthog
}

export function phCapture(event, props = {}) {
  if (!window || !posthog || !posthog.capture) return
  posthog.capture(event, props)
}

export function phIdentify(id, props = {}) {
  if (!window || !posthog || !posthog.identify) return
  if (id) posthog.identify(id, props)
}

export function phLoaded() {
  return !!(posthog && posthog.capture && (posthog as any).config)
}
