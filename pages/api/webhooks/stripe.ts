import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

async function readRawBody(req: NextApiRequest): Promise<Buffer> {
  const chunks: Uint8Array[] = [];
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  return Buffer.concat(chunks);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  let event: Stripe.Event;
  try {
    const sig = req.headers['stripe-signature'] as string;
    const buf = await readRawBody(req);
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        // We set client_reference_id = user_id when creating checkout
        const user_id = session.client_reference_id as string | null;
        const subId = (session.subscription as string) || null;
        if (user_id && subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          await supabaseAdmin.from('subscriptions').upsert({
            stripe_subscription_id: sub.id,
            stripe_customer_id: sub.customer as string,
            user_id,
            plan: sub.items.data[0]?.price?.id || null,
            status: sub.status,
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            cancel_at_period_end: sub.cancel_at_period_end ?? false
          }, { onConflict: 'stripe_subscription_id' });
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await supabaseAdmin.from('subscriptions').upsert({
          stripe_subscription_id: sub.id,
          stripe_customer_id: sub.customer as string,
          // user_id unchanged (kept from initial insert); if you prefer, join by customer->profile table
          plan: sub.items.data[0]?.price?.id || null,
          status: sub.status,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          cancel_at_period_end: sub.cancel_at_period_end ?? false
        }, { onConflict: 'stripe_subscription_id' });
        break;
      }
    }

    res.json({ received: true });
  } catch (e: any) {
    res.status(500).send(`Webhook handler error: ${e.message}`);
  }
}
