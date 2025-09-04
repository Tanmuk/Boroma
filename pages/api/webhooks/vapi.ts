import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendEmail } from '@/lib/email'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false })

  const secret = process.env.VAPI_WEBHOOK_SECRET
  const provided = req.headers['x-boroma-secret'] as string | undefined
  if (!secret || !provided || provided !== secret) {
    return res.status(401).json({ ok: false, error: 'Invalid webhook secret' })
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {})

  // Always log the raw event
  await supabaseAdmin.from('webhook_event_logs').insert({ source: 'vapi', payload: body }).catch(()=>{})

  // Expecting event "call.completed"
  try {
    const caller = body?.caller?.phone || body?.from || body?.phone || null
    const seconds = body?.duration_seconds ?? body?.durationSeconds ?? null
    const issue = body?.issue_type || body?.issue || 'General'
    const resolved = !!(body?.resolved ?? true)
    const startedAt = body?.started_at || body?.startedAt || null
    const endedAt = body?.ended_at || body?.endedAt || null
    const recordingUrl = body?.recording_url || null
    const transcriptUrl = body?.transcript_url || null

    let userId: string | null = null
    let memberName = 'Member'

    if (caller) {
      const { data: m } = await supabaseAdmin.from('members').select('user_id,name').eq('phone', caller).maybeSingle()
      if (m) { userId = m.user_id; memberName = m.name || memberName }
    }

    const { data: callRow } = await supabaseAdmin.from('calls').insert({
      user_id: userId, from_phone: caller, seconds, issue_type: issue,
      resolved, started_at: startedAt, ended_at: endedAt,
      recording_url: recordingUrl, transcript_url: transcriptUrl
    }).select('id').maybeSingle()

    // Email summary to owner + member (if we can find addresses)
    if (userId) {
      const { data: user } = await supabaseAdmin.auth.admin.getUserById(userId)
      const ownerEmail = user?.user?.email || null

      // If you store member emails, include them too (optional)
      // const memberEmail = ...

      const mins = seconds ? Math.round(seconds/60) : null
      const pretty = `
        <h2>Call summary</h2>
        <p><b>Member:</b> ${memberName} (${caller || 'unknown'})</p>
        <p><b>Issue:</b> ${issue}</p>
        <p><b>Resolved:</b> ${resolved ? 'Yes' : 'No'}</p>
        <p><b>Duration:</b> ${mins ?? '?'} min</p>
        ${recordingUrl ? `<p><a href="${recordingUrl}">Recording</a></p>` : ''}
        ${transcriptUrl ? `<p><a href="${transcriptUrl}">Transcript</a></p>` : ''}
        <p><a href="https://www.boroma.site/dashboard">Open dashboard</a></p>
      `
      if (ownerEmail) await sendEmail(ownerEmail, 'Boroma call summary', pretty)
    }

    return res.json({ ok: true, id: callRow?.id })
  } catch (e) {
    console.error('vapi webhook error', e)
    return res.status(200).json({ ok: true }) // don't retry forever
  }
}
