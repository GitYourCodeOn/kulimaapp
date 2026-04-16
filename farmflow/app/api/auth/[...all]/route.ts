import { NextRequest } from "next/server"
import { auth } from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"
import { rateLimit } from "@/lib/rate-limit"

const { GET: authGet, POST: authPost } = toNextJsHandler(auth)

export { authGet as GET }

export async function POST(req: NextRequest) {
  const blocked = rateLimit(req, "auth")
  if (blocked) return blocked

  return authPost(req)
}
