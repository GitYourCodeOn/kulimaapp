import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { farms, users } from "@/lib/db/schema"
import { headers } from "next/headers"
import { rateLimit } from "@/lib/rate-limit"
import { registerSchema } from "@/lib/validation"

export async function POST(req: NextRequest) {
  const blocked = rateLimit(req, "strict")
  if (blocked) return blocked

  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
  }

  const parsed = registerSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    )
  }

  const { farmName, farmingType, location } = parsed.data

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
    role: "manager",
    farmId,
  })

  return NextResponse.json({ success: true, farmId })
}
