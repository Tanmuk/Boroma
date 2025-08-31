import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
export const config = { api: { bodyParser: false } }
async function buffer(readable: any){ const chunks=[]; for await (const ch of readable) chunks.push(typeof ch==='string'?Buffer.from(ch):ch); return Buffer.concat(chunks) }
export default async function handler(req: NextApiRequest, res: NextApiResponse){
  if (req.method !== 'POST') return res.status(405).end()
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) { return res.status(200).json({ ok:true, note:"Stripe env not set" }) }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
  const buf = await buffer(req); const sig = req.headers['stripe-signature'] as string
  let event: Stripe.Event; try{ event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET) }catch(e:any){ return res.status(400).send(`Webhook Error: ${e.message}`) }
  try{
    switch(event.type){
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const customerId = typeof sub.customer === 'string' ? sub.customer : sub.customer.id
        await supabaseAdmin.from('subscriptions').upsert({
          stripe_subscription_id: sub.id,
          stripe_customer_id: customerId,
          status: sub.status,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          cancel_at_period_end: sub.cancel_at_period_end,
          plan: sub.items.data[0]?.price?.id || null
        }, { onConflict: 'stripe_subscription_id' })
      } break;
      default: break;
    }
    res.json({ received: true })
  }catch(e:any){ console.error(e); res.status(500).json({ error:'Stripe handler error' }) }
}
