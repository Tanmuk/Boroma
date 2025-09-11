// pages/api/checkout/start.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const supabase = createPagesServerClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return res.status(401).json({ error: 'Not signed in' });

  const user = session.user;
  const plan = (req.query.plan as string) || 'monthly';

  // Map your Stripe price IDs
  const priceId =
    plan === 'monthly'
      ? process.env.STRIPE_PRICE_MONTHLY_ID!
      : process.env.STRIPE_PRICE_ANNUAL_ID!;

  // Ensure there is a Stripe customer for this user (by email)
  let customerId: string | undefined;

  // Look up existing subscription row to reuse customer id if present
  const { data: subRow } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (subRow?.stripe_customer_id) {
    customerId = subRow.stripe_customer_id;
  } else {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;
  }

  // Create Checkout
  const sessionStripe = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?joined=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/signup?canceled=1`,
    metadata: {
      user_id: user.id,
      plan,
    },
  });

  // Pre-create / upsert a row so the dashboard can show “trialing” quickly (optional)
  await supabase.from('subscriptions').upsert(
    {
      user_id: user.id,
      plan: priceId,
      status: 'trialing', // will be corrected by webhook
      stripe_customer_id: customerId!,
    },
    { onConflict: 'user_id' },
  );

  return res.status(200).json({ url: sessionStripe.url });
}
