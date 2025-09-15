// pages/api/voice/trial.ts
import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import twilio from 'twilio'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://boroma.site'
const VAPI_AGENT_NUMBER = process.env.VAPI_AGENT_NUMBER || ''
const TRIAL_NUMBER = process.env.TRIAL_NUMBER || '+17722777570' // the DID you show publicly for trials
const TRIAL_MAX_SECONDS = parseInt(process.env.TRIAL_MAX_SECONDS || '480', 10) // 8 minutes default

// Tiny helpers
const last10 = (n: string) => (n || '').replace(/\D/g, '').slice(-10)
const say = (vr: twilio.twiml.VoiceResponse, text: string) => vr.say({ voice: 'alice' }, text)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).send('Method Not Allowed')
  }

  try {
    // Twilio posts x-www-form-urlencoded
    const { From = '', To = '', CallSid = '' } = req.body as Record<string, string>
    const fromDigits = last10(From)
    const toDigits = last10(To)

    // Guard rails
    if (!VAPI_AGENT_NUMBER) {
      return res.status(500).json({ error: 'VAPI_AGENT_NUMBER is not set' })
    }

    // 1) Enforce one free trial per phone (trial_calls)
    const { data: existing } = await supabaseAdmin
      .from('trial_calls')
      .select('id, call_count, first_call_at')
      .eq('phone_digits', fromDigits)
      .maybeSingle()

    let allowed = true
    if (existing) {
      // already used trial once
      allowed = existing.call_count < 1
    }

    // 2) If allowed, pre-log this trial start (so status webhook can update by CallSid)
    if (allowed) {
      await supabaseAdmin.from('trial_calls').upsert(
        existing
          ? { id: existing.id, call_count: 1, phone_digits: fromDigits }
          : { phone_digits: fromDigits, first_call_at: new Date().toISOString(), call_count: 1 },
        { onConflict: 'id' }
      )

      // 3) Build TwiML to bridge to your assistant with time limit + status callback
      const vr = new twilio.twiml.VoiceResponse()

      const dial = vr.dial({
        callerId: TRIAL_NUMBER,                     // present your trial DID
        timeLimit: TRIAL_MAX_SECONDS,               // hard cap length for trials
        answerOnBridge: true
      })

      // statusCallback *on the Number node* so Twilio posts lifecycle + duration
      const statusUrl = `${SITE}/api/voice/status?type=trial`
      dial.number(
        {
          statusCallback: statusUrl,
          statusCallbackMethod: 'POST',
          statusCallbackEvent: 'initiated ringing answered completed'
        },
        VAPI_AGENT_NUMBER
      )

      // Also record a row we can complete later (notes = CallSid for correlation)
      await supabaseAdmin.from('tollfree_call_logs').insert({
        member_id: null,
        phone: From,
        started_at: new Date().toISOString(),
        status: 'in_progress',
        duration_sec: 0,
        notes: CallSid || 'trial' // keep the sid if present, else tag "trial"
      })

      res.setHeader('Content-Type', 'application/xml')
      return res.status(200).send(vr.toString())
    }

    // Trial used already
    const vr = new twilio.twiml.VoiceResponse()
    say(
      vr,
      'Thanks for trying Boroma. Your free trial call was already used from this number. ' +
        'You can start a plan at boroma dot site to keep using the service.'
    )
    vr.hangup()
    res.setHeader('Content-Type', 'application/xml')
    return res.status(200).send(vr.toString())
  } catch (e: any) {
    return res.status(500).json({ error: e.message || 'trial handler error' })
  }
}
