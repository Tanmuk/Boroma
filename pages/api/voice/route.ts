// /pages/api/voice/route.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const VAPI_AGENT_NUMBER = process.env.VAPI_AGENT_NUMBER! // +13392091065

// ---- helpers ---------------------------------------------------------------
function last10(n?: string) {
  return (n || '').replace(/\D/g, '').slice(-10)
}
function xml(s: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>${s}`
}
// Twilio may send x-www-form-urlencoded, JSON, or (rarely) you may GET it in a browser.
// This normalizes everything into a single object.
function readParams(req: NextApiRequest) {
  if (req.method === 'POST') {
    const b: any = req.body ?? {}
    if (typeof b === 'string') {
      return Object.fromEntries(new URLSearchParams(b as string))
    }
    return b
  }
  // GET
  return req.query || {}
}

// ---------------------------------------------------------------------------
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'POST, GET')
    return res.status(405).send('Method Not Allowed')
  }

  const p: any = readParams(req)
  const CallSid = (p.CallSid || '').toString()
  const From = (p.From || '').toString()
  const To = (p.To || '').toString()

  const fromDigits = last10(From)
  const toDigits = last10(To)

  // Sanity
  if (!fromDigits) {
    res.setHeader('Content-Type', 'text/xml')
    return res.status(200).send(
      xml(`<Response><Say voice="alice">We could not identify your number. Please call from a valid phone.</Say><Hangup/></Response>`)
    )
  }

  // Find member
  const { data: member } = await supabaseAdmin
    .from('members')
    .select('id,user_id,phone,phone_digits,subscription_id')
    .or(`phone.eq.+${fromDigits},phone_digits.eq.${fromDigits}`)
    .limit(1)
    .maybeSingle()

  if (!member) {
    res.setHeader('Content-Type', 'text/xml')
    return res.status(200).send(
      xml(`<Response><Say voice="alice">This number is for Boroma members. Please visit boroma dot site to start a plan.</Say><Hangup/></Response>`)
    )
  }

  // Check active subscription
  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('id,status,cancel_at_period_end')
    .eq('id', member.subscription_id)
    .maybeSingle()

  const active = !!sub && sub.status === 'active' && sub.cancel_at_period_end === false
  if (!active) {
    res.setHeader('Content-Type', 'text/xml')
    return res.status(200).send(
      xml(`<Response><Say voice="alice">Your Boroma plan is not active. Please visit your dashboard to manage billing.</Say><Hangup/></Response>`)
    )
  }

  // Write "in progress" row tied to Twilio parent CallSid (if present)
  if (CallSid) {
    await supabaseAdmin.from('tollfree_call_logs').insert({
      member_id: member.id,
      phone: `+${fromDigits}`,
      started_at: new Date().toISOString(),
      status: 'in_progress',
      call_sid: CallSid,
      duration_sec: 0,
      notes: null,
    })
  }

  // Dial Vapi agent with the *caller’s* number as callerId (critical!)
  const twiml = `
<Response>
  <Dial callerId="+${fromDigits}">
    <Number>${VAPI_AGENT_NUMBER}</Number>
  </Dial>
</Response>`.trim()

  res.setHeader('Content-Type', 'text/xml')
  return res.status(200).send(xml(twiml))
}
