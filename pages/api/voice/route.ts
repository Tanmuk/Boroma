import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const VAPI_AGENT_NUMBER = process.env.VAPI_AGENT_NUMBER!            // +13392091065
const MEMBER_MAX_SECONDS = Number(process.env.MEMBER_MAX_SECONDS || 35 * 60)

function last10(s?: string) {
  return (s || '').replace(/\D/g, '').slice(-10)
}
function xml(s: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>${s}`
}
function readParams(req: NextApiRequest) {
  if (req.method === 'POST') {
    const b: any = req.body ?? {}
    if (typeof b === 'string') return Object.fromEntries(new URLSearchParams(b))
    return b
  }
  return req.query || {}
}

async function findActiveSubscription(userId: string | null, subscriptionId: number | null) {
  // 1) try explicit subscription_id if present
  if (subscriptionId) {
    const { data: s } = await supabaseAdmin
      .from('subscriptions')
      .select('id,status,cancel_at_period_end')
      .eq('id', subscriptionId)
      .maybeSingle()
    if (s) return s
  }
  // 2) fall back to the most recent active subscription for this user
  if (userId) {
    const { data: s } = await supabaseAdmin
      .from('subscriptions')
      .select('id,status,cancel_at_period_end')
      .eq('user_id', userId)
      .in('status', ['active', 'trialing', 'paid'])
      .order('id', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (s) return s
  }
  return null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'POST, GET')
    return res.status(405).send('Method Not Allowed')
  }

  const p = readParams(req) as any
  const CallSid = (p.CallSid || '').toString()
  const From = (p.From || '').toString()
  const fromDigits = last10(From)

  if (!fromDigits) {
    res.setHeader('Content-Type', 'text/xml')
    return res
      .status(200)
      .send(xml(`<Response><Say voice="alice">We could not identify your number.</Say><Hangup/></Response>`))
  }

  // Find member by full number or last 10
  const { data: member } = await supabaseAdmin
    .from('members')
    .select('id,user_id,phone,phone_digits,subscription_id')
    .or(`phone.eq.+${fromDigits},phone_digits.eq.${fromDigits}`)
    .limit(1)
    .maybeSingle()

  if (!member) {
    res.setHeader('Content-Type', 'text/xml')
    return res
      .status(200)
      .send(xml(`<Response><Say voice="alice">This number is for Boroma members. Please visit boroma dot site to start a plan.</Say><Hangup/></Response>`))
  }

  // Validate an active subscription (robust: via member.subscription_id OR latest active for user_id)
  const sub = await findActiveSubscription(member.user_id, member.subscription_id ?? null)
  const active = !!sub && sub.cancel_at_period_end === false && ['active', 'trialing', 'paid'].includes(sub.status as string)

  if (!active) {
    res.setHeader('Content-Type', 'text/xml')
    return res
      .status(200)
      .send(xml(`<Response><Say voice="alice">Your Boroma plan is not active. Please visit your dashboard to manage billing.</Say><Hangup/></Response>`))
  }

  // Log start (idempotent-ish: one row per CallSid; if no CallSid, we still insert a best-effort row)
  if (CallSid) {
    const { data: existing } = await supabaseAdmin
      .from('tollfree_call_logs')
      .select('id')
      .eq('call_sid', CallSid)
      .maybeSingle()

    if (!existing) {
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
  } else {
    await supabaseAdmin.from('tollfree_call_logs').insert({
      member_id: member.id,
      phone: `+${fromDigits}`,
      started_at: new Date().toISOString(),
      status: 'in_progress',
      call_sid: null,
      duration_sec: 0,
      notes: 'no CallSid at route',
    })
  }

  // Forward to Vapi assistant with callerId as member's number; enforce time limit from env
  const twiml = `
<Response>
  <Dial callerId="+${fromDigits}" timeLimit="${MEMBER_MAX_SECONDS}">
    <Number>${VAPI_AGENT_NUMBER}</Number>
  </Dial>
</Response>`.trim()

  res.setHeader('Content-Type', 'text/xml')
  return res.status(200).send(xml(twiml))
}
