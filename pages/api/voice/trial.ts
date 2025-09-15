// /pages/api/voice/trial.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const VAPI_AGENT_NUMBER = process.env.VAPI_AGENT_NUMBER!
const TRIAL_MAX_SECONDS = Number(process.env.TRIAL_MAX_SECONDS || 8 * 60)

function last10(s?: string) { return (s || '').replace(/\D/g, '').slice(-10) }
function xml(s: string) { return `<?xml version="1.0" encoding="UTF-8"?>${s}` }
function readParams(req: NextApiRequest) {
  if (req.method === 'POST') {
    const b: any = req.body ?? {}
    if (typeof b === 'string') return Object.fromEntries(new URLSearchParams(b))
    return b
  }
  return req.query || {}
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'POST, GET')
    return res.status(405).send('Method Not Allowed')
  }

  const p: any = readParams(req)
  const fromDigits = last10(p.From)

  if (!fromDigits) {
    res.setHeader('Content-Type', 'text/xml')
    return res.status(200).send(xml(`<Response><Say voice="alice">We could not read your number.</Say><Hangup/></Response>`))
  }

  const { data: existing } = await supabaseAdmin
    .from('trial_calls')
    .select('id,call_count,first_call_at')
    .eq('phone_digits', fromDigits)
    .maybeSingle()

  if (!existing) {
    await supabaseAdmin.from('trial_calls').insert({ phone_digits: fromDigits, call_count: 1 })
  } else if (existing.call_count >= 1) {
    res.setHeader('Content-Type', 'text/xml')
    return res.status(200).send(
      xml(`<Response><Say voice="alice">Your free trial call has been used. Please visit boroma dot site to start a plan.</Say><Hangup/></Response>`)
    )
  } else {
    await supabaseAdmin
      .from('trial_calls')
      .update({ call_count: existing.call_count + 1, first_call_at: existing.first_call_at || new Date().toISOString() })
      .eq('id', existing.id)
  }

  const twiml = `
<Response>
  <Say voice="alice">Welcome to Boroma. You are using a one time free trial call.</Say>
  <Dial callerId="+${fromDigits}" timeLimit="${TRIAL_MAX_SECONDS}">
    <Number>${VAPI_AGENT_NUMBER}</Number>
  </Dial>
</Response>`.trim()

  res.setHeader('Content-Type', 'text/xml')
  return res.status(200).send(xml(twiml))
}
