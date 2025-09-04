import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendEmail } from '@/lib/email'

export const config = { api: { bodyParser: false } }

async function buffer(readable: any){
  const chunks: any[] = []
  for await (const ch of readable) chunks.push(typeof ch==='string'?Buffer.from(ch):ch)
  return Buffer.concat(chunks)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse){
  if (req.method !== 'POST') return res.status(405).end()

  const secret = process.env.STRIPE_WEBHOOK_SECRET
  const key = process.env.STRIPE_SECRET_KEY
  if (!secret || !key) return res.status(200).json({ ok: true, note: 'Stripe not configured' })

  const stripe = new Stripe(key, { apiVersion: '2024-06-20' })
  const sig = req.headers['stripe-signature'] as string
  const buf = await buffer(req)

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(buf, sig, secret)
  } catch (e: any) {
    return res.status(400).send(`Webhook Error: ${e.message}`)
  }

  try {
    if (event.type.startsWith('customer.subscription.')) {
      const sub = event.data.object as Stripe.Subscription
      const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
      const userId = (sub.metadata?.user_id as string) || null

      await supabaseAdmin.from('subscriptions').upsert({
        user_id: userId,
        stripe_subscription_id: sub.id,
        stripe_customer_id: customerId,
        status: sub.status,
        current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        cancel_at_period_end: sub.cancel_at_period_end,
        plan: sub.items.data[0]?.price?.id || null
      }, { onConflict: 'stripe_subscription_id' })

      // Best-effort email (Stripe also sends its own receipts if enabled)
      try {
        const cust = await stripe.customers.retrieve(customerId)
        const email = (cust as any)?.email
        if (email) {
          if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
            await sendEmail(email, 'Your Boroma subscription is active', `
              <p>Thanks for subscribing to Boroma. Your plan is now active.</p>
              <p><a href="https://www.boroma.site/dashboard">Open your dashboard</a></p>
            `)
          }
          if (event.type === 'customer.subscription.deleted') {
            await sendEmail(email, 'Your Boroma subscription is cancelled', `
              <p>Your subscription was cancelled. You can restart any time.</p>
            `)
          }
        }
      } catch {}
    }

    if (event.type === 'checkout.session.completed') {
      // no-op; subscription events handle status
    }

    return res.json({ received: true })
  } catch (e) {
    console.error('stripe webhook error', e)
    return res.status(500).json({ error: 'handler error' })
  }
}
