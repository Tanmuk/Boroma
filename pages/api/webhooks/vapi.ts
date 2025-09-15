// /pages/api/webhooks/vapi.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { emailShell } from '@/lib/email'         // if you have a shell helper; otherwise inline a minimal HTML
import { sendEmail } from '@/lib/mailer'         // must exist in your project
const ESCALATE_TO = 'designdelipro@gmail.com'

function last10(s?: string) {
  return (s || '').replace(/\D/g, '').slice(-10)
}

// very defensive extractor – Vapi changes fields across providers; this hunts for a phone
function extractPhone(payload: any): string | null {
  const p =
    payload?.phone ||
    payload?.body?.message?.phone ||
    payload?.body?.message?.call?.customer?.number ||
    payload?.body?.message?.fromNumber ||
    payload?.body?.message?.metadata?.from ||
    null

  if (typeof p === 'string' && last10(p).length === 10) return `+${last10(p)}`
  // last resort: grep for a +1..........
  const asText = JSON.stringify(payload || {})
  const m = asText.match(/\+1\d{10}/)
  if (m) return m[0]
  return null
}

function extractSummary(payload: any): string | null {
  const s =
    payload?.summary ||
    payload?.body?.message?.summary ||
    payload?.body?.summary ||
    null
  return typeof s === 'string' && s.trim() ? s.trim() : null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).send('Method Not Allowed')
  }

  const payload = req.body || {}

  // 1) store raw
  await supabaseAdmin.from('webhook_event_logs').insert({
    source: 'vapi_webhook',
    payload,
  })

  // 2) see if there’s a useful summary
  const summary = extractSummary(payload)
  const phone = extractPhone(payload)

  if (!summary) return res.status(200).json({ ok: true }) // ignore non-summary events

  // 3) find the owner email
  let toEmail: string | null = null
  if (phone) {
    const d10 = last10(phone)
    // member by phone_digits or phone
    const { data: member } = await supabaseAdmin
      .from('members')
      .select('id,user_id,subscription_id,phone,phone_digits')
      .or(`phone.eq.+${d10},phone_digits.eq.${d10}`)
      .maybeSingle()

    if (member?.subscription_id) {
      const { data: sub } = await supabaseAdmin
        .from('subscriptions')
        .select('user_id,status')
        .eq('id', member.subscription_id)
        .maybeSingle()

      if (sub?.user_id) {
        const { data: prof } = await supabaseAdmin
          .from('profiles')
          .select('id,full_name,phone,email')
          .eq('id', sub.user_id)
          .maybeSingle()

        if (prof?.email) toEmail = prof.email
      }
    }
  }

  // 4) send the summary email
  const html =
    emailShell?.({
      title: 'Call summary',
      intro:
        'Here is the call summary from your Boroma assistant. You can reply to this email if anything looks off.',
      bullets: [],
      ctaText: 'Open Dashboard',
      ctaHref: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://boroma.site'}/dashboard`,
      footnote: null,
    })?.replace('</div></div><div', `<p style="white-space:pre-wrap;margin-top:16px">${summary}</p></div></div><div`) ||
    `<div style="font-family:Inter,Arial,sans-serif"><h2>Call summary</h2><pre style="white-space:pre-wrap">${summary}</pre></div>`

  const sendList = [toEmail || ESCALATE_TO]
  // If we found the owner, also CC the escalation mailbox so you see everything early on
  if (toEmail) sendList.push(ESCALATE_TO)

  await Promise.all(sendList.map((addr) => sendEmail(addr, 'Boroma call summary', html)))

  return res.status(200).json({ ok: true, emailed: !!toEmail })
}
