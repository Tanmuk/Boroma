// pages/api/voice/after.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

export const config = { api: { bodyParser: false } }

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!

function readRawBody(req: NextApiRequest) {
  return new Promise<string>((resolve, reject) => {
    let data=''; req.on('data',c=>data+=c); req.on('end',()=>resolve(data)); req.on('error',reject)
  })
}
const xml = (inner: string) => `<?xml version="1.0" encoding="UTF-8"?><Response>${inner}</Response>`

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const params = req.method === 'POST'
      ? new URLSearchParams(await readRawBody(req))
      : new URLSearchParams((req.url?.split('?')[1]) || '')

    const fromRaw = params.get('From') || ''
    const digits  = fromRaw.replace(/^tel:/,'').replace(/\D/g,'')
    const e164    = digits ? `+${digits}` : ''
    const duration = Number(params.get('DialCallDuration') || params.get('CallDuration') || '0')

    if (SUPABASE_URL && SERVICE_KEY && e164) {
      const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })
      const { data: row } = await sb.from('tollfree_call_logs')
        .select('id')
        .eq('phone', e164)
        .eq('status','in_progress')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (row?.id) {
        await sb.from('tollfree_call_logs').update({
          ended_at: new Date().toISOString(),
          duration_sec: duration,
          status: 'completed'
        }).eq('id', row.id)
      }
    }
    res.setHeader('Content-Type','text/xml')
    return res.status(200).send(xml(''))
  } catch {
    res.setHeader('Content-Type','text/xml')
    return res.status(200).send(xml(''))
  }
}
