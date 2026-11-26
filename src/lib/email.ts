import nodemailer from 'nodemailer'

export type Email = { to: string; subject: string; text: string; html: string }

export function emailConfigured(): boolean {
  return Boolean(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD)
}

/**
 * Sends through the club's Gmail account (GMAIL_USER + GMAIL_APP_PASSWORD).
 * In development, without those set, the email is printed to the server log
 * instead so the flow can be tested without sending anything.
 */
export async function sendEmail(email: Email): Promise<void> {
  if (!emailConfigured()) {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[email not sent - no Gmail configured]\n  to: ${email.to}\n  subject: ${email.subject}\n  ${email.text.replace(/\n/g, '\n  ')}`)
    }
    return
  }

  const transport = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  })

  await transport.sendMail({
    from: `"Book Club" <${process.env.GMAIL_USER}>`,
    to: email.to,
    subject: email.subject,
    text: email.text,
    html: email.html,
  })
}
