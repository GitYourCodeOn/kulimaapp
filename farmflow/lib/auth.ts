import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { db } from "@/lib/db"
import { sendEmail } from "@/lib/email"
import * as schema from "@/lib/db/schema"

export const auth = betterAuth({
  baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.authUser,
      session: schema.authSession,
      account: schema.authAccount,
      verification: schema.authVerification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    sendResetPassword: async ({ user, url }) => {
      void sendEmail({
        to: user.email,
        subject: "Reset your FarmFlow password",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
            <h2 style="color:#166534;">Password reset</h2>
            <p>We received a request to reset the password for <strong>${user.email}</strong>.</p>
            <p>Click the button below to choose a new password. This link expires soon.</p>
            <a href="${url}" style="display:inline-block;padding:10px 20px;background:#166534;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
              Reset password
            </a>
            <p style="color:#888;font-size:13px;margin-top:16px;">If you did not request this, you can ignore this email. Your password will stay the same.</p>
          </div>
        `,
      }).catch((err) => {
        console.error("sendResetPassword email failed:", err)
      })
    },
    onPasswordReset: async ({ user }) => {
      console.info(`[auth] Password reset completed for ${user.email}`)
    },
  },
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
