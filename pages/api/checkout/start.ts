import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'

const stripeKey = process.env.STRIPE_SECRET_KEY as string
const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' })

function originFrom(req: NextApiRequest) {
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https'
  const host = (req.headers['x-forwarded-host'] as string) || req.headers.host
  return `${proto}://${host}`
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    if (!stripeKey) return res.status(500).json({ error: 'STRIPE_SECRET_KEY missing' })

    const { plan = 'monthly', email, userId } = req.body as {
      plan: 'monthly'|'annual', email: string, userId: string
    }
    if (!email || !userId) return res.status(400).json({ error: 'email and userId required' })

    const priceId =
      plan === 'annual' ? process.env.STRIPE_PRICE_ANNUAL : process.env.STRIPE_PRICE_MONTHLY
    if (!priceId) return res.status(500).json({ error: 'Stripe price env var missing' })

    const origin = originFrom(req)

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      client_reference_id: userId,
      customer_email: email,
      allow_promotion_codes: true,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: { metadata: { user_id: userId } },
      metadata: { user_id: userId },
      success_url: `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#pricing`,
    })

    return res.status(200).json({ url: session.url })
  } catch (e: any) {
    console.error('checkout/start error:', e?.message || e)
    return res.status(500).json({ error: 'checkout session error' })
  }
}
