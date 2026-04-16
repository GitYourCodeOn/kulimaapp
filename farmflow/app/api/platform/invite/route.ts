import { NextRequest, NextResponse } from "next/server"
import { requireSuperadmin } from "@/lib/tenant"
import { db } from "@/lib/db"
import { invites, farms } from "@/lib/db/schema"
import { sendEmail } from "@/lib/email"
import { randomBytes } from "crypto"
import { rateLimit } from "@/lib/rate-limit"
import { eq } from "drizzle-orm"
import { platformInviteSchema } from "@/lib/validation"

export async function POST(req: NextRequest) {
  try {
    const blocked = rateLimit(req, "strict")
    if (blocked) return blocked

    await requireSuperadmin()

    const parsed = platformInviteSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      )
    }

    const { farmId, email, role } = parsed.data

    const [farm] = await db
      .select()
      .from(farms)
      .where(eq(farms.id, farmId))
      .limit(1)

    if (!farm) {
      return NextResponse.json({ error: "Farm not found" }, { status: 404 })
    }

    const token = randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000)

    await db.insert(invites).values({
      id: crypto.randomUUID(),
      farmId,
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
          <p>You've been invited to join <strong>${farm.name}</strong> as a <strong>${role}</strong>.</p>
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
    console.error("Platform invite error:", e)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
