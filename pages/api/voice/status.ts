// /pages/api/voice/status.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const TOLLFREE =
  (process.env.NEXT_PUBLIC_TOLLFREE ||
    process.env.TWILIO_TOLLFREE ||
    process.env.NEXT_PUBLIC_PRIMARY_PHONE ||
    '').trim()

function last10(n?: string | null) {
  if (!n) return ''
  return String(n).replace(/[^\d]/g, '').slice(-10)
}

function param(req: NextApiRequest, key: string) {
  const b: any = req.body || {}
  return b[key] ?? null
}

export const config = {
  api: { bodyParser: true }, // Twilio sends urlencoded by default
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Accept GET too so Twilio never gets a 405 warning
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(200).json({ ok: true, method: req.method })
  }

  try {
    const CallSid = param(req, 'CallSid') as string | null
    const From = (param(req, 'From') as string | null) || ''
    const To = (param(req, 'To') as string | null) || ''
    const CallStatus = (param(req, 'CallStatus') as string | null) || ''
    const CallDuration = Number(param(req, 'CallDuration') || 0)
    const Direction = (param(req, 'Direction') as string | null) || ''
    const at = new Date().toISOString()

    const info = {
      CallSid, From, To, CallStatus, CallDuration, Direction, at,
      isTollfree: !!TOLLFREE && last10(To) === last10(TOLLFREE),
    }

    await supabaseAdmin.from('webhook_event_logs').insert({
      source: 'twilio.status',
      payload: info as any,
    })

    if (info.isTollfree && CallStatus === 'completed') {
      const digits = last10(From)
      const { data: member } = await supabaseAdmin
        .from('members')
        .select('id, phone, phone_digits')
        .or(`phone.eq.+${digits},phone_digits.eq.${digits}`)
        .maybeSingle()

      await supabaseAdmin.from('tollfree_call_logs').insert({
        member_id: member?.id ?? null,
        phone: From || null,
        started_at: new Date(Date.now() - CallDuration * 1000).toISOString(),
        ended_at: new Date().toISOString(),
        duration_sec: isFinite(CallDuration) ? CallDuration : 0,
        status: 'completed',
        is_trial: false,
        notes: `Sid:${CallSid || ''}`,
      })
    }

    return res.status(200).json({ ok: true })
  } catch (e: any) {
    await supabaseAdmin.from('webhook_event_logs').insert({
      source: 'twilio.status.error',
      payload: { message: e?.message || 'unknown', at: new Date().toISOString() } as any,
    })
    return res.status(200).json({ ok: true })
  }
}
