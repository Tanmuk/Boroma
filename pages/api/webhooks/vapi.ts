// pages/api/webhooks/vapi.ts
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
    try { if (o.payload) return JSON.parse(o.payload) } catch {}
    return o
  }
  try { return JSON.parse(txt || '{}') } catch { return {} }
}
const last10 = (s?: string) => (s || '').replace(/[^\d]/g, '').slice(-10)

async function trySendEmail(to: string, subject: string, html: string) {
  try {
    const mod: any = await import('@/lib/mailer')
    if (mod?.sendEmail) { await mod.sendEmail(to, subject, html); return }
  } catch {}
  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    const FROM = process.env.EMAIL_FROM || 'Boroma <hello@boroma.site>'
    await resend.emails.send({ from: FROM, to, subject, html })
  } catch {}
}

function pickSummary(body: any): string {
  const s =
    body?.summary ||
    body?.data?.summary ||
    body?.message?.summary ||
    body?.output?.summary ||
    body?.call?.summary ||
    ''
  return typeof s === 'string' ? s : JSON.stringify(s || {}, null, 2)
}
function pickCustomerPhone(body: any): string | null {
  const cands = [
    body?.customerPhoneNumber,
    body?.customer?.phoneNumber,
    body?.customer?.number,
    body?.data?.customerPhoneNumber,
    body?.metadata?.customerPhoneNumber,
    body?.call?.customerPhoneNumber,
  ]
  for (const c of cands) {
    const d = last10(c)
    if (d) return `+${d}`
  }
  return null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') return res.status(200).json({ ok: true, probe: true })
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST, GET')
      return res.status(405).json({ ok: false, error: 'Method Not Allowed' })
    }

    const buf = await readRaw(req)
    const body: any = parse(req, buf)
    const when = new Date().toISOString()

    await supabaseAdmin.from('webhook_event_logs').insert({
      source: 'vapi_webhook',
      payload: { when, body },
    })

    const summary = pickSummary(body)
    const phone = pickCustomerPhone(body)
    let memberId: string | null = null
    let ownerUserId: string | null = null

    if (phone) {
      // find member by phone / phone_digits
      const d = last10(phone)
      const { data: m } = await supabaseAdmin
        .from('members')
        .select('id, user_id')
        .or(`phone.eq.+${d},phone_digits.eq.${d}`)
        .limit(1)
      if (m && m.length) {
        memberId = m[0].id
        ownerUserId = m[0].user_id
      }
    }

    // Fallback: last completed toll-free call in the last 20 minutes
    if (!memberId) {
      const { data: t } = await supabaseAdmin
        .from('tollfree_call_logs')
        .select('id, member_id, ended_at, status')
        .eq('status', 'completed')
        .gte('ended_at', new Date(Date.now() - 20 * 60 * 1000).toISOString())
        .order('ended_at', { ascending: false })
        .limit(1)

      if (t && t.length && t[0].member_id) {
        memberId = t[0].member_id
        const { data: m } = await supabaseAdmin
          .from('members')
          .select('user_id')
          .eq('id', memberId)
          .maybeSingle()
        ownerUserId = m?.user_id || null
      }
    }

    if (!ownerUserId) {
      // Nowhere to email
      await supabaseAdmin.from('webhook_event_logs').insert({
        source: 'vapi_webhook_no_owner',
        payload: { phone, summaryLen: summary?.length || 0 },
      })
      return res.status(200).json({ ok: true, note: 'no owner found' })
    }

    // Get owner email
    const { data: p } = await supabaseAdmin
      .from('profiles')
      .select('email')
      .eq('id', ownerUserId)
      .maybeSingle()
    const email = (p as any)?.email || null
    if (!email) return res.status(200).json({ ok: true, note: 'owner has no email' })

    const subject = 'Boroma call summary'
    const html = `
      <div style="font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
        <h2 style="margin:0 0 8px 0">Your Boroma call summary</h2>
        ${phone ? `<p style="margin:0 0 12px 0">Caller: <strong>${phone}</strong></p>` : ''}
        <pre style="white-space:pre-wrap;font-size:14px;line-height:1.5">${summary}</pre>
      </div>
    `
    await trySendEmail(email, subject, html)

    // Optional escalation alert
    const looksEscalated =
      body?.escalation === true ||
      body?.data?.escalated === true ||
      /escalat(e|ion)/i.test(JSON.stringify(body || {}))

    if (looksEscalated && process.env.ESCALATION_EMAIL_TO) {
      await trySendEmail(
        process.env.ESCALATION_EMAIL_TO,
        'Boroma escalation alert',
        `<p>Escalation flagged for ${phone || 'unknown caller'}</p><pre>${summary}</pre>`
      )
    }

    return res.status(200).json({ ok: true })
  } catch (e: any) {
    try {
      await supabaseAdmin.from('webhook_event_logs').insert({
        source: 'vapi_webhook_error',
        payload: { error: e?.message || String(e) },
      })
    } catch {}
    return res.status(200).json({ ok: false })
  }
}
