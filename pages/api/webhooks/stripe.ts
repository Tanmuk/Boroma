// /pages/api/webhooks/stripe.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { Resend } from 'resend'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export const config = { api: { bodyParser: false } }

// ========= ENV (must be set in Vercel) =========
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET as string
const RESEND_API_KEY = process.env.RESEND_API_KEY as string
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://boroma.site'
const PORTAL = process.env.NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL || 'https://billing.stripe.com/p/login/5kA7tX49H7PNbAs288'
const FROM = 'Boroma <hello@boroma.site>'

// ========= CLIENTS =========
const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })
const resend = new Resend(RESEND_API_KEY)

// ========= UTILS =========
async function readRawBody(req: NextApiRequest): Promise<Buffer> {
  const chunks: Uint8Array[] = []
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  return Buffer.concat(chunks)
}

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

async function sendEmail(to: string, subject: string, html: string, idempotencyKey: string) {
  if (!RESEND_API_KEY) return
  try {
    await resend.emails.send({ from: FROM, to, subject, html, headers: { 'Idempotency-Key': idempotencyKey } })
  } catch {
    // never crash the webhook on email errors
  }
}
const idemKey = (eventId: string, tag: string) => `${eventId}:${tag}`

// ========= TEMPLATED EMAIL SENDERS =========
async function sendPlanActivatedEmail(to: string, idKey: string) {
  const html = emailShell({
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
  })
  await sendEmail(to, 'Your Boroma plan is active', html, idKey)
}

async function sendCancelAtPeriodEndEmail(to: string, periodEndUnix: number | null, idKey: string) {
  const when = periodEndUnix ? new Date(periodEndUnix * 1000).toLocaleDateString() : 'the end of your current period'
  const html = emailShell({
    title: 'Your plan will end soon',
    intro: `We’ve received your cancellation. Your access will continue until ${when}.`,
    bullets: [
      'Members will keep access until the end date',
      'You can reactivate any time before the period ends'
    ],
    ctaText: 'Manage billing',
    ctaHref: PORTAL
  })
  await sendEmail(to, 'Your Boroma plan will end soon', html, idKey)
}

async function sendPlanCanceledEmail(to: string, idKey: string) {
  const html = emailShell({
    title: 'Your Boroma plan is cancelled',
    intro: 'We’re sorry to see you go. Your toll-free access has been turned off.',
    bullets: [
      'You can still use the one-time free trial line if you haven’t already',
      'Come back any time—your settings will be waiting'
    ],
    ctaText: 'Restart plan',
    ctaHref: `${SITE}#pricing`
  })
  await sendEmail(to, 'Your Boroma plan is cancelled', html, idKey)
}

async function sendPaymentFailedEmail(to: string, invoiceUrl: string | null, idKey: string) {
  const html = emailShell({
    title: 'Payment failed—please update your card',
    intro: 'We could not process your latest payment. Update your card to keep toll-free access active.',
    bullets: ['We’ll retry automatically over the next few days'],
    ctaText: 'Update payment method',
    ctaHref: invoiceUrl || PORTAL
  })
  await sendEmail(to, 'Payment failed — action needed', html, idKey)
}

// ========= EMAIL ROUTER FOR STRIPE EVENTS =========
async function handleStripeEmails(event: Stripe.Event) {
  // Find a usable customer email across different event types
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
    // Send “active” ONLY when the first subscription invoice is paid
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      if (invoice.billing_reason === 'subscription_create') {
        const to = await getEmail()
        if (to) await sendPlanActivatedEmail(to, idemKey(event.id, 'activated'))
      }
      break
    }

    // Scheduled cancel (flag toggled false -> true)
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

    // Immediate cancel
    case 'customer.subscription.deleted': {
      const to = await getEmail()
      if (to) await sendPlanCanceledEmail(to, idemKey(event.id, 'cancelled'))
      break
    }

    // Payment failed
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const to = await getEmail()
      const url = invoice.hosted_invoice_url || null
      if (to) await sendPaymentFailedEmail(to, url, idemKey(event.id, 'pay_failed'))
      break
    }

    default:
      // no email for other events
      break
  }
}

// ========= MAIN HANDLER =========
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const sig = req.headers['stripe-signature'] as string
    const buf = await readRawBody(req)
    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(buf, sig, STRIPE_WEBHOOK_SECRET!)
    } catch (err: any) {
      return res.status(400).send(`Webhook Error: ${err.message}`)
    }

    // 1) Send the correct email for this event (idempotent)
    await handleStripeEmails(event)

    // 2) Keep YOUR existing Supabase syncing exactly as you had it
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const user_id = session.client_reference_id as string | null
        const subId = (session.subscription as string) || null
        if (user_id && subId) {
          const sub = await stripe.subscriptions.retrieve(subId)
          await supabaseAdmin.from('subscriptions').upsert({
            stripe_subscription_id: sub.id,
            stripe_customer_id: sub.customer as string,
            user_id,
            plan: sub.items.data[0]?.price?.id || null,
            status: sub.status,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            cancel_at_period_end: sub.cancel_at_period_end ?? false
          }, { onConflict: 'stripe_subscription_id' })
        }
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await supabaseAdmin.from('subscriptions').upsert({
          stripe_subscription_id: sub.id,
          stripe_customer_id: sub.customer as string,
          // user_id unchanged (from initial insert)
          plan: sub.items.data[0]?.price?.id || null,
          status: sub.status,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          cancel_at_period_end: sub.cancel_at_period_end ?? false
        }, { onConflict: 'stripe_subscription_id' })
        break
      }

      // You can add more DB cases if you want; not required for emails.
      default:
        break
    }

    return res.json({ received: true })
  } catch (e: any) {
    return res.status(500).send(`Webhook handler error: ${e.message}`)
  }
}
