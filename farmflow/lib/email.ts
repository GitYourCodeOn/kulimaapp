import nodemailer from "nodemailer"

// Nodemailer SMTP transport — points at your Stalwart mail server.
// All values are injected via environment variables so swapping the
// SMTP host in Dokploy (or locally in .env.local) is the only change needed.
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST!,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true", // true → port 465 (SSL), false → 587 (STARTTLS)
  auth: {
    user: process.env.SMTP_USER!,
    pass: process.env.SMTP_PASS!,
  },
})

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

export async function sendEmail({ to, subject, html, from }: SendEmailOptions) {
  const defaultFrom = process.env.SMTP_FROM ?? `FarmFlow <noreply@${process.env.SMTP_HOST}>`

  await transporter.sendMail({
    from: from ?? defaultFrom,
    to,
    subject,
    html,
  })
}
