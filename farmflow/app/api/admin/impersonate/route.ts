import { NextRequest, NextResponse } from "next/server"
import { requireSuperadmin } from "@/lib/tenant"
import { db } from "@/lib/db"
import { users, impersonationLogs } from "@/lib/db/schema"
import { eq, and, isNull } from "drizzle-orm"
import {
  getImpersonation,
  setImpersonation,
  clearImpersonation,
} from "@/lib/impersonation"

export async function GET() {
  try {
    const imp = await getImpersonation()
    return NextResponse.json({ impersonating: imp })
  } catch {
    return NextResponse.json({ impersonating: null })
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = await requireSuperadmin()
    const { userId, reason } = await req.json()

    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 })
    }

    const [target] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const logId = crypto.randomUUID()

    await db.insert(impersonationLogs).values({
      id: logId,
      adminId: admin.userId,
      impersonatedUserId: target.id,
      farmId: target.farmId,
      reason: reason || null,
    })

    await setImpersonation({
      userId: target.id,
      name: target.name,
      role: target.role,
      farmId: target.farmId,
      logId,
    })

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    if (msg === "UNAUTHENTICATED") return NextResponse.json({ error: msg }, { status: 401 })
    if (msg === "FORBIDDEN") return NextResponse.json({ error: msg }, { status: 403 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    await requireSuperadmin()
    const imp = await getImpersonation()

    if (imp?.logId) {
      await db
        .update(impersonationLogs)
        .set({ endedAt: new Date() })
        .where(
          and(
            eq(impersonationLogs.id, imp.logId),
            isNull(impersonationLogs.endedAt)
          )
        )
    }

    await clearImpersonation()
    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    await clearImpersonation()
    const msg = e instanceof Error ? e.message : "Unknown error"
    if (msg === "UNAUTHENTICATED") return NextResponse.json({ error: msg }, { status: 401 })
    if (msg === "FORBIDDEN") return NextResponse.json({ error: msg }, { status: 403 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
