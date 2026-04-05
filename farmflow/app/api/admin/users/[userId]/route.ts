import { NextRequest, NextResponse } from "next/server"
import { requireSuperuser } from "@/lib/admin"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { appUser } = await requireSuperuser()
    const { userId } = await params
    const body = await req.json()

    const [target] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), eq(users.farmId, appUser.farmId!)))
      .limit(1)

    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (target.role === "superuser" && target.id !== appUser.id) {
      return NextResponse.json(
        { error: "Cannot modify another superuser" },
        { status: 403 }
      )
    }

    const updates: Record<string, unknown> = {}
    if (body.role && ["manager", "worker"].includes(body.role)) {
      updates.role = body.role
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
    }

    await db.update(users).set(updates).where(eq(users.id, userId))

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
    const { appUser } = await requireSuperuser()
    const { userId } = await params

    if (userId === appUser.id) {
      return NextResponse.json(
        { error: "Cannot deactivate yourself" },
        { status: 400 }
      )
    }

    const [target] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), eq(users.farmId, appUser.farmId!)))
      .limit(1)

    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (target.role === "superuser") {
      return NextResponse.json(
        { error: "Cannot deactivate a superuser" },
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
