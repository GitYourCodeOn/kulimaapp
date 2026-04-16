import { NextResponse } from "next/server"
import { getTenant, isSuperadmin } from "@/lib/tenant"

export async function GET() {
  try {
    const superadmin = await isSuperadmin()

    let tenant = null
    try {
      tenant = await getTenant()
    } catch {
      // Superadmins may not have a farm-scoped user row
    }

    if (!tenant && !superadmin) {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 })
    }

    return NextResponse.json({
      userId: tenant?.userId ?? null,
      farmId: tenant?.farmId ?? null,
      role: tenant?.role ?? null,
      impersonating: tenant?.impersonating ?? false,
      isSuperadmin: superadmin,
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error"
    if (msg === "UNAUTHENTICATED")
      return NextResponse.json({ error: msg }, { status: 401 })
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
