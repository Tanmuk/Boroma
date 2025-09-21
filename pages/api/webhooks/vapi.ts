import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendCallSummaryEmail } from '@/lib/email'

// Optional: if you set a shared secret in Vapi headers (x-boroma-signature)
const VAPI_SHARED_SECRET = process.env.VAPI_WEBHOOK_SECRET

// Utility: insert the raw event for auditability
async function logWebhookEvent(source: string, payload: any) {
  await supabaseAdmin.from('webhook_event_logs').insert({
    source,
    payload,
  })
}

// Utility: deep-search for a key anywhere in the JSON (first hit wins)
function deepFindString(obj: any, key: string): string | null {
  if (!obj || typeof obj !== 'object') return null
  if (Object.prototype.hasOwnProperty.call(obj, key)) {
    const v = obj[key]
    if (typeof v === 'string' && v.trim().length) return v.trim()
  }
  for (const k of Object.keys(obj)) {
    const v = obj[k]
    if (v && typeof v === 'object') {
      const hit = deepFindString(v, key)
      if (hit) return hit
    }
  }
  return null
}

// Utility: try common id keys that providers use
function extractAnyCallId(payload: any): string | null {
  const candidates = [
    'call_sid',
    'callSid',
    'callId',
    'conversationId',
    'session_id',
    'sessionId',
    'sid',
  ]
  for (const key of candidates) {
    const val = deepFindString(payload, key)
    if (val) return val
  }
  return null
}

// Correlate this webhook to a tollfree_call_logs row.
// Strategy:
//   1) If a call id is present in the payload, match call_sid directly.
//   2) Else, use a time window around "now" and take the most recent completed row.
async function correlateToTollfreeCall(payload: any) {
  const candidateId = extractAnyCallId(payload)

  if (candidateId) {
    const { data: bySid, error } = await supabaseAdmin
      .from('tollfree_call_logs')
      .select('*')
      .eq('call_sid', candidateId)
      .order('ended_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!error && bySid) return bySid
  }

  // fallback: most recent completed call within the last 15 minutes
  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
  const { data: recent, error: recErr } = await supabaseAdmin
    .from('tollfree_call_logs')
    .select('*')
    .not('ended_at', 'is', null)
    .gte('ended_at', fifteenMinAgo)
    .order('ended_at', { ascending: false })
    .limit(1)

  if (!recErr && recent && recent.length) return recent[0]
  return null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only POST is supported
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  // Optional shared-secret verification
  if (VAPI_SHARED_SECRET) {
    const sig = req.headers['x-boroma-signature']
    if (typeof sig !== 'string' || sig !== VAPI_SHARED_SECRET) {
      // Log and reject (prevents spam)
      await logWebhookEvent('vapi_invalid_sig', { headers: req.headers })
      return res.status(401).json({ error: 'Invalid signature' })
    }
  }

  // NOTE: Vercel/Next already parsed JSON for us (if content-type is application/json)
  const payload = req.body || {}

  // Always log the incoming event for later forensics
  await logWebhookEvent('vapi', payload)

  // Extract a summary wherever it lives
  const summary =
    deepFindString(payload, 'summary') ||
    deepFindString(payload, 'call_summary') ||
    deepFindString(payload, 'analysis')

  // If there is no summary, acknowledge and exit (not all events carry one)
  if (!summary) {
    return res.status(200).json({ ok: true, reason: 'no_summary_in_payload' })
  }

  // Correlate this event to the most likely toll-free call
  const call = await correlateToTollfreeCall(payload)
  if (!call) {
    // We couldn’t confidently match a call. Ack and log a diagnostic row.
    await logWebhookEvent('summary_unmatched', { reason: 'no_call_match', summary })
    return res.status(200).json({ ok: true, reason: 'no_call_match' })
  }

  // Resolve subscriber email via member -> profiles
  const { data: memberRow } = await supabaseAdmin
    .from('members')
    .select('id, user_id, name')
    .eq('id', call.member_id)
    .maybeSingle()

  if (!memberRow?.user_id) {
    await logWebhookEvent('summary_unmatched', { reason: 'member_without_user', call_sid: call.call_sid, member_id: call.member_id })
    return res.status(200).json({ ok: true, reason: 'member_without_user' })
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('email, full_name')
    .eq('id', memberRow.user_id)
    .maybeSingle()

  const to = profile?.email
  if (!to) {
    await logWebhookEvent('summary_unmatched', { reason: 'no_profile_email', user_id: memberRow.user_id })
    return res.status(200).json({ ok: true, reason: 'no_profile_email' })
  }

  // Compose and send the email
  try {
    await sendCallSummaryEmail({
      to,
      memberName: memberRow.name || 'Your member',
      summary,
      startedAt: call.started_at,
      endedAt: call.ended_at,
      callSid: call.call_sid || null,
    })

    // Audit success to logs (no schema change)
    await logWebhookEvent('summary_sent', {
      to,
      member_id: memberRow.id,
      call_sid: call.call_sid,
    })

    return res.status(200).json({ ok: true })
  } catch (err: any) {
    await logWebhookEvent('summary_send_failed', {
      error: err?.message || String(err),
      to,
      member_id: memberRow.id,
      call_sid: call.call_sid,
    })
    // Acknowledge to prevent retries storm; the failure is captured in logs
    return res.status(200).json({ ok: false, reason: 'email_send_failed' })
  }
}
