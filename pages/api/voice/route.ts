// app/api/voice/route.ts
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!  // server-only
const VAPI_AGENT_NUMBER = '+13392091065'                    // Stella (Vapi)

export async function POST(req: Request) {
  // Twilio posts x-www-form-urlencoded -> use formData()
  const fd = await req.formData()
  const from = (fd.get('From') as string) || ''
  const caller = from.replace(/^tel:/, '').replace(/\D/g, '') // normalize to digits only

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })
  // Active member check by phone; adjust column/table names if yours differ
  const { data: member } = await supabase
    .from('members')
    .select('id,status')
    .eq('phone', caller)
    .eq('status', 'active')
    .maybeSingle()

  if (!member) {
    const msg =
      'Thanks for calling Boroma. To use this toll free number, please buy a plan at boroma dot site. ' +
      'Your first call is free at three three nine two zero nine one zero six five.'
    const reject = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>${msg}</Say>
</Response>`
    return new Response(reject, { headers: { 'Content-Type': 'text/xml' } })
  }

  // Paid member -> connect to Vapi, 35-minute hard cap (2100 seconds)
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Dial answerOnBridge="true" timeout="60" timeLimit="2100">
    <Number>${VAPI_AGENT_NUMBER}</Number>
  </Dial>
</Response>`
  return new Response(twiml, { headers: { 'Content-Type': 'text/xml' } })
}

export function GET() {
  return new Response('POST required', { status: 405, headers: { Allow: 'POST' } })
}
