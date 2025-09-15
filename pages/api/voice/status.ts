// pages/api/voice/status.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// Twilio will POST x-www-form-urlencoded. We accept both urlencoded and JSON.
export const config = { api: { bodyParser: false } }

type TwilioStatusBody = {
  CallSid?: string
  CallStatus?: string
  CallDuration?: string | number
  From?: string
  To?: string
  // occasionally present
  RecordingUrl?: string
}

async function readRawBody(req: NextApiRequest): Promise<Buffer> {
  const chunks: Uint8Array[] = []
  for await (const c of req) chunks.push(typeof c === 'string' ? Buffer.from(c) : c)
  return Buffer.concat(chunks)
}

function parseBody(buf: Buffer, req: NextApiRequest): TwilioStatusBody {
  const ct = (req.headers['content-type'] || '').toLowerCase()
  const text = buf.toString('utf8').trim()

  // x-www-form-urlencoded → use URLSearchParams
  if (ct.includes('application/x-www-form-urlencoded')) {
    const p = new URLSearchParams(text)
    const obj: any = {}
    p.forEach((v, k) => (obj[k] = v))
    return obj as TwilioStatusBody
  }

  // JSON (some tools send JSON to test)
  try {
    return JSON.parse(text || '{}')
  } catch {
    // Unknown – return empty
    return {}
  }
}

// last 10 helper
const last10 = (n?: string | null) =>
  (n || '').replace(/[^\d]/g, '').slice(-10) || null

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    res.setHeader('Allow', 'POST, GET')
    return res.status(405).send('Method Not Allowed')
  }

  // Twilio sometimes pings GET when you test from the browser – return OK
  if (req.method === 'GET') return res.status(200).json({ ok: true })

  try {
    const buf = await readRawBody(req)
    const body = parseBody(buf, req)

    const callSid = body.CallSid || null
    const callStatus = (body.CallStatus || '').toString() || 'completed'
    const durationSec = Number(body.CallDuration || 0)
    const fromDigits = last10(body.From)
    const toDigits = last10(body.To)

    // Close the tollfree_call_logs row. We stored CallSid in "notes" when the call started.
    if (callSid) {
      await supabaseAdmin
        .from('tollfree_call_logs')
        .update({
          ended_at: new Date().toISOString(),
          duration_sec: durationSec,
          status: callStatus,
          notes: callSid, // keep it as the canonical reference
        })
        .eq('notes', callSid)
        .or(`status.is.null, status.eq.in_progress`) // idempotent safety
    } else if (fromDigits && toDigits) {
      // Fallback: if we didn’t get CallSid for some reason, try to close the most recent in-progress row for this caller
      await supabaseAdmin
        .from('tollfree_call_logs')
        .update({
          ended_at: new Date().toISOString(),
          duration_sec: durationSec,
          status: callStatus,
        })
        .match({ phone: `+${fromDigits}`, status: 'in_progress' })
    }

    // Optional: also write a lightweight “calls” row (won’t fail the webhook if absent)
    try {
      await supabaseAdmin.from('calls').insert({
        from_number: fromDigits ? `+${fromDigits}` : null,
        to_number: toDigits ? `+${toDigits}` : null,
        duration_seconds: durationSec || null,
        source: 'twilio',
        is_member_call: true,
        resolved: null,
      })
    } catch {
      // non-blocking
    }

    return res.status(200).json({ ok: true })
  } catch (e: any) {
    // Never fail Twilio – log and return 200
    try {
      await supabaseAdmin.from('webhook_event_logs').insert({
        source: 'twilio_status_error',
        payload: { error: e?.message || String(e) },
      })
    } catch {}
    return res.status(200).json({ ok: false })
  }
}
