// pages/api/webhooks/vapi.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { Resend } from 'resend'

export const config = { api: { bodyParser: true } } // Vapi sends JSON

const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const FROM = 'Boroma <hello@boroma.site>'
const ESCALATION_ALERT = 'designdelipro@gmail.com'

// helpers
const last10 = (n?: string | null) =>
  (n || '').replace(/[^\d]/g, '').slice(-10) || null

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null

async function email(to: string, subject: string, html: string) {
  if (!resend) return
  try {
    await resend.emails.send({ from: FROM, to, subject, html })
  } catch {
    // don’t fail webhook on email errors
  }
}

function htmlShell(title: string, body: string) {
  return `
  <div style="background:#f7fafc;padding:24px">
    <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px">
      <div style="padding:16px 20px;border-bottom:1px solid #e5e7eb;font-weight:700">Boroma</div>
      <div style="padding:20px">
        <h2 style="margin:0 0 8px 0;font:600 18px/1.3 system-ui">${title}</h2>
        <div style="color:#111827;font:400 14px/1.5 system-ui">${body}</div>
      </div>
    </div>
  </div>`
}

// Look up subscriber’s email by the calling member’s phone
async function findSubscriberEmailByCallerDigits(memberDigits: string) {
  // 1) member by phone_digits
  const { data: member, error: mErr } = await supabaseAdmin
    .from('members')
    .select('id, name, subscription_id')
    .eq('phone_digits', memberDigits)
    .maybeSingle()

  if (!member || mErr) return { email: null as string | null, member }

  if (!member.subscription_id) return { email: null, member }

  // 2) subscription -> user_id (subscriber)
  const { data: sub, error: sErr } = await supabaseAdmin
    .from('subscriptions')
    .select('user_id')
    .eq('id', member.subscription_id)
    .maybeSingle()

  if (!sub || sErr || !sub.user_id) return { email: null, member }

  // 3) auth user email (requires service role – you have supabaseAdmin)
  try {
    const { data } = await supabaseAdmin.auth.admin.getUserById(sub.user_id)
    const email = (data?.user?.email as string) || null
    return { email, member }
  } catch {
    return { email: null, member }
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).send('Method Not Allowed')
  }

  try {
    const payload = (req.body ?? {}) as any

    // Always save the raw payload for audit/debug
    try {
      await supabaseAdmin.from('webhook_event_logs').insert({
        source: 'vapi',
        payload
      })
    } catch {}

    // Try to normalize a few fields we care about
    const call = payload.call || payload.data || payload
    const customerNum =
      call?.customer?.number ||
      call?.customer?.phoneNumber ||
      call?.customer_phone_number ||
      call?.from ||
      payload?.customerPhoneNumber ||
      null
    const assistantNum =
      call?.assistant?.phoneNumber ||
      call?.assistant_phone_number ||
      call?.to ||
      null

    const fromDigits = last10(customerNum)
    const toDigits = last10(assistantNum)

    const vapiSummary =
      payload.summary ||
      call?.summary ||
      payload?.metadata?.summary ||
      null

    const callSid =
      call?.twilio?.callSid ||
      payload?.twilio?.callSid ||
      payload?.callSid ||
      payload?.metadata?.callSid ||
      null

    const endedReason =
      payload.endedReason ||
      call?.endedReason ||
      payload?.reason ||
      null

    const durationSec =
      Number(payload.durationSec || call?.durationSec || payload?.duration || 0)

    // 1) Close the tollfree_call_logs row (defensive: also done by /voice/status)
    if (callSid) {
      await supabaseAdmin
        .from('tollfree_call_logs')
        .update({
          ended_at: new Date().toISOString(),
          duration_sec: durationSec || null,
          status: 'completed',
          notes: callSid
        })
        .eq('notes', callSid)
    }

    // 2) Email the subscriber a summary (if we can identify them)
    if (fromDigits) {
      const { email: subscriberEmail, member } = await findSubscriberEmailByCallerDigits(fromDigits)

      if (subscriberEmail) {
        const title = `Call summary for ${member?.name || `+${fromDigits}`}`
        const bodyHtml = `
          <p>Assistant number: ${toDigits ? `+${toDigits}` : 'n/a'}</p>
          <p>Member: ${member?.name || 'n/a'} (${fromDigits ? `+${fromDigits}` : 'n/a'})</p>
          <p>Duration: ${durationSec ? `${durationSec}s` : 'n/a'}</p>
          ${vapiSummary ? `<h3 style="margin:16px 0 6px 0">Summary</h3><p>${String(vapiSummary).replace(/\n/g, '<br/>')}</p>` : `<p>No summary text was provided.</p>`}
          ${endedReason ? `<p style="color:#6b7280">Ended reason: ${endedReason}</p>` : ''}
        `
        await email(subscriberEmail, title, htmlShell(title, bodyHtml))
      }

      // 3) Optional escalation: if Vapi tags this in any way, alert ops
      const escalated =
        payload.escalated === true ||
        (Array.isArray(payload.tags) && payload.tags.some((t: string) => /escalate/i.test(t))) ||
        /escalat/i.test(String(endedReason || ''))

      if (escalated) {
        const subject = `⚠️ Escalation: ${member?.name || `+${fromDigits}`}`
        const body = `
          <p>A call has requested escalation.</p>
          <p><b>Member</b>: ${member?.name || 'n/a'} (${fromDigits ? `+${fromDigits}` : 'n/a'})</p>
          <p><b>Reason</b>: ${endedReason || 'n/a'}</p>
          ${vapiSummary ? `<p><b>Summary</b>: ${String(vapiSummary).replace(/\n/g, '<br/>')}</p>` : ''}
        `
        await email(ESCALATION_ALERT, subject, htmlShell(subject, body))
      }
    }

    return res.status(200).json({ received: true })
  } catch (e: any) {
    try {
      await supabaseAdmin.from('webhook_event_logs').insert({
        source: 'vapi_error',
        payload: { error: e?.message || String(e) }
      })
    } catch {}
    // Don’t retry storm Vapi – acknowledge but note failure
    return res.status(200).json({ received: true, error: true })
  }
}
