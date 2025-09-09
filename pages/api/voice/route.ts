// Toll-free entry: MEMBERS ONLY. Non-members hear "buy a plan" message.
// Twilio → Voice Webhook (POST x-www-form-urlencoded) → /api/voice/route

import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

export const config = { api: { bodyParser: false } }

/** ---------- TEST LIMITS ----------
 * Keep tiny while testing. After testing:
 * MEMBER_LIMIT_SEC_TEST → 2100 (35 min)
 * REMINDER_SOFT_AT_SEC_TEST → 1500 (25 min) (spoken by your Vapi agent)
 */
const MEMBER_LIMIT_SEC_TEST = 60
const REMINDER_SOFT_AT_SEC_TEST = 30

// ---------- ENV ----------
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!
const BASE_URL     = process.env.NEXT_PUBLIC_SITE_URL || 'https://boroma.site'
const TOLL_FREE    = (process.env.NEXT_PUBLIC_PRIMARY_PHONE || '').replace(/\s/g, '') // +18777666307
const VAPI_AGENT_NUMBER =
  (process.env.VAPI_AGENT_NUMBER || '').replace(/\s/g, '')

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

function toE164(n: string | null | undefined) {
  if (!n) return ''
  const s = String(n).replace(/^tel:/, '').replace(/\D/g, '')
  if (!s) return ''
  if (s.length === 10) return `+1${s}`
  if (s.length === 11 && s.startsWith('1')) return `+${s}`
  return `+${s}`
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const qs = new URLSearchParams((req.url?.split('?')[1]) || '')
    const ctype = (req.headers['content-type'] || '').toLowerCase()

    // ---- Read From/To the way Twilio really sends them (urlencoded POST) ----
    let fromRaw = ''
    let toRaw   = ''
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
      // GET fallback, so we can test in a browser
      fromRaw = qs.get('From') || ''
      toRaw   = qs.get('To')   || ''
    }

    const caller = toE164(fromRaw)            // e.g. +17722777570
    const called = toE164(toRaw)              // e.g. +18777666307
    const digits = caller.replace(/\D/g, '')  // e.g. 17722777570

    if (!caller) {
      res.setHeader('Content-Type', 'text/xml')
      return res.status(200).send(xml(`<Say>Thanks for calling Boroma. Please try again later.</Say>`))
    }

    if (!SUPABASE_URL || !SERVICE_KEY) {
      // Fail soft if env is missing
      res.setHeader('Content-Type', 'text/xml')
      return res.status(200).send(xml(`<Say>Thanks for calling Boroma. Please visit boroma dot site to buy a plan.</Say>`))
    }

    const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

    // Figure out if this is the toll-free (members-only) line
    const isTollFree = TOLL_FREE && called && (called === TOLL_FREE)

    // ---------- MEMBER LOOKUP (E.164 + digits fallback) ----------
    const candidates = Array.from(new Set([caller, `+${digits}`]))
    let member: { id: string; status: string; phone: string } | null = null

    // 1) E.164
    {
      const { data, error } = await sb
        .from('members')
        .select('id,status,phone')
        .in('phone', candidates)
        .limit(1)
        .maybeSingle()
      if (!error && data) member = data as any
    }
    // 2) digits-only fallback (uses your phone_digits column)
    if (!member && digits) {
      const { data } = await sb
        .from('members')
        .select('id,status,phone')
        .eq('phone_digits', digits)
        .limit(1)
        .maybeSingle()
      if (data) member = data as any
    }

    const status = (member?.status || '').toLowerCase()
    const isPaid = !!member && ['active', 'trialing', 'paid'].includes(status)

    // ---------- MEMBERS-ONLY GATE ----------
    if (isTollFree && !isPaid) {
      res.setHeader('Content-Type', 'text/xml')
      return res
        .status(200)
        .send(
          xml(
            `<Say>Thanks for calling Boroma. Our toll free support is for members. Please buy a plan at boroma dot site.</Say>`
          )
        )
    }

    // ---------- (Optional) log start (ignore errors quietly) ----------
    try {
      if (isTollFree && isPaid) {
        await sb.from('tollfree_call_logs').insert({
          member_id: (member as any)?.id || null,
          phone: caller,
          status: 'in_progress',
          is_trial: false,
          started_at: new Date().toISOString(),
        })
      }
    } catch { /* no-op */ }

    // ---------- Connect to Vapi with a hard cap ----------
    const TIME_LIMIT = MEMBER_LIMIT_SEC_TEST
    const afterUrl = `${BASE_URL}/api/voice/after` // receives Dial action webhook

    const twiml = xml(`
      <Say>Connecting you to Boroma.</Say>
      <Dial answerOnBridge="true" timeout="60" timeLimit="${TIME_LIMIT}" action="${afterUrl}" method="POST">
        <Number>${VAPI_AGENT_NUMBER}</Number>
      </Dial>
    `)

    res.setHeader('Content-Type', 'text/xml')
    return res.status(200).send(twiml)
  } catch {
    // Never 500 to Twilio; speak a friendly error
    res.setHeader('Content-Type', 'text/xml')
    return res.status(200).send(xml(`<Say>Sorry, a system error occurred. Please try again later.</Say>`))
  }
}
