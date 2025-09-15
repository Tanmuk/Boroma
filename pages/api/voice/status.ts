// /pages/api/voice/status.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

function secDiff(a: Date, b: Date) {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 1000))
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).send('Method Not Allowed')
  }

  // Twilio posts x-www-form-urlencoded
  const b: any = req.body || {}
  const CallSid = (b.CallSid || '').toString()
  const CallStatus = (b.CallStatus || '').toString() // queued|ringing|in-progress|completed|busy|failed|no-answer|canceled

  if (!CallSid) return res.status(200).json({ ok: true })

  // find the log row by call_sid
  const { data: logRow } = await supabaseAdmin
    .from('tollfree_call_logs')
    .select('id,member_id,started_at,status')
    .eq('call_sid', CallSid)
    .maybeSingle()

  if (!logRow) return res.status(200).json({ ok: true })

  const endedAt = new Date()
  const dur = secDiff(new Date(logRow.started_at), endedAt)
  const finalStatus =
    CallStatus === 'completed'
      ? 'completed'
      : ['busy', 'failed', 'no-answer', 'canceled'].includes(CallStatus)
      ? 'failed'
      : 'completed'

  // close the log row
  await supabaseAdmin
    .from('tollfree_call_logs')
    .update({ ended_at: endedAt.toISOString(), duration_sec: dur, status: finalStatus })
    .eq('id', logRow.id)

  // also record one compact row in public.calls (if you want a simple ledger)
  // minimal insert; adjust columns if your table differs
  await supabaseAdmin.from('calls').insert({
    member_id: logRow.member_id,
    started_at: logRow.started_at,
    ended_at: endedAt.toISOString(),
    duration_seconds: dur,
    is_member_call: true,
    source: 'twilio',
    created_at: new Date().toISOString(),
  } as any)

  return res.status(200).json({ ok: true })
}
