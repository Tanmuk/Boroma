// /pages/api/checkout/start.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });

const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    // 1) Get Supabase session from cookies (set by supabase-js on the client)
    const accessToken = req.cookies['sb-access-token'] || req.cookies['sb:token'] || '';
    if (!accessToken) return res.status(401).send('Not signed in');

    const { data: userRes, error: userErr } = await supabaseAnon.auth.getUser(accessToken);
    if (userErr || !userRes?.user) return res.status(401).send('Invalid session');

    const user = userRes.user;
    const { plan = 'monthly', phone = '', full_name = '' } = req.body ?? {};

    // 2) Create/get Stripe customer for this Supabase user
    //    Store stripe_customer_id on profiles if you have that column; lookup first.
    //    Here we always create-or-reuse based on email for simplicity.
    const customers = await stripe.customers.list({ email: user.email ?? undefined, limit: 1 });
    const customer =
      customers.data[0] ||
      (await stripe.customers.create({
        email: user.email || undefined,
        name: (full_name as string) || (user.user_metadata?.full_name as string) || undefined,
        metadata: { supabase_user_id: user.id }
      }));

    // 3) Select price ID by plan
    const priceId = plan === 'annual'
      ? process.env.STRIPE_PRICE_ANNUAL_ID!
      : process.env.STRIPE_PRICE_MONTHLY_ID!;

    // 4) Create checkout session
    const successUrl = `https://boroma.site/dashboard?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl  = `https://boroma.site/pricing`;

    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      success_url: successUrl,
      cancel_url: cancelUrl,
      // This is helpful later when your webhook attaches the seat/sub to the correct user
      client_reference_id: user.id,
      metadata: {
        supabase_user_id: user.id,
        phone: phone || (user.user_metadata?.phone as string) || ''
      }
    });

    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error('checkout/start error', err);
    return res.status(500).send(err?.message ?? 'Server error');
  }
}
