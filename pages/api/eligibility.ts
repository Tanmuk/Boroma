import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const TEN = 10 * 60;
const THIRTYFIVE = 35 * 60;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end()
  const phone = ((req.query.phone as string)||'').replace(/\s|-/g,'')
  if (!phone) return res.status(400).json({ error: 'phone required' })
  try {
    const { data: member } = await supabaseAdmin.from('members').select('user_id').eq('phone', phone).maybeSingle()
    let paid = false
    if (member?.user_id) {
      const { data: sub } = await supabaseAdmin.from('subscriptions')
        .select('status,current_period_end,cancel_at_period_end').eq('user_id', member.user_id)
        .order('current_period_end', { ascending: false }).limit(1).maybeSingle()
      if (sub) {
        const now = new Date()
        const end = sub.current_period_end ? new Date(sub.current_period_end) : null
        const active = ['active','trialing','past_due']
        paid = active.includes(sub.status||'') && (!end || end > now)
      }
    }
    if (paid) return res.json({ status: 'paid', max_seconds: THIRTYFIVE })
    const { count } = await supabaseAdmin.from('calls').select('id', { count:'exact', head:true }).eq('phone', phone)
    if ((count||0) === 0) return res.json({ status: 'free_trial', max_seconds: TEN })
    return res.json({ status: 'signup_required', max_seconds: 0 })
  } catch (e) {
    console.error(e); return res.status(500).json({ error: 'eligibility check failed' })
  }
}
