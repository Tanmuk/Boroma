import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendEmail } from '@/lib/email'

/**
 * POST /api/webhooks/vapi
 * - Verifies our shared secret (accepts either header name).
 * - Logs every event into webhook_event_logs.
 * - On `end-of-call-report`, inserts into `calls` and emails the subscriber.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' })
  }

  // --- signature (accept either header name so it matches your Vapi UI)
  const secret = process.env.VAPI_WEBHOOK_SECRET
  const provided =
    (req.headers['x-boroma-secret'] as string | undefined) ??
    (req.headers['x-boroma-signature'] as string | undefined)

  if (!secret || !provided || provided !== secret) {
    return res.status(401).json({ ok: false, error: 'Bad signature' })
  }

  // Vapi posts JSON; Next will parse it, but be defensive if a string arrives.
  const body: any = typeof req.body === 'string' ? safeJson(req.body) : (req.body || {})

  // 1) Always log raw event for audit/diagnostics
  try {
    await supabaseAdmin.from('webhook_event_logs').insert({
      source: 'vapi_webhook',
      payload: body,
    })
  } catch {}

  const msgType = body?.type || body?.event || body?.message?.type
  if (msgType !== 'end-of-call-report') {
    // Only the final report writes to calls & emails the owner
    return res.status(200).json({ ok: true, ignored: msgType ?? 'unknown' })
  }

  try {
    const call = body.call || body?.message?.call || {}
    const summary: string = body.summary || body?.message?.summary || ''

    const startedAt = toIso(call.startedAt || call.started_at)
    const endedAt   = toIso(call.endedAt   || call.ended_at)
    const seconds   = num(call.durationSec || call.duration_sec || call.durationSeconds || call.duration_seconds)
    const costCents = num((call.costUsd ?? call.cost_usd ?? 0) * 100)

    const from = normalize(call.customer?.number || call.customerNumber || call.from || body.from)
    const to   = normalize(call.assistant?.number || call.assistantNumber || call.to   || body.to)

    const recordingUrl  = call.recordingUrl  || call.recording_url  || null
    const transcriptUrl = call.transcriptUrl || call.transcript_url || null
    const issue         = (call.tags && Array.isArray(call.tags) ? call.tags.join(', ') : '') || 'support'

    // 2) Resolve subscriber from member phone (last 10)
    const last10 = (from || '').slice(-10)
    let ownerUserId: string | null = null
    let memberId: string | null = null
    let ownerEmail: string | null = null
    let memberName = 'Member'

    if (last10) {
      const { data: m } = await supabaseAdmin
        .from('members')
        .select('id,name,user_id, profiles:profiles!inner(email)')
        .eq('phone_digits', last10)
        .limit(1)
        .maybeSingle()

      if (m) {
        ownerUserId = m.user_id
        memberId = m.id
        memberName = m.name || memberName
        ownerEmail = m.profiles?.email || null
      }
    }

    // 3) Persist into calls (matches your posted schema exactly)
    await supabaseAdmin.from('calls').insert({
      user_id: ownerUserId,
      member_id: memberId,
      is_member_call: true,
      phone: from,                 // legacy/back-compat
      from_number: from,
      to_number: to,
      started_at: startedAt,
      ended_at: endedAt,
      duration_seconds: seconds ?? null,
      issue_type: issue,
      resolved: true,
      recording_url: recordingUrl,
      transcript_url: transcriptUrl,
      cost_cents: Number.isFinite(costCents ?? NaN) ? costCents : null,
      source: 'vapi',
    })

    // 4) Email summary to the subscriber (idempotency key tied to call.id)
    if (ownerEmail) {
      const mins = seconds != null ? Math.round(seconds / 60) : null
      const html = `
        <h2>Boroma call summary</h2>
        <p><b>Member:</b> ${esc(memberName)}</p>
        ${summary ? `<p style="white-space:pre-wrap">${esc(summary)}</p>` : '<p>No summary provided.</p>'}
        <p><b>From:</b> ${esc(from || '')} &nbsp; <b>To:</b> ${esc(to || '')}</p>
        <p><b>Duration:</b> ${mins ?? '?'} min</p>
        ${recordingUrl ? `<p><a href="${recordingUrl}">Recording</a></p>` : ''}
        ${transcriptUrl ? `<p><a href="${transcriptUrl}">Transcript</a></p>` : ''}
        <p><a href="https://www.boroma.site/dashboard">Open dashboard</a></p>
      `
      await sendEmail(ownerEmail, 'Boroma call summary', html, String(call.id || '') || undefined)
    }

    return res.json({ ok: true })
  } catch (err) {
    console.error('vapi handler error', err)
    // Acknowledge so Vapi doesn’t retry forever; details are in webhook_event_logs.
    return res.status(200).json({ ok: true })
  }
}

// ---------- utils ----------
function safeJson(s: string) { try { return JSON.parse(s) } catch { return {} } }
function num(v: any): number | null { const x = Number(v); return Number.isFinite(x) ? x : null }
function toIso(v: any): string | null {
  if (!v) return null
  const d = typeof v === 'number' ? new Date(v * 1000) : new Date(v)
  return isNaN(+d) ? null : d.toISOString()
}
function normalize(p?: string | null) { return p ? String(p).replace(/[^0-9+]/g, '') : null }
function esc(s: string) {
  return String(s).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'} as any)[m])
}
