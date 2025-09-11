// /pages/api/checkout/start.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// ---------- ENV ----------
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://boroma.site'
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string
const PRICE_MONTHLY = process.env.STRIPE_PRICE_MONTHLY as string   // e.g. price_123
const PRICE_ANNUAL  = process.env.STRIPE_PRICE_ANNUAL as string    // e.g. price_456

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') return res.setHeader('Allow','POST').status(405).end('Method Not Allowed')

    // The client sends Authorization: Bearer <supabase access_token>
    const auth = req.headers.authorization || ''
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
    if (!token) return res.status(401).json({ error: 'Not signed in' })

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    if (error || !user) return res.status(401).json({ error: 'Not signed in' })

    const { plan } = req.body as { plan: 'monthly' | 'annual' }
    const price = plan === 'annual' ? PRICE_ANNUAL : PRICE_MONTHLY
    if (!price) return res.status(400).json({ error: 'Price not configured' })

    // Create a Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price, quantity: 1 }],
      // we use client_reference_id to stitch the subscription back to the user in the webhook
      client_reference_id: user.id,
      customer_email: user.email || undefined,
      allow_promotion_codes: true,
      success_url: `${SITE}/dashboard?checkout=success`,
      cancel_url: `${SITE}/signup?canceled=1`,
      metadata: { plan }
    })

    return res.status(200).json({ url: session.url })
  } catch (e:any) {
    return res.status(500).json({ error: e.message || 'server_error' })
  }
}
