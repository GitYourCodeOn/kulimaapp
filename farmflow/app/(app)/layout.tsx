"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession, signOut } from "@/lib/auth-client"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import {
  LayoutDashboard,
  Bug,
  Heart,
  Stethoscope,
  MoreHorizontal,
  Settings,
  Search,
  Bell,
  Wheat,
  LogOut,
  Shield,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

interface AppUser {
  userId: string | null
  role: "manager" | "worker" | null
  farmId: string | null
  impersonating: boolean
  isSuperadmin: boolean
}

interface Farm {
  id: string
  name: string
  farmingType: string
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/herd", label: "Herd", icon: Bug },
  { href: "/breeding", label: "Breeding", icon: Heart },
  { href: "/health", label: "Health", icon: Stethoscope },
  { href: "/more", label: "More", icon: MoreHorizontal },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [appUser, setAppUser] = useState<AppUser | null>(null)
  const [farm, setFarm] = useState<Farm | null>(null)

  const fetchContext = useCallback(async () => {
    try {
      const [meRes, farmRes] = await Promise.all([
        fetch("/api/me"),
        fetch("/api/admin/farm"),
      ])
      if (meRes.ok) setAppUser(await meRes.json())
      if (farmRes.ok) {
        const data = await farmRes.json()
        if (data.farm) setFarm(data.farm)
      }
    } catch {
      /* non-critical */
    }
  }, [])

  useEffect(() => {
    if (!session?.user) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- async fetch updates shell context after session
    void fetchContext()
  }, [session?.user, fetchContext])

  useEffect(() => {
    if (isPending) return
    if (!session) {
      router.replace("/login")
    }
  }, [isPending, session, router])

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f9f7]">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f9f7]">
        <p className="text-sm text-muted-foreground">Redirecting…</p>
      </div>
    )
  }

  const initials =
    session.user.name
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "?"

  const farmingLabel =
    farm?.farmingType
      ? farm.farmingType.charAt(0).toUpperCase() + farm.farmingType.slice(1)
      : ""

  return (
    <div className="flex min-h-screen bg-[#f7f9f7]">
      {/* ── Desktop Sidebar ── */}
      <aside className="fixed left-0 top-0 z-40 hidden h-full w-[220px] flex-col border-r border-[#e8ede8] bg-[#f2f4f2] md:flex">
        <div className="px-6 py-8">
          {/* Logo + farm name */}
          <div className="mb-10 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#166534]">
              <Wheat className="h-4 w-4 text-white" />
            </div>
            <div className="overflow-hidden">
              <h1 className="text-lg font-bold tracking-tight text-[#166534]">
                FarmFlow
              </h1>
              {farm && (
                <p className="truncate text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {farm.name}
                </p>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || pathname.startsWith(item.href + "/")
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-[#e8ede8] font-semibold text-[#166534]"
                      : "text-muted-foreground hover:bg-[#e8ede8]"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Bottom: settings + user */}
        <div className="mt-auto border-t border-[#e8ede8]/50 px-6 py-6 space-y-1">
          {appUser?.isSuperadmin && (
            <Link
              href="/platform"
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                pathname.startsWith("/platform")
                  ? "bg-[#e8ede8] font-semibold text-[#166534]"
                  : "text-muted-foreground hover:bg-[#e8ede8]"
              }`}
            >
              <Shield className="h-5 w-5" />
              Platform
            </Link>
          )}
          {appUser?.role === "manager" && (
            <Link
              href="/admin"
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                pathname.startsWith("/admin")
                  ? "bg-[#e8ede8] font-semibold text-[#166534]"
                  : "text-muted-foreground hover:bg-[#e8ede8]"
              }`}
            >
              <Settings className="h-5 w-5" />
              Settings
            </Link>
          )}

          <div className="mt-6 flex items-center gap-3 px-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-[#166534] text-[10px] font-bold text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-[#0f1f0f]">
                {session.user.name}
              </p>
              <p className="truncate text-[10px] capitalize text-muted-foreground">
                {appUser?.isSuperadmin ? "Superadmin" : appUser?.role ?? ""}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Topbar ── */}
      <header className="fixed right-0 left-0 top-0 z-30 flex h-16 items-center justify-between bg-[#f7f9f7]/80 px-4 backdrop-blur-md md:left-[220px] md:px-6">
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold text-[#166534] md:hidden">
            FarmFlow
          </span>
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search herd, records, or health…"
              className="w-80 rounded-full border-none bg-[#f2f4f2] pl-9 text-sm placeholder:text-muted-foreground/50 focus-visible:ring-[#166534]"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full text-muted-foreground hover:bg-[#e8ede8]"
          >
            <Bell className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden rounded-full text-muted-foreground hover:bg-[#e8ede8] md:inline-flex"
            onClick={async () => {
              await signOut()
              router.push("/login")
            }}
          >
            <LogOut className="h-5 w-5" />
          </Button>
          <div className="hidden h-8 w-px bg-[#e8ede8] md:block" />
          <div className="hidden items-center gap-2 sm:flex">
            <div className="text-right">
              <p className="text-xs font-bold leading-none text-[#0f1f0f]">
                {session.user.name}
              </p>
              {farmingLabel && (
                <p className="text-[10px] font-bold text-[#166534]">
                  {farmingLabel}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="min-h-screen flex-1 pb-24 pt-16 md:pb-8 md:pl-[220px]">
        {children}
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-2xl border-t border-[#e8ede8]/15 bg-white/90 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] backdrop-blur-xl md:hidden">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center ${
                active
                  ? "rounded-xl bg-[#f2f4f2] px-3 py-1 text-[#166534]"
                  : "text-muted-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wider">
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
