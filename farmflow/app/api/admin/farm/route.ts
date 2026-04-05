import { NextRequest, NextResponse } from "next/server"
import { requireSuperuser } from "@/lib/admin"
import { db } from "@/lib/db"
import { farms } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function GET() {
  try {
    const { appUser } = await requireSuperuser()

    const [farm] = await db
      .select()
      .from(farms)
      .where(eq(farms.id, appUser.farmId!))
      .limit(1)

    if (!farm) {
      return NextResponse.json({ error: "Farm not found" }, { status: 404 })
    }

    return NextResponse.json({ farm })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    if (msg === "UNAUTHENTICATED") return NextResponse.json({ error: msg }, { status: 401 })
    if (msg === "FORBIDDEN") return NextResponse.json({ error: msg }, { status: 403 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { appUser } = await requireSuperuser()
    const body = await req.json()

    const updates: Record<string, unknown> = {}
    if (body.name) updates.name = body.name
    if (body.location !== undefined) updates.location = body.location
    if (body.sizeHa !== undefined) updates.sizeHa = body.sizeHa
    if (body.farmingType) updates.farmingType = body.farmingType

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
    }

    await db.update(farms).set(updates).where(eq(farms.id, appUser.farmId!))

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    if (msg === "UNAUTHENTICATED") return NextResponse.json({ error: msg }, { status: 401 })
    if (msg === "FORBIDDEN") return NextResponse.json({ error: msg }, { status: 403 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { appUser } = await requireSuperuser()
    const { confirmName } = await req.json()

    const [farm] = await db
      .select()
      .from(farms)
      .where(eq(farms.id, appUser.farmId!))
      .limit(1)

    if (!farm) {
      return NextResponse.json({ error: "Farm not found" }, { status: 404 })
    }

    if (confirmName !== farm.name) {
      return NextResponse.json(
        { error: "Farm name does not match" },
        { status: 400 }
      )
    }

    await db.delete(farms).where(eq(farms.id, farm.id))

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    if (msg === "UNAUTHENTICATED") return NextResponse.json({ error: msg }, { status: 401 })
    if (msg === "FORBIDDEN") return NextResponse.json({ error: msg }, { status: 403 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
