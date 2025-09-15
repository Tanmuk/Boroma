import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// If you ever change Twilio to send x-www-form-urlencoded again,
// Next.js can still handle it, but we're primarily expecting JSON.
// No need to disable bodyParser here.
export const config = {
  api: { bodyParser: true },
}

// Helpers
const xml = (s: string) => `<?xml version="1.0" encoding="UTF-8"?>\n${s}`

function sayAndHangup(message: string) {
  return xml(
    `<Response>
      <Say voice="alice">${escapeXml(message)}</Say>
      <Hangup/>
    </Response>`
  )
}

function escapeXml(input: string) {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function last10(num?: string | null) {
  if (!num) return null
  const only = num.replace(/[^0-9]/g, '')
  return only.slice(-10) || null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).send('Method Not Allowed')
  }

  try {
    const body: any = req.body || {}

    // Twilio may send JSON with lower-cased keys (if set to JSON) or
    // classic form keys (From/To). Try both.
    const fromRaw: string | undefined =
      body?.From || body?.from || body?.Caller || body?.customer?.number
    const toRaw: string | undefined = body?.To || body?.to
    const fromDigits = last10(fromRaw)
    const toDigits = last10(toRaw)

    // Log the webhook for observability
    await supabaseAdmin.from('webhook_event_logs').insert({
      source: 'twilio.trial',
      payload: body,
    })

    // Basic env validation
    const VAPI = process.env.VAPI_AGENT_NUMBER
    if (!VAPI) {
      const msg =
        'Sorry, our trial line is temporarily unavailable. Please try again soon.'
      res.setHeader('Content-Type', 'application/xml')
      return res.status(200).send(sayAndHangup(msg))
    }

    const MAX_SECS = parseInt(process.env.TRIAL_MAX_SECONDS || '480', 10) // 8 minutes default

    if (!fromDigits) {
      res.setHeader('Content-Type', 'application/xml')
      return res
        .status(200)
        .send(
          sayAndHangup(
            'We could not detect your caller ID. Please call again from a standard number.'
          )
        )
    }

    // Enforce "one trial call per phone number"
    // public.trial_calls: phone_digits (unique), first_call_at, call_count
    const { data: existing, error: fetchErr } = await supabaseAdmin
      .from('trial_calls')
      .select('id, phone_digits, call_count, first_call_at')
      .eq('phone_digits', fromDigits)
      .maybeSingle()

    if (fetchErr) {
      // Fail safe: if DB lookup fails, do not give away unlimited calls—just speak a helpful message.
      res.setHeader('Content-Type', 'application/xml')
      return res
        .status(200)
        .send(
          sayAndHangup(
            'We are experiencing high traffic. Please try again in a few minutes.'
          )
        )
    }

    if (!existing) {
      // First-ever trial call for this phone. Insert row with call_count=1
      await supabaseAdmin.from('trial_calls').insert({
        phone_digits: fromDigits,
        call_count: 1,
        first_call_at: new Date().toISOString(),
      })

      // Connect to Vapi agent with time limit
      const responseXml = xml(
        `<Response>
          <Say voice="alice">Connecting you now.</Say>
          <Dial timeLimit="${MAX_SECS}">
            <Number>${escapeXml(VAPI)}</Number>
          </Dial>
        </Response>`
      )
      res.setHeader('Content-Type', 'application/xml')
      return res.status(200).send(responseXml)
    }

    // Already has a record — only 1 trial call is allowed
    // (If you decide later to allow N calls, check existing.call_count < N and update.)
    res.setHeader('Content-Type', 'application/xml')
    return res
      .status(200)
      .send(
        sayAndHangup(
          'Your free trial has already been used. Please visit boroma dot site to start a plan.'
        )
      )
  } catch (err: any) {
    console.error('trial webhook error:', err)
    res.setHeader('Content-Type', 'application/xml')
    return res
      .status(200)
      .send(
        sayAndHangup(
          'Something went wrong on our side. Please try again in a few minutes.'
        )
      )
  }
}
