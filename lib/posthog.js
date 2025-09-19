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
    capture_pageview: true,
    capture_pageleave: true,    // we send our own pageview events
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

// --- Prospect & Customer identity helpers ---
export function getOrCreateBoromaId() {
  try {
    if (typeof window === 'undefined') return null
    let id = localStorage.getItem('boroma_user_id')
    if (!id) {
      id = 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9)
      localStorage.setItem('boroma_user_id', id)
    }
    return id
  } catch { return null }
}

export function identifyProspect(extra = {}) {
  try {
    const id = getOrCreateBoromaId()
    if (!id || !phLoaded()) return
    // user shows interest (clicked free trial / viewed pricing etc.)
    posthog.identify(id, {
      user_type: 'prospect',
      traffic_source: document.referrer || 'direct',
      first_visit: new Date().toISOString(),
      ...extra,
    })
  } catch {}
}

export function identifyCustomer({ plan_type, discount_used } = {}) {
  try {
    const id = getOrCreateBoromaId()
    if (!id || !phLoaded()) return
    posthog.identify(id, {
      user_type: 'customer',
      plan_type,                           // 'monthly' | 'annual'
      signup_date: new Date().toISOString(),
      discount_used,                       // e.g. 'LAUNCH40'
    })
  } catch {}
}

