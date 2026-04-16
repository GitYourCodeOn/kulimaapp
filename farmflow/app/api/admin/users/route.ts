import { NextResponse } from "next/server"
import { requireManager } from "@/lib/tenant"
import { db } from "@/lib/db"
import { users, invites } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET() {
  try {
    const tenant = await requireManager()

    const farmUsers = await db
      .select()
      .from(users)
      .where(eq(users.farmId, tenant.farmId))

    const pendingInvites = await db
      .select()
      .from(invites)
      .where(eq(invites.farmId, tenant.farmId))

    return NextResponse.json({ users: farmUsers, invites: pendingInvites })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    if (msg === "UNAUTHENTICATED") return NextResponse.json({ error: msg }, { status: 401 })
    if (msg === "FORBIDDEN") return NextResponse.json({ error: msg }, { status: 403 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
