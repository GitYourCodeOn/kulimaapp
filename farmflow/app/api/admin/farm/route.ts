import { NextRequest, NextResponse } from "next/server"
import { requireManager } from "@/lib/tenant"
import { db } from "@/lib/db"
import { farms } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { farmPatchSchema } from "@/lib/validation"

export async function GET() {
  try {
    const tenant = await requireManager()

    const [farm] = await db
      .select()
      .from(farms)
      .where(eq(farms.id, tenant.farmId))
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
    const tenant = await requireManager()

    const parsed = farmPatchSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      )
    }

    const updates = Object.fromEntries(
      Object.entries(parsed.data).filter(([, v]) => v !== undefined)
    )

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 })
    }

    await db.update(farms).set(updates).where(eq(farms.id, tenant.farmId))

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
    const tenant = await requireManager()
    const { confirmName } = await req.json()

    const [farm] = await db
      .select()
      .from(farms)
      .where(eq(farms.id, tenant.farmId))
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
