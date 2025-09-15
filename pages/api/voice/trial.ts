
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).send('<?xml version="1.0" encoding="UTF-8"?><Response><Reject/></Response>')
  }
  res.setHeader('Content-Type', 'application/xml; charset=utf-8')

  // ...your existing trial TwiML logic...
}

import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { digits } from '@/lib/phone';
import { respond, say, dialE164 } from '@/lib/twiml';

export const config = { api: { bodyParser: true } };

const VAPI_AGENT = process.env.VAPI_AGENT_NUMBER!;
const TRIAL_MAX_SECONDS = Number(process.env.TRIAL_MAX_SECONDS || 480); // prod default 8min

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const p: any = req.method === 'POST' ? req.body : req.query;
    const fromRaw = (p.From as string) || '';
    const callerDigits = digits(fromRaw);

    // **Deny** if this phone already has a member seat (they should use toll-free)
    const { data: member } = await supabaseAdmin
      .from('members').select('id').eq('phone_digits', callerDigits).maybeSingle();
    if (member?.id) {
      res.setHeader('Content-Type','text/xml');
      return res.status(200).send(
        respond(say('This line is for first time trials only. Your plan includes a toll-free number.'))
      );
    }

    // First-call only logic
    const { data: trial } = await supabaseAdmin
      .from('trial_calls').select('id, call_count').eq('phone_digits', callerDigits).maybeSingle();

    if (!trial) {
      // Allow and mark first call
      await supabaseAdmin.from('trial_calls')
        .insert({ phone_digits: callerDigits, call_count: 1 });
      const pre = say('Your free trial call is starting.');
      const xml = respond(pre + dialE164(VAPI_AGENT, TRIAL_MAX_SECONDS));
      res.setHeader('Content-Type', 'text/xml');
      return res.status(200).send(xml);
    }

    // Already used
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(
      respond(say('Your free trial was already used. Please visit boroma.site to start a plan.'))
    );
  } catch (e) {
    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(respond(say('Sorry, a system error occurred.')));
  }
}
