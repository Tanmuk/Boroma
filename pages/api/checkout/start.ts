import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2024-06-20' })

function originFrom(req: NextApiRequest) {
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https'
  const host = (req.headers['x-forwarded-host'] as string) || req.headers.host
  return `${proto}://${host}`
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  try {
    const { plan = 'monthly', email, userId } = req.body as { plan: 'monthly'|'annual', email: string, userId: string }
    if (!email || !userId) return res.status(400).json({ error: 'email and userId required' })

    const priceId = plan === 'annual'
      ? process.env.STRIPE_PRICE_ANNUAL
      : process.env.STRIPE_PRICE_MONTHLY
    if (!priceId) return res.status(500).json({ error: 'Missing Stripe price env var' })

    const origin = originFrom(req)

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      client_reference_id: userId,                 // helps us map to Supabase user
      customer_email: email,                       // prefill
      allow_promotion_codes: true,                 // LAUNCH40 works here
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        metadata: { user_id: userId }             // also copy into the subscription
      },
      metadata: { user_id: userId },
      success_url: `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#pricing`
    })

    return res.status(200).json({ url: session.url })
  } catch (e: any) {
    console.error(e)
    return res.status(500).json({ error: 'checkout session error' })
  }
}
