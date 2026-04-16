import { NextRequest, NextResponse } from "next/server"

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

const CLEANUP_INTERVAL = 60_000
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key)
  }
}

export interface RateLimitConfig {
  /** Max requests per window */
  limit: number
  /** Window size in seconds */
  windowSec: number
}

const PRESETS = {
  /** Auth endpoints: 10 req / 60s per IP */
  auth: { limit: 10, windowSec: 60 },
  /** Invite / registration: 5 req / 60s per IP */
  strict: { limit: 5, windowSec: 60 },
  /** General API: 60 req / 60s per IP */
  api: { limit: 60, windowSec: 60 },
} as const satisfies Record<string, RateLimitConfig>

export type RateLimitPreset = keyof typeof PRESETS

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  )
}

/**
 * Returns null if the request is within limits, or a 429 Response if exceeded.
 * Use as a guard at the top of API route handlers.
 *
 * @example
 * const blocked = rateLimit(req, "auth")
 * if (blocked) return blocked
 */
export function rateLimit(
  req: NextRequest,
  preset: RateLimitPreset,
  /** Optional extra key segment (e.g. email) for per-identity limits */
  keySuffix?: string
): NextResponse | null {
  cleanup()

  const config = PRESETS[preset]
  const ip = getClientIp(req)
  const key = `${preset}:${ip}${keySuffix ? `:${keySuffix}` : ""}`
  const now = Date.now()

  const entry = store.get(key)

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + config.windowSec * 1000 })
    return null
  }

  entry.count++

  if (entry.count > config.limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(config.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(entry.resetAt / 1000)),
        },
      }
    )
  }

  return null
}
