import type { NextApiRequest, NextApiResponse } from 'next';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { digits } from '@/lib/phone';
import { respond, say, dialE164 } from '@/lib/twiml';

export const config = { api: { bodyParser: true } }; // Twilio posts x-www-form-urlencoded; Next parses it into req.body

const TOLL_FREE = process.env.NEXT_PUBLIC_PRIMARY_PHONE!;
const VAPI_AGENT = process.env.VAPI_AGENT_NUMBER!;
const MEMBER_MAX_SECONDS = Number(process.env.MEMBER_MAX_SECONDS || 2100); // prod default 35min

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const p: any = req.method === 'POST' ? req.body : req.query;
    const fromRaw = (p.From as string) || (p.from as string) || '';
    const toRaw   = (p.To as string)   || (p.to as string)   || '';

    const callerDigits = digits(fromRaw);
    const calledE164   = (toRaw || '').trim();

    // Route only the toll-free here
    if (calledE164 !== TOLL_FREE) {
      res.status(405).send('Wrong number for this route');
      return;
    }

    // Is this caller a MEMBER with a VALID subscription seat?
    const { data: row, error } = await supabaseAdmin
      .rpc('exec_sql', {
        sql: `
          select m.id
          from public.members m
          join public.subscriptions s on s.id = m.subscription_id
          where m.phone_digits = $1
            and s.status in ('active','trialing')
            and coalesce(s.cancel_at_period_end,false) = false
            and (s.current_period_end is null or s.current_period_end > now())
          limit 1;`,
        params: [callerDigits]
      } as any);

    // Fallback if RPC isn't enabled: run with select() + filter()
    let isAllowed = false;
    if (!error) {
      isAllowed = Array.isArray(row) && row.length > 0;
    } else {
      // Safe fallback using a single SQL through PostgREST
      const { data, error: e2 } = await supabaseAdmin
        .from('members')
        .select('id, subscription_id, subscriptions!inner(status, cancel_at_period_end, current_period_end)')
        .eq('phone_digits', callerDigits)
        .limit(1)
        .maybeSingle();
      if (!e2 && data?.subscriptions) {
        const s = (data as any).subscriptions;
        isAllowed = (['active','trialing'].includes(s.status) &&
                     !s.cancel_at_period_end &&
                     (!s.current_period_end || new Date(s.current_period_end) > new Date()));
      }
    }

    if (!isAllowed) {
      // Not a member seat: do NOT forward to Vapi on toll-free
      const msg = `This number is for Boroma members. Please visit boroma.site to start a plan.`;
      res.setHeader('Content-Type', 'text/xml');
      res.status(200).send(respond(say(msg)));
      return;
    }

    // Allowed member seat → connect to Vapi agent with a time limit
    const pre = say('Connecting you to your Boroma tech helper.');
    const body = respond(pre + dialE164(VAPI_AGENT, MEMBER_MAX_SECONDS));
    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(body);
  } catch (err: any) {
    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send(respond(say('Sorry, a system error occurred.'))); // Always 200 XML for Twilio
  }
}
