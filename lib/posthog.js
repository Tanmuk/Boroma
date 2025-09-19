// /lib/posthog.js
// Lightweight PostHog wrapper. No-ops if key/host are missing.
// Uses plain JS (no TS casts) so it compiles on Vercel.

import posthog from 'posthog-js'

let _inited = false

export function initPostHog() {
  if (typeof window === 'undefined' || _inited) return posthog

  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'
  if (!key) return posthog

  posthog.init(key, {
    api_host: host,
    autocapture: true,          // enable autocapture
    capture_pageview: false,    // we send our own pageview events
    persistence: 'localStorage',
  })

  _inited = true
  return posthog
}

export function phCapture(event, props = {}) {
  try {
    if (typeof window !== 'undefined' && typeof posthog.capture === 'function') {
      posthog.capture(event, props)
    }
  } catch {}
}

export function phIdentify(id, props = {}) {
  try {
    if (typeof window !== 'undefined' && typeof posthog.identify === 'function' && id) {
      posthog.identify(id, props)
    }
  } catch {}
}

export function phLoaded() {
  // Plain JS check: if capture is a function, PH is ready
  return typeof window !== 'undefined' && typeof posthog.capture === 'function'
}
