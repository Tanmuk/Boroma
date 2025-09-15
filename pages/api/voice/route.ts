// /pages/api/voice/route.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

// ---------- ENV ----------
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://boroma.site'
const SUPABASE_URL = process.env.SUPABASE_URL as string
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string

// phone numbers
const TOLLFREE = (process.env.TWILIO_TOLLFREE || process.env.NEXT_PUBLIC_TOLLFREE || '').trim()
const TRIAL_NUMBER = (process.env.TRIAL_NUMBER || '').trim() // optional, if you want to keep trial line here
const VAPI_AGENT_NUMBER = (process.env.VAPI_AGENT_NUMBER || '').trim()

// time limits (seconds). If you change these in Vercel, the next invocation reads the new values.
const MEMBER_MAX_SECONDS = parseInt(process.env.MEMBER_MAX_SECONDS || '', 10) || 35 * 60 // 35m
const MEMBER_SOFT_REMINDER_SECONDS = parseInt(process.env.MEMBER_SOFT_REMINDER_SECONDS || '', 10) || 25 * 60 // 25m (soft reminder handled by Vapi agent content)
const TRIAL_MAX_SECONDS = parseInt(process.env.TRIAL_MAX_SECONDS || '', 10) || 8 * 60 // 8m

// monthly cap for member calls (per subscription)
const MEMBER_MAX_CALLS_PER_MONTH = parseInt(process.env.MEMBER_MAX_CALLS_PER_MONTH || '', 10) || 10

// ---------- SUPABASE (admin) ----------
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
})

// ---------- HELPERS ----------
function xml(res: NextApiResponse, twiml: string) {
  res.setHeader('Content-Type', 'text/xml; charset=utf-8')
  res.status(200).send(twiml)
}

function last10(n?: string | null) {
  if (!n) return ''
  return (n.replace(/[^\d]/g, '')).slice(-10)
}

function nowIso() {
  return new Date().toISOString()
}

type SubRow = {
  id: number
  user_id: string | null
  status: string | null
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean | null
}

type MemberRow = {
  id: string
  user_id: string | null
  phone: string
  phone_digits: string | null
  subscription_id: number | null
}

async function findMemberAndActiveSub(fromDigits: string) {
  // 1) find member by exact last10_digits
  const { data: mList, error: mErr } = await supabase
    .from('members')
    .select('id,user_id,phone,phone_digits,subscription_id')
    .or(`phone.eq.+${fromDigits},phone_digits.eq.${fromDigits}`) // your data already stores with + in phone; also keep last10 match
    .limit(1)

  if (mErr) throw mErr
  const member = (mList?.[0] as MemberRow) || null
  if (!member) return { member: null, sub: null }

  // 2) subscription by member.subscription_id or member.user_id
  let sub: SubRow | null = null
  if (member.subscription_id) {
    const { data: s1, error: s1e } = await supabase
      .from('subscriptions')
      .select('id,user_id,status,current_period_start,current_period_end,cancel_at_period_end')
      .eq('id', member.subscription_id)
      .maybeSingle()
    if (s1e) throw s1e
    sub = (s1 as SubRow) || null
  } else if (member.user_id) {
    const { data: s2, error: s2e } = await supabase
      .from('subscriptions')
      .select('id,user_id,status,current_period_start,current_period_end,cancel_at_period_end')
      .eq('user_id', member.user_id)
      .order('current_period_start', { ascending: false })
      .limit(1)
    if (s2e) throw s2e
    sub = (s2?.[0] as SubRow) || null
  }

  return { member, sub }
}

function isSubActive(sub: SubRow | null) {
  if (!sub) return false
  if (!sub.status) return false
  const statusOk = ['active', 'trialing'].includes(sub.status)
  const periodEndOk = !sub.current_period_end || new Date(sub.current_period_end) > new Date()
  const notCancelled = !sub.cancel_at_period_end
  return statusOk && periodEndOk && notCancelled
}

async function countCallsThisPeriod(memberId: string, sub: SubRow | null) {
  if (!sub?.current_period_start || !sub.current_period_end) return 0
  const { data, error } = await supabase
    .from('tollfree_call_logs')
    .select('id', { count: 'exact', head: true })
    .eq('member_id', memberId)
    .gte('started_at', sub.current_period_start)
    .lte('started_at', sub.current_period_end)
    .eq('status', 'completed')
  if (error) throw error
  return data ? (data as any).length || 0 : 0
}

// ---------- MAIN ----------
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Accept both POST (Twilio) and GET (manual)
  const isPost = req.method === 'POST'

  // Twilio sends x-www-form-urlencoded. Next parses into req.body as an object. For GET we use query.
  const p: any = isPost ? req.body : req.query

  const From = p.From as string | undefined
  const To = p.To as string | undefined
  const CallSid = p.CallSid as string | undefined

  const fromDigits = last10(From)
  const toDigits = last10(To)
  const tollfreeDigits = last10(TOLLFREE)
  const isTollfreeCall = toDigits === tollfreeDigits

  // defend against misroutes
  if (!From || !To || !isTollfreeCall) {
    return xml(
      res,
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">This number is for Boroma members. Please visit boroma dot site to start a plan.</Say>
  <Hangup/>
</Response>`
    )
  }

  // --- membership lookup ---
  let member: MemberRow | null = null
  let sub: SubRow | null = null
  try {
    const r = await findMemberAndActiveSub(fromDigits)
    member = r.member
    sub = r.sub
  } catch (e: any) {
    // hard fail → be polite
    return xml(
      res,
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">We're having trouble verifying your plan. Please try again shortly.</Say>
  <Hangup/>
</Response>`
    )
  }

  // deny non-members
  if (!member || !isSubActive(sub)) {
    // log a rejected attempt (optional; we log only successful route below to keep the table clean)
    return xml(
      res,
      `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Your Boroma plan is not active. Please visit your dashboard to manage billing.</Say>
  <Hangup/>
</Response>`
    )
  }

  // enforce monthly cap
  try {
    const used = await countCallsThisPeriod(member.id, sub)
    if (used >= MEMBER_MAX_CALLS_PER_MONTH) {
      return xml(
        res,
        `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">You have reached your monthly call limit for this member. Please upgrade or wait for the next billing cycle.</Say>
  <Hangup/>
</Response>`
      )
    }
  } catch {
    // if we can't count, don't silently fail the customer — let the call through
  }

  // create a live call log row now so the status callback can close it later
  try {
    await supabase.from('tollfree_call_logs').insert({
      member_id: member.id,
      phone: From,
      started_at: nowIso(),
      status: 'in_progress',
      is_trial: false,
      notes: CallSid || null // we use notes to stash CallSid in your current schema
    })
  } catch {
    // don't block the call; logging can fail separately
  }

  // Build TwiML to bridge to Vapi agent. We enforce the Twilio timeLimit.
  // Soft reminder at 25 mins is done by your Vapi agent script (content), not Twilio.
  const statusCb = `${SITE.replace(/\/$/, '')}/api/voice/status`

  const dialXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial callerId="${TOLLFREE}"
        timeLimit="${MEMBER_MAX_SECONDS}"
        answerOnBridge="true"
        record="false"
        timeout="20"
        statusCallback="${statusCb}"
        statusCallbackEvent="initiated ringing answered completed"
        statusCallbackMethod="POST">
    <Number>${VAPI_AGENT_NUMBER}</Number>
  </Dial>
</Response>`

  return xml(res, dialXml)
}
