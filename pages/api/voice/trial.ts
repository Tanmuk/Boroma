// pages/api/voice/trial.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// Twilio posts x-www-form-urlencoded by default. We'll parse manually.
export const config = { api: { bodyParser: false } }

type TwilioInbound = {
  From?: string
  To?: string
  CallSid?: string
}

async function readRawBody(req: NextApiRequest): Promise<Buffer> {
  const chunks: Uint8Array[] = []
  for await (const c of req) chunks.push(typeof c === 'string' ? Buffer.from(c) : c)
  return Buffer.concat(chunks)
}

function parseBody(buf: Buffer, req: NextApiRequest): TwilioInbound {
  const ct = (req.headers['content-type'] || '').toLowerCase()
  const text = buf.toString('utf8').trim()

  // x-www-form-urlencoded (Twilio default)
  if (ct.includes('application/x-www-form-urlencoded')) {
    const p = new URLSearchParams(text)
    const o: any = {}
    p.forEach((v, k) => (o[k] = v))
    return o as TwilioInbound
  }

  // JSON (Postman tests etc.)
  try {
    return JSON.parse(text || '{}')
  } catch {
    return {}
  }
}

const last10 = (n?: string | null) => (n || '').replace(/[^\d]/g, '').slice(-10) || null
const xml = (s: string) => `<?xml version="1.0" encoding="UTF-8"?>\n${s}`

function sayAndHangup(message: string) {
  return xml(
    `<Response>
       <Say voice="alice">${message}</Say>
       <Hangup/>
     </Response>`
  )
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Accept POST (Twilio) and GET (browser sanity checks)
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'POST, GET')
    return res.status(405).send('Method Not Allowed')
  }

  // Quick GET probe returns OK TwiML (helps when you paste the URL in a browser)
  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'text/xml')
    return res.status(200).send(
      xml(`<Response><Say voice="alice">Boroma trial line is online.</Say></Response>`)
    )
  }

  const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://boroma.site'
  const VAPI_AGENT_NUMBER = (process.env.VAPI_AGENT_NUMBER || '').trim() // e.g. +13392091065
  const TRIAL_MAX_SECONDS = Number(process.env.TRIAL_MAX_SECONDS || 480) // 8 min default

  if (!VAPI_AGENT_NUMBER) {
    res.setHeader('Content-Type', 'text/xml')
    return res
      .status(200)
      .send(sayAndHangup('Our trial line is temporarily unavailable. Please try again later.'))
  }

  try {
    const buf = await readRawBody(req)
    const body = parseBody(buf, req)

    const callSid = body.CallSid || null
    const fromDigits = last10(body.From)
    const toDigits = last10(body.To)

    // Defensive: if we don't know the caller, bail politely
    if (!fromDigits) {
      res.setHeader('Content-Type', 'text/xml')
      return res
        .status(200)
        .send(sayAndHangup('We could not recognize your number. Please try again.'))
    }

    // 1) Trial limit check / update
    // Table: public.trial_calls (phone_digits unique, first_call_at, call_count)
    const { data: trialRow, error: trialErr } = await supabaseAdmin
      .from('trial_calls')
      .select('id, call_count')
      .eq('phone_digits', fromDigits)
      .maybeSingle()

    let allowed = false
    if (trialErr) {
      // Non-blocking – treat as first call but log the issue
      await supabaseAdmin.from('webhook_event_logs').insert({
        source: 'trial_route_warning',
        payload: { error: trialErr.message, fromDigits },
      })
    }

    if (!trialRow) {
      // First ever call → create row with call_count = 1
      const { error: insErr } = await supabaseAdmin
        .from('trial_calls')
        .insert({ phone_digits: fromDigits, call_count: 1 })
      if (!insErr) allowed = true
    } else {
      // Subsequent calls → bump count and check
      const newCount = (Number(trialRow.call_count || 1) + 1) | 0
      const { error: upErr } = await supabaseAdmin
        .from('trial_calls')
        .update({ call_count: newCount })
        .eq('id', trialRow.id)

      allowed = newCount <= 1 // 1 call total allowed
    }

    // 2) If not allowed → speak & hang up
    if (!allowed) {
      res.setHeader('Content-Type', 'text/xml')
      return res.status(200).send(
        sayAndHangup(
          'Thanks for calling Boroma. The free trial line can be used once per number. ' +
            'Please visit boroma dot site to start a plan.'
        )
      )
    }

    // 3) Insert a lightweight "calls" row immediately (helpful for dashboards)
    try {
      await supabaseAdmin.from('calls').insert({
        source: 'twilio_trial',
        is_trial: true,
        from_number: fromDigits ? `+${fromDigits}` : null,
        to_number: toDigits ? `+${toDigits}` : null,
        started_at: new Date().toISOString(),
        status: 'in_progress',
      })
    } catch (e) {
      await supabaseAdmin.from('webhook_event_logs').insert({
        source: 'trial_calls_insert_error',
        payload: { error: (e as any)?.message || String(e), fromDigits, toDigits },
      })
    }

    // 4) Build TwiML to connect to Vapi agent for TRIAL_MAX_SECONDS and
    //    notify our status endpoint so we can finalize duration/end state.
    const statusCallback = `${SITE}/api/voice/status`

    const twiml = xml(
      `<Response>
         <Say voice="alice">Connecting you to Boroma for your free trial.</Say>
         <Dial
            callerId="+${fromDigits}"
            timeout="20"
            answerOnBridge="true"
            timeLimit="${TRIAL_MAX_SECONDS}"
            record="do-not-record"
            method="POST"
            action="${statusCallback}"
            statusCallback="${statusCallback}"
            statusCallbackMethod="POST">
           <Number>${VAPI_AGENT_NUMBER}</Number>
         </Dial>
       </Response>`
    )

    res.setHeader('Content-Type', 'text/xml')
    return res.status(200).send(twiml)
  } catch (e: any) {
    // Never break Twilio: log, then reply with a friendly Say + Hangup
    try {
      await supabaseAdmin.from('webhook_event_logs').insert({
        source: 'trial_route_error',
        payload: { error: e?.message || String(e) },
      })
    } catch {}
    res.setHeader('Content-Type', 'text/xml')
    return res
      .status(200)
      .send(
        sayAndHangup(
          'Something went wrong starting your trial call. Please try again in a moment.'
        )
      )
  }
}
