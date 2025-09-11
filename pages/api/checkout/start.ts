// pages/api/checkout/start.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

type Plan = 'monthly' | 'annual'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const plan = ((req.query.plan as string) || 'monthly') as Plan
    const priceId =
      plan === 'annual' ? process.env.STRIPE_PRICE_ANNUAL : process.env.STRIPE_PRICE_MONTHLY
    if (!priceId) return res.status(500).json({ error: 'Missing Stripe price id' })

    // Verify Supabase user via bearer token (no cookie dependency)
    const auth = req.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
    if (!token) return res.status(401).json({ error: 'Not signed in' })

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data: userRes, error: userErr } = await admin.auth.getUser(token)
    if (userErr || !userRes?.user) return res.status(401).json({ error: 'Invalid token' })
    const user = userRes.user

    const origin =
      (req.headers.origin as string) ||
      (req.headers['x-forwarded-proto'] && req.headers.host
        ? `${req.headers['x-forwarded-proto']}://${req.headers.host}`
        : `https://${req.headers.host}`)

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      allow_promotion_codes: true,
      customer_email: user.email ?? undefined,
      success_url: `${origin}/dashboard?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/signup?plan=${plan}&checkout=cancel`,
      metadata: { user_id: user.id },
      automatic_tax: { enabled: true },
    })

    return res.status(200).json({ url: session.url })
  } catch (err: any) {
    console.error('checkout/start error', err)
    return res.status(500).json({ error: err?.message || 'Server error' })
  }
}
