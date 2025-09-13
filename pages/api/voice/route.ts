// /pages/api/voice/route.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const TOLLFREE =
  (process.env.NEXT_PUBLIC_TOLLFREE ||
    process.env.TWILIO_TOLLFREE ||
    process.env.NEXT_PUBLIC_PRIMARY_PHONE ||
    '').trim()
const VAPI_AGENT_NUMBER = (process.env.VAPI_AGENT_NUMBER || '').trim()

function last10(n?: string | null) {
  if (!n) return ''
  return String(n).replace(/[^\d]/g, '').slice(-10)
}

function xml(s: string) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n${s}`
}

export const config = { api: { bodyParser: true } }

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Twilio will POST; GET is allowed for manual debug in a browser
  const method = req.method || 'GET'

  const qFrom = (method === 'GET' ? (req.query.From as string) : (req.body?.From as string)) || ''
  const qTo = (method === 'GET' ? (req.query.To as string) : (req.body?.To as string)) || ''
  const debug = (method === 'GET' ? req.query.debug : undefined) ? true : false

  const fromDigits = last10(qFrom)
  const toDigits = last10(qTo)
  const tollDigits = last10(TOLLFREE)

  const envOk = !!TOLLFREE && !!VAPI_AGENT_NUMBER
  let matchedMember: any = null
  let active = false
  let reason = ''

  try {
    // Only handle Toll-Free calls here; anything else gets a polite message
    if (!envOk) {
      reason = 'missing env'
    } else if (toDigits !== tollDigits) {
      reason = 'not tollfree'
    } else if (!fromDigits) {
      reason = 'no caller digits'
    } else {
      // Find member by last10 OR exact E.164
      const { data: member, error } = await supabaseAdmin
        .from('members')
        .select(`
          id, user_id, phone, phone_digits, subscription_id,
          subscription:subscriptions!members_subscription_id_fkey (
            id, user_id, status, current_period_end, cancel_at_period_end
          )
        `)
        .or(`phone_digits.eq.${fromDigits},phone.eq.+${fromDigits}`)
        .maybeSingle()

      if (error) {
        reason = `db error: ${error.message}`
      } else if (!member) {
        reason = 'no member match'
      } else {
        matchedMember = member
        const sub = member.subscription
        if (!sub) {
          reason = 'no subscription on member'
        } else {
          const now = new Date()
          const cpe = sub.current_period_end ? new Date(sub.current_period_end) : null
          const inPeriod = !!cpe && cpe.getTime() > now.getTime()
          const statusOk = ['active', 'trialing'].includes(String(sub.status || '').toLowerCase())

          active = !!(statusOk && inPeriod)
          if (!active) reason = `status:${sub?.status} inPeriod:${inPeriod}`
        }
      }
    }

    if (debug || method === 'GET') {
      // JSON debug view in the browser
      res.status(200).json({
        envOk,
        input: { From: qFrom, To: qTo, fromDigits, toDigits, tollDigits },
        matchedMember,
        active,
        reason,
      })
      return
    }

    res.setHeader('Content-Type', 'text/xml; charset=utf-8')

    if (!envOk) {
      return res.status(200).send(
        xml(`<Response><Say voice="alice">Service is temporarily unavailable. Please try again later.</Say><Hangup/></Response>`)
      )
    }

    if (toDigits !== tollDigits) {
      // Not the toll-free → keep it simple
      return res.status(200).send(
        xml(`<Response><Say voice="alice">This number is not configured for voice at the moment.</Say><Hangup/></Response>`)
      )
    }

    if (!active) {
      // Non-member or inactive: members-only message
      await supabaseAdmin.from('webhook_event_logs').insert({
        source: 'voice.route.denied',
        payload: { From: qFrom, To: qTo, fromDigits, reason } as any,
      })
      return res.status(200).send(
        xml(`<Response><Say voice="alice">This number is for Boroma members. Please visit boroma dot site to start a plan.</Say><Hangup/></Response>`)
      )
    }

    // Member + active → forward to Vapi Agent
    await supabaseAdmin.from('webhook_event_logs').insert({
      source: 'voice.route.allowed',
      payload: { From: qFrom, To: qTo, fromDigits, vapi: VAPI_AGENT_NUMBER } as any,
    })

    // NOTE: timeLimit=20 is for testing so you don’t spend credits. Remove it in prod.
    const body = `
      <Response>
        <Dial answerOnBridge="true" timeLimit="20">
          <Number>${VAPI_AGENT_NUMBER}</Number>
        </Dial>
      </Response>
    `
    return res.status(200).send(xml(body.trim()))
  } catch (e: any) {
    await supabaseAdmin.from('webhook_event_logs').insert({
      source: 'voice.route.error',
      payload: { message: e?.message || 'unknown', From: qFrom, To: qTo } as any,
    })
    res.setHeader('Content-Type', 'text/xml; charset=utf-8')
    return res
      .status(200)
      .send(xml(`<Response><Say voice="alice">We’re sorry. An unexpected error occurred.</Say><Hangup/></Response>`))
  }
}
