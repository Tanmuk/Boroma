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
  const site = (process.env.BOROMA_SITE || 'https://boroma.site').replace(/^https?:\/\//, '')
  if (!from || !agent || !tollfree) {
    return res.status(200).send(twiml(`<Say>Sorry, we cannot take your call right now</Say>`))
  }

  // 1) Is caller a member?
  const { data: member } = await supabaseAdmin
    .from('members')
    .select('id,user_id,phone')
    .eq('phone', from)
    .maybeSingle()

  // Non-member → short message then forward to FREE Vapi line (TEST: 20s)
  if (!member) {
    const msg = `This toll free line is for paid members. To join, visit ${site}.`
    const xml = `
      <Say voice="alice">${msg}</Say>
      <Dial callerId="${tollfree}" timeLimit="20">${agent}</Dial>
    `
    return res.status(200).send(twiml(xml))
  }

  // 2) Check subscription active
  const { data: sub } = await supabaseAdmin
    .from('subscriptions')
    .select('status')
    .eq('user_id', member.user_id)
    .order('current_period_end', { ascending: false })
    .limit(1)
    .maybeSingle()
  const active = sub?.status === 'active' || sub?.status === 'trialing'
  if (!active) {
    const msg = `Your plan is inactive. Please visit ${site} to reactivate.`
    return res.status(200).send(twiml(`<Say voice="alice">${msg}</Say>`))
  }

  // 3) Enforce 10 calls per month (same as before)
  const { data: usedRows } = await supabaseAdmin
    .from('calls')
    .select('id')
    .eq('user_id', member.user_id)
    .eq('is_member_call', true)
    .eq('source', 'tollfree')
    .gte('created_at', monthStartISO())
  const used = usedRows?.length || 0
  if (used >= 10) {
    const msg = `You have used your ten calls for this month, the counter resets next month.`
    return res.status(200).send(twiml(`<Say voice="alice">${msg}</Say>`))
  }

  // 4) TEST LIMITS: 30s leg, spoken reminder, then 20s leg
  const cbBase = `/api/voice/status?user=${member.user_id}&member=${member.id}&source=tollfree&memberCall=1`
  const xml = `
    <Say voice="alice">Connecting you to Boroma, this call may be recorded for quality and safety.</Say>

    <!-- First short leg: 30 seconds -->
    <Dial callerId="${tollfree}" answerOnBridge="true" timeLimit="30" method="POST"
          statusCallback="${cbBase}&leg=1"
          statusCallbackEvent="initiated ringing answered completed">
      ${agent}
    </Dial>

    <!-- Soft reminder -->
    <Say voice="alice">You have ten minutes remaining on this call.</Say>

    <!-- Final short leg: 20 seconds -->
    <Dial callerId="${tollfree}" answerOnBridge="true" timeLimit="20" method="POST"
          statusCallback="${cbBase}&leg=2"
          statusCallbackEvent="initiated ringing answered completed">
      ${agent}
    </Dial>
  `
  return res.status(200).send(twiml(xml))
}
