import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "@/lib/db"
import { sendEmail } from "@/lib/email"

export const auth = betterAuth({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: { enabled: true },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendEmail({
        to: user.email,
        subject: "Verify your FarmFlow account",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
            <h2 style="color:#166534;">Welcome to FarmFlow</h2>
            <p>Click the link below to verify your email address:</p>
            <a href="${url}" style="display:inline-block;padding:10px 20px;background:#166534;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
              Verify Email
            </a>
            <p style="color:#888;font-size:13px;margin-top:16px;">If you didn't create an account, you can safely ignore this email.</p>
          </div>
        `,
      })
    },
    sendOnSignUp: true,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,
    },
  },
})
