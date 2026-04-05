import { NextRequest, NextResponse } from "next/server"
import { requireSuperuser } from "@/lib/admin"
import { db } from "@/lib/db"
import { invites } from "@/lib/db/schema"
import { sendEmail } from "@/lib/email"
import { randomBytes } from "crypto"

export async function POST(req: NextRequest) {
  try {
    const { appUser } = await requireSuperuser()
    const { email, role } = await req.json()

    if (!email || !role || !["manager", "worker"].includes(role)) {
      return NextResponse.json(
        { error: "Valid email and role (manager/worker) required" },
        { status: 400 }
      )
    }

    const token = randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000)

    await db.insert(invites).values({
      id: crypto.randomUUID(),
      farmId: appUser.farmId!,
      email,
      role,
      token,
      expiresAt,
    })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const acceptUrl = `${baseUrl}/accept-invite?token=${token}`

    await sendEmail({
      to: email,
      subject: "You've been invited to FarmFlow",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <h2 style="color:#166534;">You're invited to FarmFlow</h2>
          <p>You've been invited to join a farm as a <strong>${role}</strong>.</p>
          <p>Click the button below to set up your account. This link expires in 48 hours.</p>
          <a href="${acceptUrl}" style="display:inline-block;padding:10px 20px;background:#166534;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
            Accept Invitation
          </a>
          <p style="color:#888;font-size:13px;margin-top:16px;">If you weren't expecting this, you can safely ignore this email.</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    if (msg === "UNAUTHENTICATED") return NextResponse.json({ error: msg }, { status: 401 })
    if (msg === "FORBIDDEN") return NextResponse.json({ error: msg }, { status: 403 })
    console.error("Invite error:", e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
