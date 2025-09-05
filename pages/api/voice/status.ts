// /pages/api/voice/status.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import twilio from 'twilio'

const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null

function norm(n?: string) {
  if (!n) return null
  const d = n.replace(/[^\d+]/g, '')
  if (d.startsWith('+')) return d
  if (d.length === 10) return `+1${d}`
  return `+${d}`
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Twilio posts x-www-form-urlencoded
  const body = req.body || {}
  const event = (body.CallStatus || body.DialCallStatus || '').toLowerCase() // initiated|ringing|in-progress|answered|completed
  const callSid = body.CallSid || body.DialCallSid || ''
  const from = norm(body.From)
  const to = norm(body.To)

  const user_id = (req.query.user as string) || null
  const member_id = (req.query.member as string) || null
  const source = (req.query.source as string) || 'tollfree'
  const is_member_call = (req.query.memberCall as string) === '1'

  try {
    if (event.includes('answered')) {
      // Schedule a soft reminder SMS at T+1500s (25 min) to the caller
      if (twilioClient && from) {
        const sendAt = new Date(Date.now() + 1500 * 1000).toISOString()
        await twilioClient.messages.create({
          // If you have a Messaging Service SID, set messagingServiceSid here instead of 'from'
          from: process.env.TWILIO_TOLLFREE,   // sender
          to: from,                            // caller
          body: 'Heads up, this Boroma call has 10 minutes remaining.',
          scheduleType: 'fixed',
          sendAt, // Twilio will schedule if your account has scheduling enabled; otherwise it sends now
        } as any)
      }
      return res.status(200).json({ ok: true })
    }

    if (event.includes('completed')) {
      // Duration is in seconds: prefer DialCallDuration then CallDuration
      const sec = Number(body.DialCallDuration || body.CallDuration || 0)
      await supabaseAdmin.from('calls').insert({
        user_id,
        member_id,
        from_number: from,
        to_number: to,
        seconds: isFinite(sec) ? sec : 0,
        source,
        is_member_call,
      })
      return res.status(200).json({ ok: true })
    }

    return res.status(200).json({ ok: true })
  } catch (e) {
    console.error('voice status error', e)
    return res.status(200).json({ ok: true })
  }
}
