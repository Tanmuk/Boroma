import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  const TOLL_FREE    = (process.env.NEXT_PUBLIC_PRIMARY_PHONE || '').replace(/\s/g, '')
  const VAPI         = (process.env.VAPI_AGENT_NUMBER || '').replace(/\s/g, '')

  const fromRaw = (req.query.from as string) || ''
  const toRaw   = (req.query.to as string)   || ''
  const toE164 = (n?: string) => {
    if (!n) return ''
    const s = String(n).replace(/^tel:/,'').replace(/\D/g,'')
    if (!s) return ''
    if (s.length === 10) return `+1${s}`
    if (s.length === 11 && s.startsWith('1')) return `+${s}`
    return `+${s}`
  }

  const caller = toE164(fromRaw)
  const called = toE164(toRaw)
  const digits = caller.replace(/\D/g,'')

  const envOk = !!SUPABASE_URL && !!SERVICE_KEY
  let dbTry1: any = null, dbTry2: any = null, queryError: any = null
  let matched = false, memberStatus = '', rows = []

  try {
    if (envOk) {
      const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })
      // try E.164 in()
      const { data, error } = await sb
        .from('members')
        .select('id,status,phone,phone_digits')
        .in('phone', [caller, `+${digits}`])
      dbTry1 = { error, count: data?.length || 0 }
      if (data?.length) { matched = true; rows = data; memberStatus = (data[0].status||'') }

      // try digits fallback
      if (!matched) {
        const { data: d2, error: e2 } = await sb
          .from('members')
          .select('id,status,phone,phone_digits')
          .eq('phone_digits', digits)
        dbTry2 = { error: e2, count: d2?.length || 0 }
        if (d2?.length) { matched = true; rows = d2; memberStatus = (d2[0].status||'') }
      }
    }
  } catch (e:any) {
    queryError = String(e?.message || e)
  }

  res.status(200).json({
    env: {
      hasUrl: !!SUPABASE_URL,
      hasServiceRole: !!SERVICE_KEY,
      tollFree: TOLL_FREE,
      vapi: VAPI,
    },
    params: { fromRaw, toRaw, caller, called, digits },
    flags: {
      isTollFreeCall: !!TOLL_FREE && called === TOLL_FREE,
    },
    db: { dbTry1, dbTry2, queryError, matched, memberStatus, rows },
  })
}
