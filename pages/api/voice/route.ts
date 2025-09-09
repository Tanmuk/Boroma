// pages/api/voice/route.ts
// Toll-free line entry point (MEMBERS ONLY). Non-members hear a short message.
// Twilio Console → Toll-free Number → Voice Webhook (POST) → https://YOURDOMAIN.com/api/voice/route

import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

export const config = { api: { bodyParser: false } }

/** -------------------- LIMITS --------------------
 * Keep these tiny while testing, then bump for prod.
 * MEMBER_LIMIT_SEC_TEST = 60s (test)  →  set to 2100 (35 min) in prod
 * REMINDER_SOFT_AT_SEC is for your Vapi assistant to announce (soft); hard cap is enforced here.
 */
const MEMBER_LIMIT_SEC_TEST = 60       // ← change to 2100 for production (35 min)
const REMINDER_SOFT_AT_SEC_TEST = 30   // ← change to 1500 for production (25 min)

// ---------- ENV ----------
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!
const BASE_URL     = process.env.NEXT_PUBLIC_SITE_URL || 'https://boroma.site'

// Toll-free we advertise to paying members:
const TOLL_FREE = (process.env.NEXT_PUBLIC_PRIMARY_PHONE || '').replace(/\s/g, '') // e.g. +18777666307

// Our Vapi assistant number we actually dial:
const VAPI_AGENT_NUMBER =
  (process.env.VAPI_AGENT_NUMBER || '').replace(/\s/g, '') ||
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

function toE164(usLike: string | null | undefined) {
  if (!usLike) return ''
  const d = String(usLike).replace(/^tel:/, '').replace(/\D/g, '')
  if (!d) return ''
  if (d.length === 10) return `+1${d}`
  if (d.length === 11 && d.startsWith('1')) return `+${d}`
  return `+${d}`
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const qs = new URLSearchParams((req.url?.split('?')[1]) || '')
    const ctype = (req.headers['content-type'] || '').toLowerCase()

    // --- Parse Twilio params (POST form by default) ---
    let fromRaw = ''
    let toRaw = ''
    if (req.method === 'POST') {
      const raw = await readRawBody(req)
      if (ctype.includes('application/json')) {
        const body = JSON.parse(raw || '{}')
        fromRaw = body.From || body.from || ''
        toRaw   = body.To   || body.to   || ''
      } else {
        const form = new URLSearchParams(raw)
        fromRaw = form.get('From') || ''
        toRaw   = form.get('To')   || ''
      }
    } else {
      // GET fallback so Twilio never gets 405
      fromRaw = qs.get('From') || ''
      toRaw   = qs.get('To')   || ''
    }

    const caller = toE164(fromRaw)
    const called = toE164(toRaw)

    // If we can’t read caller, fail softly.
    if (!caller) {
      res.setHeader('Content-Type', 'text/xml')
      return res
        .status(200)
        .send(xml(`<Say>Thanks for calling Boroma. Please try again later.</Say>`))
    }

    // If Supabase creds missing, never 500 a live call.
    if (!SUPABASE_URL || !SERVICE_KEY) {
      res.setHeader('Content-Type', 'text/xml')
      return res
        .status(200)
        .send(xml(`<Say>Thanks for calling Boroma. Please visit boroma dot site to buy a plan.</Say>`))
    }

    const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

    // -------------------- MEMBERS ONLY for toll-free --------------------
    // If this webhook is wired to your toll-free, enforce membership.
    const isTollFree = TOLL_FREE && called && called === TOLL_FREE

    // Make robust candidates for lookup
    const digits = caller.replace(/\D/g, '')
    const candidates = Array.from(new Set([caller, `+${digits}`].filter(Boolean)))

    let member: { id: string; status: string; phone: string } | null = null

    // Look up in members table by .in() to avoid the 400 you saw
    {
      const { data, error } = await sb
        .from('members')
        .select('id,status,phone')
        .in('phone', candidates)
        .limit(1)
        .maybeSingle()

      if (!error && data) member = data as any
    }

    // Treat active/trialing/paid as allowed
    const isPaid = !!member && ['active', 'trialing', 'paid'].includes((member as any).status || '')

    if (isTollFree && !isPaid) {
      // Not a member calling toll-free → block with a clear message.
      res.setHeader('Content-Type', 'text/xml')
      return res
        .status(200)
        .send(
          xml(
            `<Say>Thanks for calling Boroma. Our toll free support is for members. Please buy a plan at boroma dot site.</Say>`
          )
        )
    }

    // -------------------- Log start (member call) --------------------
    const afterUrl = `${BASE_URL}/api/voice/after`

    // If it’s a valid member on toll-free, record as in_progress
    if (isTollFree && isPaid) {
      await sb.from('tollfree_call_logs').insert({
        member_id: (member as any).id || null,
        phone: caller,
        status: 'in_progress',
        is_trial: false,
        started_at: new Date().toISOString()
      })
    }

    // -------------------- Connect to Vapi assistant with cap --------------------
    // Hard cap for test; raise to 35 min in prod by editing MEMBER_LIMIT_SEC_TEST above.
    const TIME_LIMIT = MEMBER_LIMIT_SEC_TEST
    // Soft reminder moment (have your Vapi assistant speak it; we can’t inject mid-bridge audio here)
    const SOFT_REMINDER_AT = REMINDER_SOFT_AT_SEC_TEST
    // (If you’re calling an eligibility API from Vapi, keep these values in sync there.)

    const twiml = xml(`
      <Say>Connecting you to Boroma.</Say>
      <Dial answerOnBridge="true" timeout="60" timeLimit="${TIME_LIMIT}" action="${afterUrl}" method="POST">
        <Number>${VAPI_AGENT_NUMBER}</Number>
      </Dial>
    `)

    res.setHeader('Content-Type', 'text/xml')
    return res.status(200).send(twiml)
  } catch (err) {
    // Never surface a 500 to the caller; speak a friendly error.
    res.setHeader('Content-Type', 'text/xml')
    return res
      .status(200)
      .send(xml(`<Say>Sorry, a system error occurred. Please try again later.</Say>`))
  }
}
