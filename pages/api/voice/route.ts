// pages/api/voice/route.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

export const config = { api: { bodyParser: false } }

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const VAPI_AGENT_NUMBER = '+13392091065'
const PAID_TIME_LIMIT_SECONDS = 2100  // 35 min

function readRawBody(req: NextApiRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = ''; req.on('data', c => data += c)
    req.on('end', () => resolve(data)); req.on('error', reject)
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Parse Twilio params for both POST (body) and GET (query)
    let params: URLSearchParams
    if (req.method === 'POST') {
      const raw = await readRawBody(req)
      params = new URLSearchParams(raw)
    } else {
      const q = req.url?.split('?')[1] || ''
      params = new URLSearchParams(q)
    }

    const fromRaw = params.get('From') || ''
    const caller = fromRaw.replace(/^tel:/, '').replace(/\D/g, '')

    // If envs missing, fail open with a friendly message (avoid 500s)
    if (!SUPABASE_URL || !SERVICE_KEY) {
      const xml = `<?xml version="1.0" encoding="UTF-8"?><Response>
        <Say>Thanks for calling Boroma. Please visit boroma dot site to buy a plan.</Say>
      </Response>`
      res.setHeader('Content-Type','text/xml'); return res.status(200).send(xml)
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })
    const { data: member, error } = await supabase
      .from('members')
      .select('id,status').eq('phone', caller).eq('status', 'active').maybeSingle()

    if (error || !member) {
      const msg = 'Thanks for calling Boroma. To use this toll free number, please buy a plan at boroma dot site. Your first call is free at three three nine two zero nine one zero six five.'
      const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Say>${msg}</Say></Response>`
      res.setHeader('Content-Type','text/xml'); return res.status(200).send(xml)
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <Response><Dial answerOnBridge="true" timeout="60" timeLimit="${PAID_TIME_LIMIT_SECONDS}">
        <Number>${VAPI_AGENT_NUMBER}</Number>
      </Dial></Response>`
    res.setHeader('Content-Type','text/xml'); return res.status(200).send(xml)
  } catch {
    const xml = `<?xml version="1.0" encoding="UTF-8"?><Response>
      <Say>Sorry, a system error occurred. Please try again later.</Say>
    </Response>`
    res.setHeader('Content-Type','text/xml'); return res.status(200).send(xml)
  }
}
