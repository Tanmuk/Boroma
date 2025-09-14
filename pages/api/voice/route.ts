// pages/api/voice/route.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

function last10(n?: string | null) {
  if (!n) return ''
  return (n.match(/\d/g) || []).join('').slice(-10)
}

function twimlSay(text: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">${text}</Say>
  <Hangup/>
</Response>`
}

/**
 * Build the TwiML that:
 *  - tells the caller their max minutes (optional)
 *  - bridges to the Vapi agent with a hard time limit
 */
function twimlDialWithLimit(opts: {
  agentNumber: string
  callerId: string
  maxSeconds?: number
  preNoticeSeconds?: number // say "You have up to N minutes..."
}) {
  const { agentNumber, callerId, maxSeconds, preNoticeSeconds } = opts

  const minutes = maxSeconds && maxSeconds > 0 ? Math.max(1, Math.floor(maxSeconds / 60)) : null
  const preNotice =
    minutes
      ? `<Say voice="alice">You have up to ${minutes} ${minutes === 1 ? 'minute' : 'minutes'} for this call.</Say>`
      : ''

  const timeLimitAttr = maxSeconds && maxSeconds > 0 ? ` timeLimit="${maxSeconds}"` : ''

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  ${preNotice}
  <Say voice="alice">Connecting you to your Boroma support specialist.</Say>
  <Dial callerId="${callerId}" answerOnBridge="true"${timeLimitAttr}>
    <Number>${agentNumber}</Number>
  </Dial>
</Response>`
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    res.status(405).end('Method Not Allowed')
    return
  }

  // ----- ENV -----
  const TOLLFREE = process.env.NEXT_PUBLIC_TOLLFREE || process.env.TWILIO_TOLLFREE
  const VAPI_AGENT = process.env.VAPI_AGENT_NUMBER

  // time limits (seconds)
  const MEMBER_MAX_SECONDS = Number(process.env.MEMBER_MAX_SECONDS || 0) || 0
  const MEMBER_SOFT_REMINDER_SECONDS = Number(process.env.MEMBER_SOFT_REMINDER_SECONDS || 0) || 0
  // NOTE: TRIAL_MAX_SECONDS is used by your /api/voice/trial handler, not here.

  res.setHeader('Content-Type', 'text/xml')

  if (!TOLLFREE || !VAPI_AGENT) {
    res.status(200).send(twimlSay('Configuration error.'))
    return
  }

  const From = typeof req.body?.From === 'string' ? req.body.From : (req.query.From as string | undefined)
  const To   = typeof req.body?.To   === 'string' ? req.body.To   : (req.query.To   as string | undefined)

  const fromDigits = last10(From)
  const toDigits   = last10(To)
  const tollDigits = last10(TOLLFREE)
  const isTollFreeCall = toDigits === tollDigits

  if (!isTollFreeCall) {
    res.status(200).send(
      twimlSay('This number is for Boroma members. Please visit boroma dot site to start a plan.')
    )
    return
  }

  try {
    // 1) Find member by last 10 digits
    const { data: member, error: mErr } = await supabaseAdmin
      .from('members')
      .select('id, user_id, phone, phone_digits, subscription_id')
      .eq('phone_digits', fromDigits)
      .maybeSingle()

    if (mErr) {
      res.status(200).send(twimlSay('We are having trouble looking up your plan. Please try again later.'))
      return
    }

    if (!member) {
      res.status(200).send(
        twimlSay('This number is for Boroma members. Please visit boroma dot site to start a plan.')
      )
      return
    }

    // 2) Find subscription (prefer explicit member.subscription_id, else latest by user_id)
    let subscription:
      | { id: number; status: string | null; current_period_end: string | null; cancel_at_period_end: boolean | null }
      | null = null

    if (member.subscription_id) {
      const { data, error } = await supabaseAdmin
        .from('subscriptions')
        .select('id, status, current_period_end, cancel_at_period_end')
        .eq('id', member.subscription_id)
        .maybeSingle()
      if (!error) subscription = data
    } else {
      const { data, error } = await supabaseAdmin
        .from('subscriptions')
        .select('id, status, current_period_end, cancel_at_period_end')
        .eq('user_id', member.user_id)
        .order('current_period_end', { ascending: false })
        .limit(1)
      if (!error && data && data.length) subscription = data[0]
    }

    const now = Date.now()
    const subStatus = (subscription?.status || '').toLowerCase()
    const inGoodStatus = subStatus === 'active' || subStatus === 'trialing'
    const notEnded =
      !subscription?.current_period_end ||
      new Date(subscription.current_period_end).getTime() > now
    const active = !!subscription && inGoodStatus && notEnded

    if (!active) {
      res.status(200).send(
        twimlSay('Your Boroma plan is not active. Please visit your dashboard to manage billing.')
      )
      return
    }

    // 3) Active member → bridge to Vapi agent with a hard cap (and a pre-connect reminder)
    res.status(200).send(
      twimlDialWithLimit({
        agentNumber: VAPI_AGENT,
        callerId: TOLLFREE,
        maxSeconds: MEMBER_MAX_SECONDS > 0 ? MEMBER_MAX_SECONDS : undefined,
        preNoticeSeconds: MEMBER_SOFT_REMINDER_SECONDS > 0 ? MEMBER_SOFT_REMINDER_SECONDS : undefined
      })
    )
  } catch {
    res.status(200).send(
      twimlSay('We are having trouble right now. Please try again later.')
    )
  }
}
