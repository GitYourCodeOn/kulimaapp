import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { users } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"

export async function requireSuperuser() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) throw new Error("UNAUTHENTICATED")

  const [appUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1)

  if (!appUser || appUser.role !== "superuser") throw new Error("FORBIDDEN")

  return { session, appUser }
}
