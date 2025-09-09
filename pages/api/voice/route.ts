// pages/api/voice/route.ts  (Toll-free: members-only)
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

/** === TEST LIMITS (change later) ===
 * Monthly cap (paid): 2  -> change to 10 for prod
 * Per-call cap (paid): 90s -> change to 2100 (35m) for prod
 */
const MONTHLY_CALL_CAP_TEST   = 2
const PER_CALL_LIMIT_SEC_TEST = 90

const SUPABASE_URL   = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY    = process.env.SUPABASE_SERVICE_ROLE_KEY!
const BASE_URL       = process.env.NEXT_PUBLIC_SITE_URL || 'https://boroma.site'
const VAPI_AGENT_NUMBER = '+13392091065' // destination when member is allowed

export const config = { api: { bodyParser: false } }

const xml = (inner: string) => `<?xml version="1.0" encoding="UTF-8"?><Response>${inner}</Response>`
function readRawBody(req: NextApiRequest) {
  return new Promise<string>((resolve, reject) => {
    let data = ''; req.on('data', c => data += c); req.on('end', () => resolve(data)); req.on('error', reject)
  })
}
const firstOfThisMonthISO = () => {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0)).toISOString()
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // accept GET and POST so Twilio never 405s
    const params = req.method === 'POST'
      ? new URLSearchParams(await readRawBody(req))
      : new URLSearchParams((req.url?.split('?')[1]) || '')

    const fromRaw = params.get('From') || ''
    const phoneDigits = fromRaw.replace(/^tel:/, '').replace(/\D/g, '')
    const phoneE164   = phoneDigits ? `+${phoneDigits}` : ''

    if (!SUPABASE_URL || !SERVICE_KEY) {
      res.setHeader('Content-Type','text/xml')
      return res.status(200).send(xml(`<Say>Thanks for calling Boroma. Please visit boroma dot site to buy a plan.</Say>`))
    }

    const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

    // 1) member lookup
    const { data: member } = await sb.from('members')
      .select('id,status,phone')
      .or(`phone.eq.${phoneDigits},phone.eq.${phoneE164}`)
      .eq('status','active')
      .maybeSingle()

    if (!member) {
      // Non-member: DO NOT forward. Just inform.
      const msg = 'This toll free number is for Boroma members only. Please buy a plan at boroma dot site. Your first call is free at three three nine two zero nine one zero six five.'
      res.setHeader('Content-Type','text/xml')
      return res.status(200).send(xml(`<Say>${msg}</Say>`))
    }

    // 2) enforce monthly cap
    const { count } = await sb.from('tollfree_call_logs')
      .select('id', { head: true, count: 'exact' })
      .eq('member_id', member.id)
      .eq('status','completed')
      .gte('started_at', firstOfThisMonthISO())

    if ((count || 0) >= MONTHLY_CALL_CAP_TEST) {
      res.setHeader('Content-Type','text/xml')
      return res.status(200).send(xml(`<Say>You have reached your monthly call limit. Please try again next month or contact hello at boroma dot site.</Say>`))
    }

    // 3) log + connect
    await sb.from('tollfree_call_logs').insert({
      member_id: member.id, phone: phoneE164 || `+${phoneDigits}`,
      status: 'in_progress', started_at: new Date().toISOString(), is_trial: false
    })

    const afterUrl = `${BASE_URL}/api/voice/after`
    const body = xml(`
      <Dial answerOnBridge="true" timeout="60" timeLimit="${PER_CALL_LIMIT_SEC_TEST}" action="${afterUrl}" method="POST">
        <Number>${VAPI_AGENT_NUMBER}</Number>
      </Dial>
    `)
    res.setHeader('Content-Type','text/xml')
    return res.status(200).send(body)
  } catch {
    res.setHeader('Content-Type','text/xml')
    return res.status(200).send(xml(`<Say>Sorry, a system error occurred. Please try again later.</Say>`))
  }
}
