// pages/api/voice/route.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

export const config = {
  api: { bodyParser: false }, // Twilio posts x-www-form-urlencoded; we'll read raw body
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!   // server-only
const VAPI_AGENT_NUMBER = '+13392091065'                     // Stella (Vapi)
const PAID_TIME_LIMIT_SECONDS = 2100                         // 35 min hard cap

function readRawBody(req: NextApiRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (chunk) => (data += chunk))
    req.on('end', () => resolve(data))
    req.on('error', reject)
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST')
      return res.status(405).send('POST required')
    }

    const raw = await readRawBody(req) // e.g. "From=%2B17722777570&To=%2B18777666307..."
    const params = new URLSearchParams(raw)
    const fromRaw = params.get('From') || ''
    const caller = fromRaw.replace(/^tel:/, '').replace(/\D/g, '') // digits only

    // If you’re missing SERVICE_KEY on Vercel, short-circuit with a friendly message
    if (!SUPABASE_URL || !SERVICE_KEY) {
      const msg = 'Thanks for calling Boroma. Please visit boroma dot site to buy a plan.'
      const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say>${msg}</Say></Response>`
      res.setHeader('Content-Type', 'text/xml')
      return res.status(200).send(xml)
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

    // Check if caller is an active member (adjust table/columns to yours)
    const { data: member, error } = await supabase
      .from('members')
      .select('id,status')
      .eq('phone', caller)
      .eq('status', 'active')
      .maybeSingle()

    if (error) {
      // On DB error, fail "open" to a friendly message (avoid 500s)
      const msg = 'Thanks for calling Boroma. Please try again in a moment or visit boroma dot site.'
      const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say>${msg}</Say></Response>`
      res.setHeader('Content-Type', 'text/xml')
      return res.status(200).send(xml)
    }

    if (!member) {
      // Not paid/approved: short message + tell free trial line
      const msg =
        'Thanks for calling Boroma. To use this toll free number, please buy a plan at boroma dot site. ' +
        'Your first call is free at three three nine two zero nine one zero six five.'
      const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say>${msg}</Say></Response>`
      res.setHeader('Content-Type', 'text/xml')
      return res.status(200).send(xml)
    }

    // Paid member: forward to Vapi with 35 min cap
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial answerOnBridge="true" timeout="60" timeLimit="${PAID_TIME_LIMIT_SECONDS}">
    <Number>${VAPI_AGENT_NUMBER}</Number>
  </Dial>
</Response>`
    res.setHeader('Content-Type', 'text/xml')
    return res.status(200).send(xml)
  } catch (e) {
    // Never send 500 HTML to Twilio; return a safe TwiML message instead
    const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say>Sorry, a system error occurred. Please try again later.</Say></Response>`
    res.setHeader('Content-Type', 'text/xml')
    return res.status(200).send(xml)
  }
}
