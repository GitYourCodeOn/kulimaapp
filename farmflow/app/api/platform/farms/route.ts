import { NextRequest, NextResponse } from "next/server"
import { requireSuperadmin } from "@/lib/tenant"
import { db } from "@/lib/db"
import { farms, invites } from "@/lib/db/schema"
import { sendEmail } from "@/lib/email"
import { randomBytes } from "crypto"
import { rateLimit } from "@/lib/rate-limit"
import { platformCreateFarmSchema } from "@/lib/validation"
import { sql } from "drizzle-orm"

export async function GET() {
  try {
    await requireSuperadmin()

    const allFarms = await db
      .select({
        id: farms.id,
        name: farms.name,
        farmingType: farms.farmingType,
        location: farms.location,
        sizeHa: farms.sizeHa,
        createdAt: farms.createdAt,
        userCount: sql<number>`(SELECT count(*)::int FROM users WHERE users.farm_id = ${farms.id})`,
      })
      .from(farms)
      .orderBy(farms.createdAt)

    return NextResponse.json({ farms: allFarms })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    if (msg === "UNAUTHENTICATED") return NextResponse.json({ error: msg }, { status: 401 })
    if (msg === "FORBIDDEN") return NextResponse.json({ error: msg }, { status: 403 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const blocked = rateLimit(req, "strict")
    if (blocked) return blocked

    const admin = await requireSuperadmin()

    const parsed = platformCreateFarmSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      )
    }

    const { farmName, farmingType, location, managerEmail, managerName } = parsed.data
    const farmId = crypto.randomUUID()

    await db.insert(farms).values({
      id: farmId,
      name: farmName,
      farmingType,
      location: location || null,
      ownerId: admin.userId,
    })

    const token = randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000)

    await db.insert(invites).values({
      id: crypto.randomUUID(),
      farmId,
      email: managerEmail,
      role: "manager",
      token,
      expiresAt,
    })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
    const acceptUrl = `${baseUrl}/accept-invite?token=${token}`

    await sendEmail({
      to: managerEmail,
      subject: "You're invited to manage a farm on FarmFlow",
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
          <h2 style="color:#166534;">You're invited as farm manager</h2>
          <p>Hi ${managerName},</p>
          <p>You've been invited to manage <strong>${farmName}</strong> on FarmFlow.</p>
          <p>Click below to create your account. This link expires in 48 hours.</p>
          <a href="${acceptUrl}" style="display:inline-block;padding:10px 20px;background:#166534;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">
            Accept Invitation
          </a>
          <p style="color:#888;font-size:13px;margin-top:16px;">If you weren't expecting this, you can safely ignore this email.</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true, farmId })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    if (msg === "UNAUTHENTICATED") return NextResponse.json({ error: msg }, { status: 401 })
    if (msg === "FORBIDDEN") return NextResponse.json({ error: msg }, { status: 403 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
