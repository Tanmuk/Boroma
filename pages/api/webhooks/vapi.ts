// /pages/api/webhooks/vapi.ts   (or your existing /pages/api/vapi.ts)
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// We’ll try your mail helpers in this order.
// Keep both imports so we don't break your app if you rename one later.
import * as mailer from '@/lib/mailer'   // expects mailer.sendEmail({ to, from, subject, html })
import * as emailLib from '@/lib/email'  // expects email.sendEmail({ to, from, subject, html })

const FROM = process.env.EMAIL_FROM || 'Boroma <hello@boroma.site>'
const ESCALATION_ALERT_EMAIL =
  process.env.ESCALATION_ALERT_EMAIL || 'designdelipro@gmail.com'

/** Normalize to last 10 digits. */
function last10(num: string | undefined | null) {
  if (!num) return null
  const only = num.replace(/[^0-9]/g, '')
  return only.slice(-10) || null
}

async function sendMail(to: string, subject: string, html: string) {
  try {
    if ((mailer as any)?.sendEmail) {
      await (mailer as any).sendEmail({ to, from: FROM, subject, html })
      return
    }
  } catch (e) {
    console.warn('mailer.sendEmail failed; falling back to emailLib:', e)
  }

  try {
    if ((emailLib as any)?.sendEmail) {
      await (emailLib as any).sendEmail({ to, from: FROM, subject, html })
      return
    }
  } catch (e) {
    console.warn('emailLib.sendEmail failed:', e)
  }

  console.warn('No usable sendEmail() helper found; email skipped.')
}

/** Try hard to extract caller, summary, duration from various Vapi shapes. */
function extractFromVapiBody(body: any) {
  const callerRaw =
    body?.customer?.number ??
    body?.call?.from ??
    body?.from ??
    body?.phone ??
    body?.metadata?.from ??
    body?.caller ??
    null

  const summary =
    body?.summary ??
    body?.analysis?.summary ??
    body?.data?.summary ??
    body?.assistant_summary ??
    body?.message?.summary ??
    null

  const durationSec =
    body?.durationSec ??
    body?.call?.durationSec ??
    body?.analysis?.durationSec ??
    null

  return { callerRaw, summary, durationSec }
}

/** Best-effort detection for an escalation flag in the payload. */
function detectEscalation(body: any): { isEscalation: boolean; reason?: string } {
  // Common places/flags you might emit from your assistant or function calls:
  if (body?.escalate === true) return { isEscalation: true, reason: 'body.escalate=true' }
  if (body?.escalation === true) return { isEscalation: true, reason: 'body.escalation=true' }
  if (body?.priority === 'high') return { isEscalation: true, reason: 'priority=high' }
  if (body?.analysis?.escalation === true)
    return { isEscalation: true, reason: 'analysis.escalation=true' }

  // If messages array includes something like {type:'escalation'} or text 'ESCALATE'
  const msgs = Array.isArray(body?.messages) ? body.messages : []
  for (const m of msgs) {
    const t = (m?.type || '').toString().toLowerCase()
    const text = (m?.text || m?.message || '').toString().toLowerCase()
    if (t.includes('escalation') || text.includes('escalate')) {
      return { isEscalation: true, reason: 'messages contain escalation' }
    }
  }

  return { isEscalation: false }
}

/** Simple branded summary email HTML. */
function summaryHtml(opts: {
  memberName?: string | null
  memberPhone?: string | null
  summary?: string | null
  durationSec?: number | null
}) {
  const { memberName, memberPhone, summary, durationSec } = opts
  const mins = durationSec ? Math.round(durationSec / 60) : null

  return `
  <div style="background:#f8fafc;padding:32px 0;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
      <div style="padding:20px 24px;border-bottom:1px solid #e2e8f0;">
        <div style="display:inline-block;background:linear-gradient(180deg,#FF8A3D,#FF5B04);color:#fff;border-radius:10px;padding:6px 8px;font-weight:700;">B</div>
        <span style="margin-left:8px;font-weight:800;letter-spacing:.2px;color:#0f172a;">Boroma</span>
      </div>
      <div style="padding:24px;">
        <h1 style="margin:0 0 12px 0;color:#0f172a;font-size:20px;line-height:28px;">Call summary</h1>
        <p style="margin:0 0 8px 0;color:#334155;font-size:14px;">Your member ${
          memberName ? `<b>${memberName}</b>` : ''
        } ${memberPhone ? `(${memberPhone})` : ''} completed a support call.</p>
        ${
          mins !== null
            ? `<p style="margin:0 0 8px 0;color:#334155;font-size:14px;">Approx. duration: <b>${mins} min</b>.</p>`
            : ''
        }
        ${
          summary
            ? `<div style="margin-top:12px;padding:12px;border:1px solid #e2e8f0;border-radius:10px;background:#f8fafc;">
                 <div style="color:#0f172a;font-weight:600;margin-bottom:6px;">Assistant’s summary</div>
                 <div style="color:#334155;font-size:14px;white-space:pre-wrap;">${summary}</div>
               </div>`
            : `<p style="color:#64748b;margin-top:12px;">(No summary content was provided in the webhook.)</p>`
        }
      </div>
      <div style="padding:14px 24px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px;">
        Need help? <a href="mailto:hello@boroma.site" style="color:#64748b;text-decoration:underline;">hello@boroma.site</a>
      </div>
    </div>
  </div>`
}

/** Short escalation email. */
function escalationHtml(opts: {
  reason?: string
  memberName?: string | null
  memberPhone?: string | null
  summary?: string | null
}) {
  const { reason, memberName, memberPhone, summary } = opts
  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Ubuntu,'Helvetica Neue',Arial;">
    <h2 style="margin:0 0 8px 0;">⚠️ Escalation Alert</h2>
    <p style="margin:0 0 8px 0;">Reason: ${reason || 'escalation flagged by assistant'}</p>
    <p style="margin:0 0 8px 0;">Member: ${memberName || '(unknown)'} ${memberPhone ? `(${memberPhone})` : ''}</p>
    ${
      summary
        ? `<div style="margin-top:8px;padding:8px;border:1px solid #ddd;border-radius:8px;">
             <div style="font-weight:600;margin-bottom:4px;">Assistant notes</div>
             <div style="white-space:pre-wrap;">${summary}</div>
           </div>`
        : ''
    }
  </div>`
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' })
  }

  try {
    const body = req.body || {}

    // Always log raw payload
    await supabaseAdmin.from('webhook_event_logs').insert({
      source: 'vapi',
      payload: body
    })

    const { callerRaw, summary, durationSec } = extractFromVapiBody(body)
    const callerDigits = last10(callerRaw)

    // Detect escalation in payload
    const { isEscalation, reason: escalationReason } = detectEscalation(body)

    if (!callerDigits) {
      // Still send escalation alert if flagged, even if we couldn't parse caller
      if (isEscalation) {
        await sendMail(
          ESCALATION_ALERT_EMAIL,
          'Boroma — Escalation alert (no caller match)',
          escalationHtml({ reason: escalationReason, memberName: null, memberPhone: null, summary })
        )
      }
      return res.status(200).json({ ok: true, reason: 'no caller number in payload' })
    }

    // 1) Find the member by phone
    const { data: member } = await supabaseAdmin
      .from('members')
      .select('id, user_id, name, phone, phone_digits, subscription_id')
      .or(`phone.eq.+${callerDigits},phone_digits.eq.${callerDigits}`)
      .limit(1)
      .maybeSingle()

    if (!member) {
      // Still alert if escalation happened
      if (isEscalation) {
        await sendMail(
          ESCALATION_ALERT_EMAIL,
          'Boroma — Escalation alert (unknown member)',
          escalationHtml({ reason: escalationReason, memberName: null, memberPhone: `+${callerDigits}`, summary })
        )
      }
      return res.status(200).json({ ok: true, reason: 'caller did not match a member' })
    }

    // 2) Opportunistic insert to tollfree_call_logs (status.ts will finalize)
    try {
      await supabaseAdmin.from('tollfree_call_logs').insert({
        member_id: member.id,
        phone: member.phone || `+${callerDigits}`,
        started_at: new Date().toISOString(),
        status: 'completed' // status.ts will refine
      })
    } catch {
      // ignore race/dup
    }

    // 3) Email ONLY the subscriber (owner)
    let subscriberEmail: string | null = null
    if (member.user_id) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('email, full_name')
        .eq('id', member.user_id)
        .limit(1)
        .maybeSingle()

      subscriberEmail = (profile as any)?.email || null
    }

    if (subscriberEmail) {
      await sendMail(
        subscriberEmail,
        'Your Boroma call summary',
        summaryHtml({
          memberName: member.name,
          memberPhone: member.phone,
          summary: summary || null,
          durationSec: durationSec ?? null
        })
      )
    }

    // 4) Escalation alert (to ops inbox)
    if (isEscalation) {
      await sendMail(
        ESCALATION_ALERT_EMAIL,
        'Boroma — Escalation alert',
        escalationHtml({
          reason: escalationReason,
          memberName: member.name,
          memberPhone: member.phone || `+${callerDigits}`,
          summary: summary || null
        })
      )
    }

    return res.status(200).json({
      ok: true,
      matchedMemberId: member.id,
      emailedSubscriber: Boolean(subscriberEmail),
      escalation: isEscalation
    })
  } catch (err: any) {
    console.error('vapi webhook error:', err)
    return res.status(500).json({ ok: false, error: err?.message || 'server error' })
  }
}
