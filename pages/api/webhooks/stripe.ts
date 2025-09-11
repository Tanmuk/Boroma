// /pages/api/webhooks/stripe.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// IMPORTANT: Stripe needs raw body
export const config = { api: { bodyParser: false } }

// ===== ENV =====
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET as string

if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
  throw new Error('Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET env')
}

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })

async function readRawBody(req: NextApiRequest): Promise<Buffer> {
  const chunks: Uint8Array[] = []
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  }
  return Buffer.concat(chunks)
}

// Upsert into your subscriptions table
async function upsertSubscriptionRow(sub: Stripe.Subscription, userId?: string | null) {
  // Try to infer user_id if not passed:
  // 1) via client_reference_id captured at checkout (preferred)
  // 2) via customer -> email -> profiles lookup (fallback)
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
    } catch {
      // ignore fallback failure
    }
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

// Main handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    // Stripe will never call GET, but returning 200 helps health checks
    return res.status(200).json({ ok: true })
  }

  let event: Stripe.Event
  try {
    const sig = req.headers['stripe-signature'] as string
    const raw = await readRawBody(req)
    event = stripe.webhooks.constructEvent(raw, sig, STRIPE_WEBHOOK_SECRET)
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  // (Optional) store every event for debugging
  try {
    await supabaseAdmin.from('webhook_event_logs').insert({
      source: 'stripe',
      payload: event as any,
    })
  } catch {
    // don't block webhook if logging fails
  }

  try {
    switch (event.type) {
      // Primary path (when Checkout completes)
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

      // Safety net: if for any reason checkout.* didn’t arrive, we still update on sub changes
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await upsertSubscriptionRow(sub, null)
        break
      }

      default:
        // ignore other events for DB purposes
        break
    }

    return res.json({ received: true })
  } catch (err: any) {
    // Make the failure visible in logs but return 200 so Stripe doesn’t keep retrying forever
    console.error('stripe webhook handler error:', err?.message)
    return res.json({ received: true, note: 'handler error swallowed' })
  }
}
