import { NextResponse } from "next/server"
import { requireSuperadmin } from "@/lib/tenant"
import { db } from "@/lib/db"
import { users, invites } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ farmId: string }> }
) {
  try {
    await requireSuperadmin()
    const { farmId } = await params

    const farmUsers = await db
      .select()
      .from(users)
      .where(eq(users.farmId, farmId))

    const pendingInvites = await db
      .select()
      .from(invites)
      .where(eq(invites.farmId, farmId))

    return NextResponse.json({ users: farmUsers, invites: pendingInvites })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    if (msg === "UNAUTHENTICATED") return NextResponse.json({ error: msg }, { status: 401 })
    if (msg === "FORBIDDEN") return NextResponse.json({ error: msg }, { status: 403 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
