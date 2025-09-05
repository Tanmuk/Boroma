// /pages/api/voice/route.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

function norm(n?: string) {
  if (!n) return null
  const d = n.replace(/[^\d+]/g, '')
  if (d.startsWith('+')) return d
  if (d.length === 10) return `+1${d}`
  return `+${d}`
}

function twiml(xml: string) {
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${xml}</Response>`
}

function monthStartISO() {
  const d = new Date()
  d.setDate(1); d.setHours(0,0,0,0)
  return d.toISOString()
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  res.setHeader('Content-Type', 'text/xml')

  const from = norm((req.body?.From as string) || (req.query?.From as string))
  const tollfree = process.env.TWILIO_TOLLFREE as string
  const agent = process.env.VAPI_AGENT_NUMBER as string
  const site = process.env.BOROMA_SITE || 'https://boroma.site'
  if (!from || !agent) return res.status(200).send(twiml(`<Say>Sorry, we cannot take your call right now</Say>`))

  // find member by caller id
  const { data: member } = await supabaseAdmin
    .from('members')
    .select('id,user_id,phone')
    .eq('phone', from)
    .maybeSingle()

  // Non-member path → short message then forward to FREE line with 7-min cap
  if (!member) {
    const msg = `This toll free line is for paid members. To join, visit ${site.replace('https://','').replace('http://','')}.`
    const xml = `
      <Say voice="alice">${msg}</Say>
      <Dial callerId="${tollfree}" timeLimit="420">${agent}</Dial>
    `
    return res.status(200).send(twiml(xml))
  }

  // Check subscription status
  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('status')
    .eq('user_id', member.user_id)
    .order('current_period_end', { ascending: false })
    .limit(1)
    .maybeSingle()
  const active = sub?.status === 'active' || sub?.status === 'trialing'
  if (!active) {
    const msg = `Your plan is inactive. Please visit ${site.replace('https://','').replace('http://','')} to reactivate.`
    const xml = `<Say voice="alice">${msg}</Say>`
    return res.status(200).send(twiml(xml))
  }

  // Monthly cap: 10 completed member calls this month
  const { data: usedRows } = await supabaseAdmin
    .from('calls')
    .select('id')
    .eq('user_id', member.user_id)
    .eq('is_member_call', true)
    .eq('source', 'tollfree')
    .gte('created_at', monthStartISO())
  const used = usedRows?.length || 0
  if (used >= 10) {
    const msg = `You have used your ten calls for this month. The counter resets next month.`
    return res.status(200).send(twiml(`<Say voice="alice">${msg}</Say>`))
  }

  // Allowed: short disclosure, 35-min cap, status callbacks for logging.
  // We also attach metadata in the callback URL so we can log who this belongs to.
  const cb = `/api/voice/status?user=${member.user_id}&member=${member.id}&source=tollfree&memberCall=1`
  const xml = `
    <Say voice="alice">Connecting you to Boroma. This call may be recorded for quality and safety. At twenty five minutes we will remind you there are ten minutes left.</Say>
    <Dial callerId="${tollfree}" answerOnBridge="true" timeLimit="2100" method="POST"
          statusCallback="${cb}"
          statusCallbackEvent="initiated ringing answered completed">
      ${agent}
    </Dial>
  `
  return res.status(200).send(twiml(xml))
}
