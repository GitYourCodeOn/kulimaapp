import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { users, animals, platformAdmins } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { headers, cookies } from "next/headers"

export interface TenantContext {
  userId: string
  farmId: string
  role: "manager" | "worker"
  impersonating: boolean
}

export interface PlatformContext {
  userId: string
  email: string
}

/**
 * Resolves the current authenticated user's tenant context.
 * If impersonating, returns the impersonated user's role and farmId.
 * Throws "UNAUTHENTICATED" or "NO_FARM" on failure.
 */
export async function getTenant(): Promise<TenantContext> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("UNAUTHENTICATED")

  const impCookie = (await cookies()).get("farmflow-impersonation")?.value
  if (impCookie) {
    try {
      const imp = JSON.parse(impCookie)
      if (imp.userId && imp.farmId && imp.role) {
        return {
          userId: imp.userId,
          farmId: imp.farmId,
          role: imp.role,
          impersonating: true,
        }
      }
    } catch {
      // Invalid cookie — fall through to real session
    }
  }

  const [appUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  if (!appUser) throw new Error("NO_FARM")

  return {
    userId: appUser.id,
    farmId: appUser.farmId,
    role: appUser.role as "manager" | "worker",
    impersonating: false,
  }
}

/**
 * Checks if the current session belongs to a platform superadmin.
 * Throws "UNAUTHENTICATED" or "FORBIDDEN" on failure.
 */
export async function requireSuperadmin(): Promise<PlatformContext> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("UNAUTHENTICATED")

  const [row] = await db
    .select()
    .from(platformAdmins)
    .where(eq(platformAdmins.userId, session.user.id))
    .limit(1)

  if (!row) throw new Error("FORBIDDEN")

  return { userId: session.user.id, email: session.user.email }
}

/**
 * Checks if the current session belongs to a platform superadmin.
 * Returns null if not (does not throw).
 */
export async function isSuperadmin(): Promise<boolean> {
  try {
    const session = await auth.api.getSession({ headers: await headers() })
    if (!session?.user) return false

    const [row] = await db
      .select()
      .from(platformAdmins)
      .where(eq(platformAdmins.userId, session.user.id))
      .limit(1)

    return !!row
  } catch {
    return false
  }
}

/**
 * Returns platform admin context if the session is a superadmin, else null.
 * Does not throw (unlike requireSuperadmin).
 */
export async function getPlatformAdmin(): Promise<PlatformContext | null> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) return null

  const [row] = await db
    .select()
    .from(platformAdmins)
    .where(eq(platformAdmins.userId, session.user.id))
    .limit(1)

  if (!row) return null
  return { userId: session.user.id, email: session.user.email }
}

/**
 * Requires the current user to be a manager within their farm.
 * Returns the full tenant context.
 */
export async function requireManager(): Promise<TenantContext> {
  const tenant = await getTenant()
  if (tenant.role !== "manager") throw new Error("FORBIDDEN")
  return tenant
}

/**
 * Validates that a given entity (by ID) belongs to the specified farm.
 */
export async function assertSameFarm(
  animalId: string,
  farmId: string
): Promise<void> {
  const [animal] = await db
    .select({ farmId: animals.farmId })
    .from(animals)
    .where(and(eq(animals.id, animalId), eq(animals.farmId, farmId)))
    .limit(1)

  if (!animal) {
    throw new Error("CROSS_FARM_VIOLATION")
  }
}
