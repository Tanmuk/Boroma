import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

function readParams(req: NextApiRequest) {
  if (req.method === 'POST') {
    const b: any = req.body ?? {}
    if (typeof b === 'string') return Object.fromEntries(new URLSearchParams(b))
    return b
  }
  return req.query || {}
}
function last10(s?: string) {
  return (s || '').replace(/\D/g, '').slice(-10)
}
function secDiff(a: Date, b: Date) {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 1000))
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'POST, GET')
    return res.status(405).send('Method Not Allowed')
  }

  const p = readParams(req) as any
  const CallSid = (p.CallSid || '').toString()
  const CallStatus = (p.CallStatus || '').toString() // completed|busy|failed|no-answer|canceled
  const From = (p.From || '').toString()
  const fromDigits = last10(From)

  // Find the matching in-progress log
  let log:
    | { id: string; member_id: string; started_at: string; phone: string | null }
    | null = null

  if (CallSid) {
    const { data } = await supabaseAdmin
      .from('tollfree_call_logs')
      .select('id,member_id,started_at,phone')
      .eq('call_sid', CallSid)
      .maybeSingle()
    log = data ?? null
  }

  // Fallback: last in_progress by phone in recent window (in case CallSid was missing at route)
  if (!log && fromDigits) {
    const { data } = await supabaseAdmin
      .from('tollfree_call_logs')
      .select('id,member_id,started_at,phone')
      .eq('status', 'in_progress')
      .or(`phone.eq.+${fromDigits},phone.eq.${'+' + fromDigits}`) // both forms
      .order('started_at', { ascending: false })
      .limit(1)
    log = (data && data[0]) || null
  }

  if (!log) return res.status(200).json({ ok: true, reason: 'no matching log' })

  const endedAt = new Date()
  const dur = secDiff(new Date(log.started_at), endedAt)
  const final =
    CallStatus === 'completed'
      ? 'completed'
      : ['busy', 'failed', 'no-answer', 'canceled'].includes(CallStatus)
      ? 'failed'
      : 'completed'

  await supabaseAdmin
    .from('tollfree_call_logs')
    .update({ ended_at: endedAt.toISOString(), duration_sec: dur, status: final })
    .eq('id', log.id)

  // Insert immutable ledger row
  await supabaseAdmin.from('calls').insert({
    member_id: log.member_id,
    started_at: log.started_at,
    ended_at: endedAt.toISOString(),
    duration_seconds: dur,
    is_member_call: true,
    source: 'twilio',
    created_at: new Date().toISOString(),
  } as any)

  return res.status(200).json({ ok: true })
}
