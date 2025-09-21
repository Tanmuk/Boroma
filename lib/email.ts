import { Resend } from 'resend'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const EMAIL_FROM = process.env.EMAIL_FROM || 'Boroma <hello@boroma.site>'

if (!RESEND_API_KEY) {
  // eslint-disable-next-line no-console
  console.warn('[email] RESEND_API_KEY is not set; emails will be skipped.')
}

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null

type SummaryEmailParams = {
  to: string
  memberName: string
  summary: string
  startedAt?: string | null
  endedAt?: string | null
  callSid?: string | null
}

/**
 * Sends the family summary email after a call completes.
 * Uses Resend; if not configured, it no-ops (but caller gets no throw).
 */
export async function sendCallSummaryEmail(params: SummaryEmailParams): Promise<void> {
  const { to, memberName, summary, startedAt, endedAt, callSid } = params
  if (!resend) return

  const when = (() => {
    try {
      const start = startedAt ? new Date(startedAt) : null
      const end = endedAt ? new Date(endedAt) : null
      if (start && end) {
        return `${start.toLocaleString()} — ${end.toLocaleTimeString()}`
      }
      if (start) return start.toLocaleString()
      return ''
    } catch {
      return ''
    }
  })()

  const subject = `Boroma summary — ${memberName}`

  const text =
`Summary for ${memberName}
${when ? `When: ${when}\n` : ''}${callSid ? `Call SID: ${callSid}\n` : ''}
—
${summary}

You’re receiving this because your family member is on your Boroma plan.
`

  const html = `
  <table width="100%" cellpadding="0" cellspacing="0" style="font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; color:#0f172a;">
    <tr><td>
      <h2 style="margin:0 0 8px 0; font-size:20px;">Summary for ${escapeHtml(memberName)}</h2>
      ${when ? `<div style="color:#475569; font-size:14px; margin-bottom:6px;">When: ${escapeHtml(when)}</div>` : ''}
      ${callSid ? `<div style="color:#94a3b8; font-size:12px; margin-bottom:14px;">Call SID: ${escapeHtml(callSid)}</div>` : ''}
      <div style="padding:12px 14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; line-height:1.6;">
        ${escapeHtml(summary)}
      </div>
      <p style="color:#64748b; font-size:13px; margin-top:16px;">
        You’re receiving this because your family member is on your Boroma plan.
      </p>
    </td></tr>
  </table>`

  await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject,
    text,
    html,
  })
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export default {
  sendCallSummaryEmail,
}
