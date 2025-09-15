// /pages/api/voice/status.ts
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
function secDiff(a: Date, b: Date) {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 1000))
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'POST, GET')
    return res.status(405).send('Method Not Allowed')
  }

  const p: any = readParams(req)
  const CallSid = (p.CallSid || '').toString()
  const CallStatus = (p.CallStatus || '').toString() // completed|busy|failed|no-answer|...

  if (!CallSid) return res.status(200).json({ ok: true })

  const { data: log } = await supabaseAdmin
    .from('tollfree_call_logs')
    .select('id,member_id,started_at')
    .eq('call_sid', CallSid)
    .maybeSingle()

  if (!log) return res.status(200).json({ ok: true })

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

  // Ledger row
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
