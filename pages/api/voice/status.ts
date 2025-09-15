// /pages/api/voice/status.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

function last10(n?: string | null) {
  if (!n) return null
  return n.replace(/[^0-9]/g, '').slice(-10) || null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' })
  }

  try {
    // Twilio status webhooks are form-encoded by default.
    // Next parses it into req.body (JSON). Keys we care about:
    // CallStatus, CallSid, From, To, CallDuration
    const b: any = req.body || {}
    const callStatus = b.CallStatus || b.callStatus
    const fromRaw = b.From || b.from
    const toRaw = b.To || b.to
    const durationSec = Number(b.CallDuration || b.callDuration || 0) || 0

    const fromDigits = last10(fromRaw)

    // Log raw for debugging
    await supabaseAdmin.from('webhook_event_logs').insert({
      source: 'twilio.status',
      payload: b
    })

    // Resolve member from caller digits
    let memberId: string | null = null
    if (fromDigits) {
      const { data: m } = await supabaseAdmin
        .from('members')
        .select('id, phone, phone_digits')
        .or(`phone.eq.+${fromDigits},phone_digits.eq.${fromDigits}`)
        .limit(1)
        .maybeSingle()
      memberId = m?.id || null
    }

    // Upsert a tollfree_call_logs row. If a prior row exists for this member
    // and started recently, we update it; otherwise insert a new one.
    if (memberId) {
      // Try to find a "most recent" row in last 2 hours for this member
      const { data: recent } = await supabaseAdmin
        .from('tollfree_call_logs')
        .select('id, started_at')
        .eq('member_id', memberId)
        .order('started_at', { ascending: false })
        .limit(1)

      const row = recent?.[0]

      if (row) {
        await supabaseAdmin
          .from('tollfree_call_logs')
          .update({
            ended_at: new Date().toISOString(),
            duration_sec: durationSec || null,
            status: callStatus || 'completed'
          })
          .eq('id', row.id)
      } else {
        await supabaseAdmin.from('tollfree_call_logs').insert({
          member_id: memberId,
          phone: fromDigits ? `+${fromDigits}` : null,
          started_at: new Date().toISOString(),
          ended_at: new Date().toISOString(),
          duration_sec: durationSec || null,
          status: callStatus || 'completed'
        })
      }
    }

    return res.status(200).json({ ok: true })
  } catch (err: any) {
    console.error('status.ts error', err)
    return res.status(500).json({ ok: false, error: err?.message || 'server error' })
  }
}
