// /lib/mailer.ts
import { Resend } from 'resend'
export { sendCallSummaryEmail } from './email'


const resend = new Resend(process.env.RESEND_API_KEY as string)
const FROM = 'Boroma <hello@boroma.site>'
const PORTAL = process.env.NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL || 'https://billing.stripe.com/p/login/5kA7tX49H7PNbAs288'
const SITE = 'https://boroma.site'

function shell(opts: { title: string; intro: string; bullets?: string[]; ctaText?: string; ctaHref?: string; footnote?: string }) {
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
       </div>` : ''
  const note = footnote ? `<p style="margin:18px 0 0 0;color:#64748b;font-size:12px;line-height:18px;">${footnote}</p>` : ''
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

async function send(to: string, subject: string, html: string, idempotencyKey?: string) {
  return resend.emails.send({
    from: FROM,
    to,
    subject,
    html,
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
  })
}

// PUBLIC SENDERS

export async function sendPlanActivatedEmail(to: string, idKey: string) {
  const html = shell({
    title: 'Your Boroma plan is active',
    intro: 'Welcome aboard. Your toll-free support is now ready for approved family members.',
    bullets: [
      'Toll-free support number: 877-766-6307 (share only with approved members)',
      'Add or remove members any time from your dashboard',
      'You will receive a call summary after each support call',
    ],
    ctaText: 'Manage billing & members',
    ctaHref: PORTAL,
    footnote: `Dashboard: ${SITE}/dashboard`,
  })
  return send(to, 'Your Boroma plan is active', html, idKey)
}

export async function sendCancelAtPeriodEndEmail(to: string, periodEndISO: number | null, idKey: string) {
  const when = periodEndISO ? new Date(periodEndISO * 1000).toLocaleDateString() : 'the end of your current period'
  const html = shell({
    title: 'Your plan will end soon',
    intro: `We’ve received your cancellation. Your access will continue until ${when}.`,
    bullets: [
      'Members will keep access until the end date',
      'You can reactivate any time before the period ends',
    ],
    ctaText: 'Manage billing',
    ctaHref: PORTAL,
  })
  return send(to, 'Your Boroma plan will end soon', html, idKey)
}

export async function sendPlanCanceledEmail(to: string, idKey: string) {
  const html = shell({
    title: 'Your Boroma plan is cancelled',
    intro: 'We’re sorry to see you go. Your toll-free access has been turned off.',
    bullets: [
      'You can still use the one-time free trial line if you haven’t already',
      'Come back any time—your settings will be waiting',
    ],
    ctaText: 'Restart plan',
    ctaHref: `${SITE}#pricing`,
  })
  return send(to, 'Your Boroma plan is cancelled', html, idKey)
}

export async function sendPaymentFailedEmail(to: string, invoiceUrl: string | null, idKey: string) {
  const html = shell({
    title: 'Payment failed—please update your card',
    intro: 'We could not process your latest payment. Update your card to keep toll-free access active.',
    bullets: ['We’ll retry automatically over the next few days'],
    ctaText: 'Update payment method',
    ctaHref: invoiceUrl || PORTAL,
  })
  return send(to, 'Payment failed — action needed', html, idKey)
}

export function idemKey(eventId: string, tag: string) {
  return `${eventId}:${tag}`
}
