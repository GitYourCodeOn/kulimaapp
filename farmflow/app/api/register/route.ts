import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { farms, users } from "@/lib/db/schema"
import { headers } from "next/headers"

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
  }

  const { farmName, farmingType, location } = await req.json()

  if (!farmName || !farmingType) {
    return NextResponse.json(
      { error: "Farm name and farming type are required." },
      { status: 400 }
    )
  }

  const farmId = crypto.randomUUID()

  await db.insert(farms).values({
    id: farmId,
    name: farmName,
    farmingType,
    location: location || null,
    ownerId: session.user.id,
  })

  await db.insert(users).values({
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: "superuser",
    farmId,
  })

  return NextResponse.json({ success: true, farmId })
}
