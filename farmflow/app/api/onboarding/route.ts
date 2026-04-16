import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import {
  farms,
  users,
  animals,
  flocks,
  fields,
} from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { rateLimit } from "@/lib/rate-limit"
import { onboardingSchema } from "@/lib/validation"

export async function GET() {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })
    }

    const [appUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)

    if (!appUser) {
      return NextResponse.json({ needsOnboarding: true, step: "full" })
    }

    const [farm] = await db
      .select()
      .from(farms)
      .where(eq(farms.id, appUser.farmId))
      .limit(1)

    if (!farm) {
      return NextResponse.json({ needsOnboarding: true, step: "full" })
    }

    const hasData = await checkFarmHasData(farm.id)

    if (hasData) {
      return NextResponse.json({ needsOnboarding: false })
    }

    return NextResponse.json({
      needsOnboarding: true,
      step: "first-entry",
      farm: {
        id: farm.id,
        name: farm.name,
        farmingType: farm.farmingType,
        location: farm.location,
        sizeHa: farm.sizeHa,
      },
    })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

async function checkFarmHasData(farmId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: animals.id })
    .from(animals)
    .where(eq(animals.farmId, farmId))
    .limit(1)
  if (row) return true

  const [flockRow] = await db
    .select({ id: flocks.id })
    .from(flocks)
    .where(eq(flocks.farmId, farmId))
    .limit(1)
  if (flockRow) return true

  const [fieldRow] = await db
    .select({ id: fields.id })
    .from(fields)
    .where(eq(fields.farmId, farmId))
    .limit(1)
  if (fieldRow) return true

  return false
}

export async function POST(req: NextRequest) {
  try {
    const blocked = rateLimit(req, "api")
    if (blocked) return blocked

    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })
    }

    const [appUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)

    if (!appUser) {
      return NextResponse.json({ error: "No user record" }, { status: 400 })
    }

    const parsed = onboardingSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 }
      )
    }

    const { farmingType, name, breed, role: animalRole, crop, type: flockType } = parsed.data
    const farmId = appUser.farmId
    const ft = farmingType

    if (ft === "crops") {
      await db.insert(fields).values({
        id: crypto.randomUUID(),
        farmId,
        name,
        crop: crop || null,
        status: "Fallow",
      })
    } else if (ft === "chickens") {
      await db.insert(flocks).values({
        id: crypto.randomUUID(),
        farmId,
        name,
        type: (flockType as "Layer" | "Broiler" | "Breeder") || "Layer",
        count: 0,
      })
    } else {
      await db.insert(animals).values({
        id: crypto.randomUUID(),
        farmId,
        name,
        species: ft === "pigs" ? "pig" : "cattle",
        breed: breed || null,
        role: animalRole || null,
        status: "Active",
      })
    }

    return NextResponse.json({ success: true })
  } catch (e: unknown) {
    console.error("Onboarding error:", e)
    const msg = e instanceof Error ? e.message : "Unknown error"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
