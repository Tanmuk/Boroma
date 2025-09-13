// /pages/api/voice/route.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const config = { api: { bodyParser: false } }

// === ENV ===
const TOLLFREE = (process.env.TWILIO_TOLLFREE || process.env.NEXT_PUBLIC_PRIMARY_PHONE || '').trim()
const TRIAL_LINE = (process.env.TWILIO_TRIAL || process.env.NEXT_PUBLIC_TRIAL_PHONE || '').trim() // optional
const VAPI_AGENT_NUMBER = (process.env.VAPI_AGENT_NUMBER || '').trim()

// Small helper to read raw form body (Twilio posts application/x-www-form-urlencoded)
async function readForm(req: NextApiRequest): Promise<Record<string, string>> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  const body = Buffer.concat(chunks).toString('utf8')
  const params = new URLSearchParams(body)
  const out: Record<string, string> = {}
  params.forEach((v, k) => (out[k] = v))
  return out
}

function last10Digits(n: string | null | undefined) {
  if (!n) return ''
  const digits = (n + '').replace(/\D/g, '')
  return digits.slice(-10)
}

function twiml(say: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response><Say voice="alice">${say}</Say></Response>`
}

function twimlDial(toNumber: string, callerId?: string): string {
  const cid = callerId ? ` callerId="${callerId}"` : ''
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response><Dial${cid}><Number>${toNumber}</Number></Dial></Response>`
}

type MemberRow = {
  id: string
  phone: string | null
  phone_digits: string | null
  subscription_id: number | null
}

type SubRow = {
  id: number
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'inactive'
  current_period_end: string | null
  cancel_at_period_end: boolean | null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST')
      return res.status(405).send('Method Not Allowed')
    }

    const p = await readForm(req)
    const from = (p.From || '').trim()
    const to   = (p.To || '').trim()
    const fromDigits = last10Digits(from)

    // Soft sanity logging
    await supabaseAdmin.from('webhook_event_logs').insert({
      source: 'twilio.voice.route',
      payload: { to, from, fromDigits, env: { TOLLFREE, TRIAL_LINE, VAPI: !!VAPI_AGENT_NUMBER } }
    })

    // TRIAL LINE? (optional – if you use a separate “free trial” number)
    if (TRIAL_LINE && to === TRIAL_LINE) {
      if (!VAPI_AGENT_NUMBER) {
        res.setHeader('Content-Type', 'text/xml; charset=utf-8')
        return res.status(200).send(twiml('Sorry, our system is not ready to accept trial calls yet.'))
      }
      res.setHeader('Content-Type', 'text/xml; charset=utf-8')
      return res.status(200).send(twimlDial(VAPI_AGENT_NUMBER, TRIAL_LINE))
    }

    // TOLLFREE: members-only
    if (to === TOLLFREE) {
      // 1) Find a member by E.164 or last-10 digits
      const { data: members, error: mErr } = await supabaseAdmin
        .from('members')
        .select('id, phone, phone_digits, subscription_id')
        .or(`phone.eq.${from},phone_digits.eq.${fromDigits}`)
        .limit(1)

      if (mErr) {
        await supabaseAdmin.from('webhook_event_logs').insert({
          source: 'twilio.voice.route.error',
          payload: { step: 'members.select', error: mErr.message, from, fromDigits }
        })
      }

      const member = (members && members[0]) as MemberRow | undefined

      if (!member || !member.subscription_id) {
        // Not a recognized member phone
        res.setHeader('Content-Type', 'text/xml; charset=utf-8')
        return res
          .status(200)
          .send(twiml('This number is for Boroma members. Please visit boroma.site to start a plan.'))
      }

      // 2) Verify subscription status
      const { data: subs, error: sErr } = await supabaseAdmin
        .from('subscriptions')
        .select('id, status, current_period_end, cancel_at_period_end')
        .eq('id', member.subscription_id)
        .limit(1)

      if (sErr) {
        await supabaseAdmin.from('webhook_event_logs').insert({
          source: 'twilio.voice.route.error',
          payload: { step: 'subscriptions.select', error: sErr.message, subId: member.subscription_id }
        })
      }

      const sub = (subs && subs[0]) as SubRow | undefined
      const now = new Date()

      const periodEndOk =
        sub?.current_period_end ? new Date(sub.current_period_end) > now : true

      const isActive =
        !!sub &&
        (sub.status === 'active' || sub.status === 'trialing') &&
        periodEndOk &&
        !sub.cancel_at_period_end

      if (!isActive) {
        res.setHeader('Content-Type', 'text/xml; charset=utf-8')
        return res
          .status(200)
          .send(twiml('Your plan is not active. Please refresh status from your dashboard or update billing.'))
      }

      // 3) Forward member to Vapi agent
      if (!VAPI_AGENT_NUMBER) {
        res.setHeader('Content-Type', 'text/xml; charset=utf-8')
        return res.status(200).send(twiml('System misconfiguration: agent number is missing.'))
      }

      res.setHeader('Content-Type', 'text/xml; charset=utf-8')
      return res.status(200).send(twimlDial(VAPI_AGENT_NUMBER, TOLLFREE))
    }

    // Any other numbers -> polite default
    res.setHeader('Content-Type', 'text/xml; charset=utf-8')
    return res.status(200).send(twiml('Thanks for calling Boroma. Please use our toll-free member line.'))
  } catch (e: any) {
    await supabaseAdmin.from('webhook_event_logs').insert({
      source: 'twilio.voice.route.exception',
      payload: { message: e?.message || String(e) }
    })
    res.setHeader('Content-Type', 'text/xml; charset=utf-8')
    return res.status(200).send(twiml('Sorry, a system error occurred.'))
  }
}
