// /pages/api/voice/route.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const VAPI_AGENT_NUMBER = process.env.VAPI_AGENT_NUMBER! // e.g. +13392091065
const TOLLFREE = (process.env.NEXT_PUBLIC_TOLLFREE || process.env.TWILIO_TOLLFREE || '').replace(/\D/g, '')

function last10(n?: string) {
  return (n || '').replace(/\D/g, '').slice(-10)
}
function xml(s: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>${s}`
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).send('Method Not Allowed')
  }

  // Twilio sends x-www-form-urlencoded; Next parses it into req.body
  const b: any = req.body || {}
  const CallSid = b.CallSid as string
  const From = b.From as string
  const To = b.To as string

  const fromDigits = last10(From)
  const toDigits = last10(To)

  // very light sanity
  if (!CallSid || !fromDigits) {
    res.setHeader('Content-Type', 'text/xml')
    return res
      .status(200)
      .send(
        xml(
          `<Response><Say voice="alice">We could not identify your number. Please call from a valid phone.</Say><Hangup/></Response>`
        )
      )
  }

  // 1) find member and active subscription
  const { data: memberRow } = await supabaseAdmin
    .from('members')
    .select('id,user_id,phone,phone_digits,subscription_id')
    .or(`phone.eq.+${fromDigits},phone_digits.eq.${fromDigits}`)
    .limit(1)
    .maybeSingle()

  // if no member -> reject (tollfree is for members only)
  if (!memberRow) {
    res.setHeader('Content-Type', 'text/xml')
    return res
      .status(200)
      .send(
        xml(
          `<Response><Say voice="alice">This number is for Boroma members. Please visit boroma dot site to start a plan.</Say><Hangup/></Response>`
        )
      )
  }

  // check subscription is active
  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('id,status,cancel_at_period_end')
    .eq('id', memberRow.subscription_id)
    .maybeSingle()

  const active = !!sub && sub.status === 'active' && sub.cancel_at_period_end === false

  if (!active) {
    res.setHeader('Content-Type', 'text/xml')
    return res
      .status(200)
      .send(
        xml(
          `<Response><Say voice="alice">Your Boroma plan is not active. Please visit your dashboard to manage billing.</Say><Hangup/></Response>`
        )
      )
  }

  // 2) write an "in_progress" row with the parent CallSid
  await supabaseAdmin.from('tollfree_call_logs').insert({
    member_id: memberRow.id,
    phone: `+${fromDigits}`,
    started_at: new Date().toISOString(),
    status: 'in_progress',
    call_sid: CallSid,
    duration_sec: 0,
    notes: null,
  })

  // 3) Dial Vapi agent — crucial: present the caller's number so Vapi sees the real customer
  const dialXml = `
<Response>
  <Dial callerId="+${fromDigits}">
    <Number>${VAPI_AGENT_NUMBER}</Number>
  </Dial>
</Response>`.trim()

  res.setHeader('Content-Type', 'text/xml')
  return res.status(200).send(xml(dialXml))
}
