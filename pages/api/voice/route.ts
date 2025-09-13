// pages/api/voice/route.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

/**
 * Twilio posts application/x-www-form-urlencoded. We disable Next's body parser
 * and parse the raw body ourselves so the handler works reliably.
 */
export const config = { api: { bodyParser: false } }

// ---------- Helpers ----------
function xml(body: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n${body}`
}

function sayAndHangup(message: string) {
  return xml(`<Response><Say voice="alice">${message}</Say><Hangup/></Response>`)
}

function onlyDigits(s: string) {
  return (s || '').replace(/\D/g, '')
}
function last10(s: string) {
  const d = onlyDigits(s)
  return d.slice(-10)
}

function pickStr(v: unknown): string {
  if (typeof v === 'string') return v
  if (Array.isArray(v) && v.length) return String(v[0] ?? '')
  return ''
}

async function readFormParams(req: NextApiRequest): Promise<Record<string, string>> {
  if (req.method === 'GET') {
    // Twilio can hit as GET during testing; support it.
    const out: Record<string, string> = {}
    for (const [k, v] of Object.entries(req.query)) out[k] = pickStr(v)
    return out
  }

  // POST: read raw body and parse as URL-encoded
  const raw = await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })

  const p = new URLSearchParams(raw.toString('utf8'))
  const out: Record<string, string> = {}
  p.forEach((value, key) => (out[key] = value))
  return out
}

// ---------- Main handler ----------
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'POST, GET')
    return res.status(405).send('Method Not Allowed')
  }

  try {
    const params = await readFormParams(req)

    // Twilio sends both; prefer From/To, but fall back to Caller/Called
    const fromRaw = params.From || params.Caller || ''
    const toRaw = params.To || params.Called || ''

    // Normalize for DB matching and routing
    const fromE164 = pickStr(fromRaw)
    const toE164 = pickStr(toRaw)
    const fromDigits = last10(fromE164)

    // Your configured toll-free and agent numbers
    const TOLLFREE = process.env.TWILIO_TOLLFREE || process.env.NEXT_PUBLIC_TOLLFREE || ''
    const AGENT = process.env.VAPI_AGENT_NUMBER || ''

    const tollfreeDigits = last10(TOLLFREE)
    const callToIsTollfree = last10(toE164) === tollfreeDigits

    // If this endpoint is only for the toll-free, you can keep this check strict.
    // Otherwise you could relax it and still run the lookup.
    if (!callToIsTollfree) {
      res.setHeader('Content-Type', 'text/xml')
      return res
        .status(200)
        .send(sayAndHangup('This number is not configured for this route.'))
    }

    // --- Member Lookup (phone or last 10) ---
    const { data: member, error: mErr } = await supabaseAdmin
      .from('members')
      .select('id,user_id,phone,phone_digits,subscription_id')
      .or(`phone.eq.${fromE164},phone_digits.eq.${fromDigits}`)
      .maybeSingle()

    if (mErr) {
      // Fail safe: never expose internals to the caller
      res.setHeader('Content-Type', 'text/xml')
      return res
        .status(200)
        .send(sayAndHangup('Sorry, a system error occurred. Please try again later.'))
    }

    if (!member) {
      // Non-member policy for toll-free: CTA only, then hang up (no trial forwarding)
      res.setHeader('Content-Type', 'text/xml')
      const msg =
        'This number is for Boroma members. Please visit boroma dot site to start a plan.'
      return res.status(200).send(sayAndHangup(msg))
    }

    // --- Subscription gating ---
    let active = false
    if (member.subscription_id) {
      const { data: sub } = await supabaseAdmin
        .from('subscriptions')
        .select('status,current_period_end,cancel_at_period_end')
        .eq('id', member.subscription_id)
        .maybeSingle()

      if (sub) {
        const stillInPeriod =
          !sub.current_period_end || new Date(sub.current_period_end) > new Date()
        active =
          (sub.status === 'active' || sub.status === 'trialing') &&
          stillInPeriod &&
          (sub.cancel_at_period_end === false || sub.cancel_at_period_end == null)
      }
    }

    if (!active) {
      res.setHeader('Content-Type', 'text/xml')
      const msg =
        'Your Boroma plan is not active. Please visit your dashboard to manage billing.'
      return res.status(200).send(sayAndHangup(msg))
    }

    // --- Forward to the Vapi Agent number ---
    if (!AGENT) {
      res.setHeader('Content-Type', 'text/xml')
      return res
        .status(200)
        .send(sayAndHangup('Sorry, no agent line is configured.'))
    }

    // Use your toll-free as callerId when dialing the agent
    const dialXml = xml(
      `<Response>
         <Dial callerId="${TOLLFREE}" answerOnBridge="true" timeout="25">
           <Number>${AGENT}</Number>
         </Dial>
       </Response>`
    )

    res.setHeader('Content-Type', 'text/xml')
    return res.status(200).send(dialXml)
  } catch {
    res.setHeader('Content-Type', 'text/xml')
    return res
      .status(200)
      .send(sayAndHangup('Sorry, a system error occurred. Please try again later.'))
  }
}
