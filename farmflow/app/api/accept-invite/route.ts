import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { invites, users, farms } from "@/lib/db/schema"
import { eq, and, gt, isNull } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { rateLimit } from "@/lib/rate-limit"
import { acceptInviteSchema } from "@/lib/validation"

export async function POST(req: NextRequest) {
  try {
    const blocked = rateLimit(req, "strict")
    if (blocked) return blocked

    const parsed = acceptInviteSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      )
    }

    const { token, name, password } = parsed.data

    const [invite] = await db
      .select()
      .from(invites)
      .where(
        and(
          eq(invites.token, token),
          gt(invites.expiresAt, new Date()),
          isNull(invites.acceptedAt)
        )
      )
      .limit(1)

    if (!invite) {
      return NextResponse.json(
        { error: "Invalid or expired invitation" },
        { status: 400 }
      )
    }

    const ctx = await auth.api.signUpEmail({
      body: {
        email: invite.email,
        password,
        name,
      },
    })

    if (!ctx?.user) {
      return NextResponse.json(
        { error: "Failed to create account" },
        { status: 500 }
      )
    }

    await db.insert(users).values({
      id: ctx.user.id,
      email: invite.email,
      name,
      role: invite.role,
      farmId: invite.farmId,
    })

    if (invite.role === "manager") {
      const [farm] = await db
        .select({ ownerId: farms.ownerId })
        .from(farms)
        .where(eq(farms.id, invite.farmId))
        .limit(1)

      if (farm) {
        const [ownerMember] = await db
          .select()
          .from(users)
          .where(
            and(eq(users.farmId, invite.farmId), eq(users.id, farm.ownerId))
          )
          .limit(1)

        if (!ownerMember) {
          await db
            .update(farms)
            .set({ ownerId: ctx.user.id })
            .where(eq(farms.id, invite.farmId))
        }
      }
    }

    await db
      .update(invites)
      .set({ acceptedAt: new Date() })
      .where(eq(invites.id, invite.id))

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    console.error("Accept invite error:", e)
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
