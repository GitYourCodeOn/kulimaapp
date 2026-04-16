import { NextRequest, NextResponse } from "next/server"

const publicPaths = [
  "/login",
  "/register",
  "/accept-invite",
  "/forgot-password",
  "/reset-password",
  "/api/auth",
  "/api/accept-invite",
  "/api/onboarding",
]

const IMPERSONATION_SAFE_ROUTES = [
  "/api/admin/impersonate",
  "/api/admin/users",
  "/api/admin/farm",
  "/api/admin/invite",
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isPublic = publicPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  )
  if (isPublic) return NextResponse.next()

  const sessionCookie =
    req.cookies.get("better-auth.session_token")?.value ??
    req.cookies.get("__Secure-better-auth.session_token")?.value

  if (!sessionCookie) {
    const loginUrl = new URL("/login", req.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  const response = NextResponse.next()

  const impCookie = req.cookies.get("farmflow-impersonation")?.value
  if (impCookie) {
    try {
      const imp = JSON.parse(impCookie)
      response.headers.set("x-impersonating", "true")
      response.headers.set("x-imp-user-id", imp.userId ?? "")
      response.headers.set("x-imp-role", imp.role ?? "")
      response.headers.set("x-imp-farm-id", imp.farmId ?? "")

      const isMutation = ["POST", "PATCH", "PUT", "DELETE"].includes(req.method)
      const isApiRoute = pathname.startsWith("/api/")
      const isSafe = IMPERSONATION_SAFE_ROUTES.some(
        (r) => pathname === r || pathname.startsWith(r + "/")
      )

      if (isMutation && isApiRoute && !isSafe) {
        return NextResponse.json(
          { error: "Read-only while impersonating" },
          { status: 403 }
        )
      }
    } catch {
      // Invalid cookie — ignore
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
}
