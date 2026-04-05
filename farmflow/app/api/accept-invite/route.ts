import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { invites, users, authUser } from "@/lib/db/schema"
import { eq, and, gt, isNull } from "drizzle-orm"
import { auth } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const { token, name, password } = await req.json()

    if (!token || !name || !password) {
      return NextResponse.json(
        { error: "Token, name, and password are required" },
        { status: 400 }
      )
    }

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
