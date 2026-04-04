import { NextRequest, NextResponse } from "next/server"

const publicPaths = ["/login", "/register", "/accept-invite", "/api/auth"]

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

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
}
