// /pages/api/voice/status.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// Optional: if you want to reject non-Twilio requests, set TWILIO_AUTH_TOKEN in Vercel
// and uncomment the signature check below.
const TOLLFREE = (process.env.NEXT_PUBLIC_TOLLFREE || process.env.TWILIO_TOLLFREE || '').trim()

// Normalizes any phone to E.164-ish and last-10-digits (US)
function last10(n?: string | null) {
  if (!n) return ''
  const digits = (n + '').replace(/[^\d]/g, '')
  return digits.slice(-10)
}

// Minimal safe parser for Twilio’s form posts
function getParam(req: NextApiRequest, key: string) {
  const b: any = req.body || {}
  // Twilio posts urlencoded by default in production; Next parses it into req.body
  return b[key] ?? null
}

export const config = {
  api: {
    bodyParser: true, // Twilio sends application/x-www-form-urlencoded by default
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed')

  try {
    const CallSid = getParam(req, 'CallSid') as string | null
    const From = (getParam(req, 'From') as string | null) || ''
    const To = (getParam(req, 'To') as string | null) || ''
    const CallStatus = (getParam(req, 'CallStatus') as string | null) || '' // queued|ringing|in-progress|completed|busy|failed|no-answer|canceled
    const CallDuration = Number(getParam(req, 'CallDuration') || 0) // present on completed
    const Direction = (getParam(req, 'Direction') as string | null) || ''
    const Timestamp = new Date().toISOString()

    const fromDigits = last10(From)
    const isTollfree = TOLLFREE && last10(To) === last10(TOLLFREE)

    // Always keep a raw event log for debugging
    await supabaseAdmin.from('webhook_event_logs').insert({
      source: 'twilio.status',
      payload: {
        CallSid, From, To, CallStatus, CallDuration, Direction, Timestamp, isTollfree,
      } as any,
    })

    // Only summarize toll-free calls; we don’t summarize trial line here
    if (isTollfree && CallStatus === 'completed') {
      // find member by last-10
      const { data: member } = await supabaseAdmin
        .from('members')
        .select('id, phone, phone_digits')
        .or(`phone.eq.+${fromDigits},phone_digits.eq.${fromDigits}`)
        .maybeSingle()

      await supabaseAdmin.from('tollfree_call_logs').insert({
        member_id: member?.id ?? null,
        phone: From,
        started_at: new Date(Date.now() - CallDuration * 1000).toISOString(),
        ended_at: new Date().toISOString(),
        duration_sec: isFinite(CallDuration) ? CallDuration : 0,
        status: 'completed',
        is_trial: false,
        notes: `Sid:${CallSid || ''}`,
      })
    }

    return res.json({ ok: true })
  } catch (e: any) {
    // If logging fails, never break Twilio delivery
    await supabaseAdmin.from('webhook_event_logs').insert({
      source: 'twilio.status.error',
      payload: { message: e?.message || 'unknown', at: new Date().toISOString() } as any,
    })
    return res.json({ ok: true })
  }
}
