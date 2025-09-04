import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

function originFrom(req: NextApiRequest) {
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https'
  const host = (req.headers['x-forwarded-host'] as string) || req.headers.host
  return `${proto}://${host}`
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const token = (req.headers.authorization || '').replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'missing token' })

  const { data: userRes } = await supabaseAdmin.auth.getUser(token)
  const userId = userRes?.user?.id
  if (!userId) return res.status(401).json({ error: 'invalid token' })

  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', userId)
    .maybeSingle()

  const customer = sub?.stripe_customer_id
  if (!customer) return res.status(400).json({ error: 'no customer on file' })

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: '2024-06-20' })
  const session = await stripe.billingPortal.sessions.create({
    customer,
    return_url: `${originFrom(req)}/dashboard`
  })
  return res.json({ url: session.url })
}
