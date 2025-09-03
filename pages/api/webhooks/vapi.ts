import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })

  const secret = process.env.VAPI_WEBHOOK_SECRET
  const provided = req.headers['x-boroma-secret'] as string | undefined
  if (!secret || !provided || provided !== secret) {
    return res.status(401).json({ ok: false, error: 'Invalid webhook secret' })
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {}

  // Always log the raw event so you can see payloads in Supabase
  await supabaseAdmin.from('webhook_event_logs').insert({
    source: 'vapi',
    payload: body
  }).catch(()=>{})

  // OPTIONAL: if your Vapi payload has caller phone & duration, store a call record
  try {
    const caller = body?.caller?.phone || body?.from || body?.phone || null
    const seconds = body?.durationSeconds || body?.metrics?.durationSeconds || null

    if (caller && seconds) {
      // Find the owner by matching members.phone
      const { data: member } = await supabaseAdmin
        .from('members')
        .select('user_id')
        .eq('phone', caller)
        .maybeSingle()

      await supabaseAdmin.from('calls').insert({
        user_id: member?.user_id ?? null,
        from_phone: caller,
        seconds
      })
    }
  } catch {}

  return res.json({ ok: true })
}
