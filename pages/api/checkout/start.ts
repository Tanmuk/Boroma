// /pages/api/checkout/start.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY as string
const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' })

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.boroma.site'
const PRICE_MONTHLY = process.env.NEXT_PUBLIC_STRIPE_PRICE_MONTHLY!
const PRICE_ANNUAL = process.env.NEXT_PUBLIC_STRIPE_PRICE_ANNUAL!

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const supabase = createServerSupabaseClient({ req, res })
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return res.status(401).json({ error: 'Not signed in' })

  try {
    const { plan } = (req.query || {}) as { plan?: 'monthly' | 'annual' }
    const price = plan === 'annual' ? PRICE_ANNUAL : PRICE_MONTHLY

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      billing_address_collection: 'auto',
      payment_method_types: ['card'],
      line_items: [{ price, quantity: 1 }],
      // This ties the Stripe subscription back to your user_id
      client_reference_id: user.id,
      customer_email: user.email ?? undefined,
      success_url: `${SITE}/dashboard?welcome=1`,
      cancel_url: `${SITE}/signup?cancelled=1`,
      allow_promotion_codes: true,
    })

    return res.status(200).json({ url: session.url })
  } catch (e: any) {
    console.error('checkout start error:', e?.message)
    return res.status(500).json({ error: 'Failed to start checkout' })
  }
}
