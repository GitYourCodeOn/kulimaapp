import { NextRequest, NextResponse } from "next/server"
import { requireManager } from "@/lib/tenant"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { userPatchSchema } from "@/lib/validation"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const tenant = await requireManager()
    const { userId } = await params
    const parsed = userPatchSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      )
    }

    const [target] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), eq(users.farmId, tenant.farmId)))
      .limit(1)

    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (target.role === "manager") {
      return NextResponse.json(
        { error: "Cannot modify a manager" },
        { status: 403 }
      )
    }

    await db
      .update(users)
      .set({ role: parsed.data.role })
      .where(eq(users.id, userId))

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    if (msg === "UNAUTHENTICATED") return NextResponse.json({ error: msg }, { status: 401 })
    if (msg === "FORBIDDEN") return NextResponse.json({ error: msg }, { status: 403 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const tenant = await requireManager()
    const { userId } = await params

    if (userId === tenant.userId) {
      return NextResponse.json(
        { error: "Cannot remove yourself" },
        { status: 400 }
      )
    }

    const [target] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), eq(users.farmId, tenant.farmId)))
      .limit(1)

    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (target.role === "manager") {
      return NextResponse.json(
        { error: "Cannot remove a manager — only superadmins can" },
        { status: 403 }
      )
    }

    await db.delete(users).where(eq(users.id, userId))

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    if (msg === "UNAUTHENTICATED") return NextResponse.json({ error: msg }, { status: 401 })
    if (msg === "FORBIDDEN") return NextResponse.json({ error: msg }, { status: 403 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
