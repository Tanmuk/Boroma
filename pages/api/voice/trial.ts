// pages/api/voice/trial.ts
// Trial line: exactly ONE free call, then require purchase.
// Twilio will POST here. We respond with TwiML and <Dial> the Vapi assistant.
//
// ENV needed:
//   NEXT_PUBLIC_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   NEXT_PUBLIC_SITE_URL                    (fallback: https://boroma.site)
//   VAPI_AGENT_NUMBER                       (your Vapi assistant, e.g. +13392091065)
// Optional fallbacks (kept for safety):
//   NEXT_PUBLIC_VAPI_AGENT_NUMBER
//
// After you finish testing, change FREE_CALL_LIMIT_SEC_TEST to 480 (8 minutes).

import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

export const config = { api: { bodyParser: false } }

// ---------- TEST LIMIT (30s for quick checks). For prod set to 480 (8 min). ----------
const FREE_CALL_LIMIT_SEC_TEST = 30

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!
const BASE_URL     = process.env.NEXT_PUBLIC_SITE_URL || 'https://boroma.site'

// Use your current env names; dial ONLY the Vapi agent (not the toll-free).
const VAPI_AGENT_NUMBER =
  process.env.VAPI_AGENT_NUMBER ||
  process.env.NEXT_PUBLIC_VAPI_AGENT_NUMBER ||
  '+13392091065'

// ---------- helpers ----------
const xml = (inner: string) =>
  `<?xml version="1.0" encoding="UTF-8"?><Response>${inner}</Response>`

function readRawBody(req: NextApiRequest) {
  return new Promise<string>((resolve, reject) => {
    let data = ''
    req.on('data', (c) => (data += c))
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

function normalizeToE164(input?: string | null) {
  if (!input) return ''
  const digits = String(input).replace(/^tel:/, '').replace(/\D/g, '')
  return digits ? `+${digits}` : ''
}

// ---------- handler ----------
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Accept POST (Twilio) and GET fallback so Twilio never sees 405
    const qs = new URLSearchParams((req.url?.split('?')[1]) || '')
    const ctype = (req.headers['content-type'] || '').toLowerCase()

    let caller = ''

    if (req.method === 'POST') {
      const raw = await readRawBody(req)
      if (ctype.includes('application/json')) {
        const body = JSON.parse(raw || '{}')
        caller = normalizeToE164(body.From || body.from)
      } else {
        const form = new URLSearchParams(raw)
        caller = normalizeToE164(form.get('From'))
      }
    } else {
      caller = normalizeToE164(qs.get('From'))
    }

    // Graceful fallback if we can't read caller
    if (!caller) {
      res.setHeader('Content-Type', 'text/xml')
      return res.status(200).send(xml(`<Say>Thanks for calling Boroma. Please try again later.</Say>`))
    }

    // If Supabase creds are missing, don't 500 the call—just speak a message
    if (!SUPABASE_URL || !SERVICE_KEY) {
      res.setHeader('Content-Type', 'text/xml')
      return res
        .status(200)
        .send(xml(`<Say>Thanks for calling Boroma. Please visit boroma dot site to buy a plan.</Say>`))
    }

    const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

    // Block if this number already used a trial (completed or in_progress)
    const { count: usedCount } = await sb
      .from('tollfree_call_logs')
      .select('id', { head: true, count: 'exact' })
      .eq('phone', caller)
      .eq('is_trial', true)
      .in('status', ['in_progress', 'completed'])

    if ((usedCount || 0) > 0) {
      res.setHeader('Content-Type', 'text/xml')
      return res
        .status(200)
        .send(xml(`<Say>Your free trial has already been used. Please buy a plan at boroma dot site.</Say>`))
    }

    // Insert log as "in_progress"
    await sb.from('tollfree_call_logs').insert({
      member_id: null,
      phone: caller,
      status: 'in_progress',
      is_trial: true,
      started_at: new Date().toISOString()
    })

    // After the call ends Twilio POSTs here (marks completed + duration)
    const afterUrl = `${BASE_URL}/api/voice/after`

    // TwiML: short announcement, then dial the Vapi agent with strict cap
    const twiml = xml(`
      <Say>Welcome to Boroma. This is a free trial call and may end automatically.</Say>
      <Dial answerOnBridge="true" timeout="60" timeLimit="${FREE_CALL_LIMIT_SEC_TEST}" action="${afterUrl}" method="POST">
        <Number>${VAPI_AGENT_NUMBER}</Number>
      </Dial>
    `)

    res.setHeader('Content-Type', 'text/xml')
    return res.status(200).send(twiml)
  } catch (e) {
    // Never surface server errors to Twilio callers
    res.setHeader('Content-Type', 'text/xml')
    return res
      .status(200)
      .send(xml(`<Say>Sorry, a system error occurred. Please try again later.</Say>`))
  }
}
