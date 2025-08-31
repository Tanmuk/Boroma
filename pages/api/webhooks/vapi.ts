import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const sig = req.headers['x-boroma-signature'] as string | undefined
  if (process.env.VAPI_WEBHOOK_SECRET && sig !== process.env.VAPI_WEBHOOK_SECRET) {
    return res.status(401).json({ error: 'Invalid signature' })
  }
  try {
    const payload = req.body
    await supabaseAdmin.from('webhook_event_logs').insert({ source: 'vapi', payload })
    if (payload?.event === 'call.completed') {
      await supabaseAdmin.from('calls').insert({
        user_id: payload.user_id || null,
        phone: payload.phone,
        started_at: payload.started_at,
        ended_at: payload.ended_at,
        duration_seconds: payload.duration_seconds,
        issue_type: payload.issue_type,
        resolved: payload.resolved,
        recording_url: payload.recording_url,
        transcript_url: payload.transcript_url,
        cost_cents: payload.cost_cents,
        source: 'vapi'
      })
    }
    return res.json({ ok: true })
  } catch (e: any) {
    console.error(e); return res.status(500).json({ error: 'Webhook error' })
  }
}
