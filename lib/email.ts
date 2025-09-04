import { Resend } from 'resend'

const apiKey = process.env.RESEND_API_KEY
const from = process.env.EMAIL_FROM || 'Boroma <hello@boroma.site>'
const resend = apiKey ? new Resend(apiKey) : null

export async function sendEmail(to: string | string[], subject: string, html: string){
  if (!resend) return
  try {
    await resend.emails.send({
      from,
      to: Array.isArray(to) ? to : [to],
      subject,
      html
    })
  } catch (e) {
    console.error('sendEmail error', e)
  }
}
