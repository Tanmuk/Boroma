// /pages/api/webhooks/stripe.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// Stripe needs raw body
export const config = { api: { bodyParser: false } }

// ===== ENV =====
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET as string
const RESEND_API_KEY = process.env.RESEND_API_KEY as string

// optional but nice:
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.boroma.site'
const PORTAL = process.env.NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL || 'https://billing.stripe.com/p/login/5kA7tX49H7PNbAs288'
const FROM = process.env.RESEND_FROM || 'Boroma <hello@boroma.site>'

if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
  throw new Error('Missing STRIPE env')
}

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null

async function readRawBody(req: NextApiRequest): Promise<Buffer> {
  const chunks: Uint8Array[] = []
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  return Buffer.concat(chunks)
}

// ---------- email template helpers ----------
function emailShell(opts: {
  title: string
  intro: string
  bullets?: string[]
  ctaText?: string
  ctaHref?: string
  footnote?: string
}) {
  const { title, intro, bullets = [], ctaText, ctaHref, footnote } = opts
  const bulletHtml = bullets.length
    ? `<ul style="margin:16px 0 0 0;padding:0;list-style:none;color:#0f172a;font-size:14px;line-height:22px;">
         ${bullets.map(b => `<li style="margin:6px 0;">• ${b}</li>`).join('')}
       </ul>`
    : ''
  const cta = ctaText && ctaHref
    ? `<div style="margin-top:20px;">
         <a href="${ctaHref}" style="display:inline-block;background:#FF5B04;color:#fff;text-decoration:none;padding:10px 16px;border-radius:10px;font-weight:600;">
           ${ctaText}
         </a>
       </div>`
    : ''
  const note = footnote
    ? `<p style="margin:18px 0 0 0;color:#64748b;font-size:12px;line-height:18px;">${footnote}</p>`
    : ''
  return `
  <div style="background:#f8fafc;padding:32px 0;">
    <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">
      <div style="padding:20px 24px;border-bottom:1px solid #e2e8f0;">
        <div style="display:inline-block;background:linear-gradient(180deg,#FF8A3D,#FF5B04);color:#fff;border-radius:10px;padding:6px 8px;font-weight:700;">B</div>
        <span style="margin-left:8px;font-weight:800;letter-spacing:.2px;color:#0f172a;">Boroma</span>
      </div>
      <div style="padding:24px;">
        <h1 style="margin:0 0 8px 0;color:#0f172a;font-size:20px;line-height:28px;">${title}</h1>
        <p style="margin:0;color:#334155;font-size:14px;line-height:22px;">${intro}</p>
        ${bulletHtml}
        ${cta}
        ${note}
      </div>
      <div style="padding:14px 24px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px;">
        Need help? Email <a href="mailto:hello@boroma.site" style="color:#64748b;text-decoration:underline;">hello@boroma.site</a>
      </div>
    </div>
  </div>`
}

async function sendEmail(to: string, subject: string, html: string, idKey: string) {
  if (!resend) return
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
      headers: { 'Idempotency-Key': idKey }
    })
  } catch {
    // never crash webhook on email errors
  }
}
const idemKey = (eventId: string, tag: string) => `${eventId}:${tag}`

// specific emails
async function sendPlanActivatedEmail(to: string, idKey: string) {
  await sendEmail(
    to,
    'Your Boroma plan is active',
    emailShell({
      title: 'Your Boroma plan is active',
      intro: 'Welcome aboard. Your toll-free support is now ready for approved family members.',
      bullets: [
        'Toll-free support number: 877-766-6307 (share only with approved members)',
        'Add or remove members any time from your dashboard',
        'You will receive a call summary after each support call'
      ],
      ctaText: 'Manage billing & members',
      ctaHref: PORTAL,
      footnote: `Dashboard: ${SITE}/dashboard`
    }),
    idKey
  )
}
async function sendCancelAtPeriodEndEmail(to: string, periodEndUnix: number | null, idKey: string) {
  const when = periodEndUnix ? new Date(periodEndUnix * 1000).toLocaleDateString() : 'the end of your current period'
  await sendEmail(
    to,
    'Your Boroma plan will end soon',
    emailShell({
      title: 'Your plan will end soon',
      intro: `We’ve received your cancellation. Your access will continue until ${when}.`,
      bullets: [
        'Members will keep access until the end date',
        'You can reactivate any time before the period ends'
      ],
      ctaText: 'Manage billing',
      ctaHref: PORTAL
    }),
    idKey
  )
}
async function sendPlanCanceledEmail(to: string, idKey: string) {
  await sendEmail(
    to,
    'Your Boroma plan is cancelled',
    emailShell({
      title: 'Your Boroma plan is cancelled',
      intro: 'We’re sorry to see you go. Your toll-free access has been turned off.',
      bullets: [
        'You can still use the one-time free trial line if you haven’t already',
        'Come back any time—your settings will be waiting'
      ],
      ctaText: 'Restart plan',
      ctaHref: `${SITE}#pricing`
    }),
    idKey
  )
}
async function sendPaymentFailedEmail(to: string, invoiceUrl: string | null, idKey: string) {
  await sendEmail(
    to,
    'Payment failed — action needed',
    emailShell({
      title: 'Payment failed—please update your card',
      intro: 'We could not process your latest payment. Update your card to keep toll-free access active.',
      bullets: ['We’ll retry automatically over the next few days'],
      ctaText: 'Update payment method',
      ctaHref: invoiceUrl || PORTAL
    }),
    idKey
  )
}

// ---------- email router (idempotent) ----------
async function handleStripeEmails(event: Stripe.Event) {
  async function getEmail(): Promise<string | null> {
    const obj: any = (event as any).data?.object
    if (!obj) return null
    if (obj.customer_email) return obj.customer_email
    if (obj.receipt_email) return obj.receipt_email
    if (obj.customer_details?.email) return obj.customer_details.email
    const customerId = obj.customer || obj.customer_id
    if (customerId) {
      const cust = await stripe.customers.retrieve(customerId)
      // @ts-ignore
      return (cust?.email as string) || null
    }
    return null
  }

  switch (event.type) {
    // Preferred trigger for welcome email
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      if (invoice.billing_reason === 'subscription_create') {
        const to = await getEmail()
        if (to) await sendPlanActivatedEmail(to, idemKey(event.id, 'activated'))
      }
      break
    }

    // Fallback: if Stripe didn’t emit the invoice event (rare), welcome on checkout completion
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.payment_status === 'paid') {
        const to = session.customer_details?.email || session.customer_email || (await getEmail())
        if (to) await sendPlanActivatedEmail(to, idemKey(event.id, 'activated_fallback'))
      }
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const prev = (event as any).data?.previous_attributes
      const turnedOn = prev && prev.cancel_at_period_end === false && sub.cancel_at_period_end === true
      if (turnedOn) {
        const to = await getEmail()
        if (to) await sendCancelAtPeriodEndEmail(to, sub.current_period_end, idemKey(event.id, 'cancel_at_period_end'))
      }
      break
    }

    case 'customer.subscription.deleted': {
      const to = await getEmail()
      if (to) await sendPlanCanceledEmail(to, idemKey(event.id, 'cancelled'))
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const to = await getEmail()
      const url = invoice.hosted_invoice_url || null
      if (to) await sendPaymentFailedEmail(to, url, idemKey(event.id, 'pay_failed'))
      break
    }

    default:
      break
  }
}

// ---------- DB upsert ----------
async function upsertSubscriptionRow(sub: Stripe.Subscription, userId?: string | null) {
  let resolvedUserId: string | null = userId ?? null
  if (!resolvedUserId) {
    try {
      const cust = await stripe.customers.retrieve(sub.customer as string)
      // @ts-ignore
      const email = cust?.email as string | null
      if (email) {
        const { data: prof } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('email', email)
          .maybeSingle()
        if (prof?.id) resolvedUserId = prof.id
      }
    } catch { /* ignore */ }
  }

  await supabaseAdmin.from('subscriptions').upsert(
    {
      stripe_subscription_id: sub.id,
      stripe_customer_id: sub.customer as string,
      user_id: resolvedUserId ?? null,
      plan: sub.items.data[0]?.price?.id || null,
      status: sub.status,
      current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      cancel_at_period_end: sub.cancel_at_period_end ?? false,
    },
    { onConflict: 'stripe_subscription_id' }
  )
}

// ---------- main handler ----------
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(200).json({ ok: true })

  let event: Stripe.Event
  try {
    const sig = req.headers['stripe-signature'] as string
    const raw = await readRawBody(req)
    event = stripe.webhooks.constructEvent(raw, sig, STRIPE_WEBHOOK_SECRET)
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  // (Optional) log every event for debugging
  try { await supabaseAdmin.from('webhook_event_logs').insert({ source: 'stripe', payload: event as any }) } catch {}

  try {
    // 1) send email (idempotent)
    await handleStripeEmails(event)

    // 2) keep DB in sync
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const subId = (session.subscription as string) || null
        const userId = (session.client_reference_id as string) || null
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId)
          await upsertSubscriptionRow(sub, userId)
        }
        break
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await upsertSubscriptionRow(sub, null)
        break
      }
      default:
        break
    }

    return res.json({ received: true })
  } catch (e: any) {
    console.error('stripe webhook handler error:', e?.message)
    return res.json({ received: true, note: 'handler error swallowed' })
  }
}
