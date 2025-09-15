// pages/api/voice/status.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const config = { api: { bodyParser: false } }

async function readRaw(req: NextApiRequest) {
  const chunks: Uint8Array[] = []
  for await (const c of req) chunks.push(typeof c === 'string' ? Buffer.from(c) : c)
  return Buffer.concat(chunks)
}
function parse(req: NextApiRequest, buf: Buffer) {
  const ct = (req.headers['content-type'] || '').toLowerCase()
  const txt = buf.toString('utf8').trim()
  if (ct.includes('application/x-www-form-urlencoded')) {
    const p = new URLSearchParams(txt)
    const o: Record<string, string> = {}
    p.forEach((v, k) => (o[k] = v))
    return o
  }
  try { return JSON.parse(txt || '{}') } catch { return {} }
}
const last10 = (s?: string) => (s || '').replace(/[^\d]/g, '').slice(-10)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') return res.status(200).json({ ok: true, probe: true })
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST, GET')
      return res.status(405).json({ ok: false, error: 'Method Not Allowed' })
    }

    const buf = await readRaw(req)
    const b: any = parse(req, buf)

    const fromDigits = last10(b.From)
    const toDigits   = last10(b.To)
    const callSid    = b.CallSid || null
    const duration   = Number(b.CallDuration || b.DialCallDuration || 0) || 0
    const twStatus   = (b.CallStatus || b.DialCallStatus || '').toLowerCase() || 'completed'

    // Try to find the exact log row for this caller
    let logRow: any = null
    if (fromDigits) {
      const { data } = await supabaseAdmin
        .from('tollfree_call_logs')
        .select('id, member_id, phone, started_at, status')
        .eq('status', 'in_progress')
        .eq('phone', `+${fromDigits}`)
        .order('started_at', { ascending: false })
        .limit(1)
      logRow = data?.[0] || null
    }

    // Fallback: latest in_progress tollfree log within last hour
    if (!logRow) {
      const { data } = await supabaseAdmin
        .from('tollfree_call_logs')
        .select('id, member_id, phone, started_at, status')
        .eq('status', 'in_progress')
        .gte('started_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
        .order('started_at', { ascending: false })
        .limit(1)
      logRow = data?.[0] || null
    }

    if (!logRow) {
      await supabaseAdmin.from('webhook_event_logs').insert({
        source: 'voice_status_no_match',
        payload: { fromDigits, toDigits, callSid, duration, twStatus }
      })
      return res.status(200).json({ ok: true, note: 'no matching log' })
    }

    const endedAtIso = new Date().toISOString()

    // Close tollfree log
    await supabaseAdmin
      .from('tollfree_call_logs')
      .update({
        ended_at: endedAtIso,
        duration_sec: duration,
        status: twStatus,
        notes: callSid ?? null, // store CallSid for later correlation
      })
      .eq('id', logRow.id)

    // Derive user_id from member_id (if present)
    let ownerUserId: string | null = null
    if (logRow.member_id) {
      const { data: m } = await supabaseAdmin
        .from('members')
        .select('user_id')
        .eq('id', logRow.member_id)
        .maybeSingle()
      ownerUserId = m?.user_id || null
    }

    // Create a calls row for analytics
    await supabaseAdmin.from('calls').insert({
      source: 'twilio_tollfree',
      is_member_call: true,
      user_id: ownerUserId,
      member_id: logRow.member_id ?? null,
      from_number: fromDigits ? `+${fromDigits}` : null,
      to_number: toDigits ? `+${toDigits}` : null,
      started_at: logRow.started_at ?? endedAtIso,
      ended_at: endedAtIso,
      duration_seconds: duration,
      created_at: endedAtIso,
    })

    await supabaseAdmin.from('webhook_event_logs').insert({
      source: 'voice_status_finalize',
      payload: { callSid, duration, twStatus, logId: logRow.id }
    })

    return res.status(200).json({ ok: true })
  } catch (e: any) {
    try {
      await supabaseAdmin.from('webhook_event_logs').insert({
        source: 'voice_status_error',
        payload: { error: e?.message || String(e) },
      })
    } catch {}
    return res.status(200).json({ ok: false })
  }
}
