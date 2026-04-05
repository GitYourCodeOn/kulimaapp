"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession, signOut } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface AppUser {
  id: string
  role: "superuser" | "manager" | "worker"
  farmId: string | null
}

export default function DashboardPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()
  const [appUser, setAppUser] = useState<AppUser | null>(null)

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/users")
      if (res.ok) {
        const data = await res.json()
        const me = data.users?.find(
          (u: AppUser) => u.id === session?.user?.id
        )
        if (me) setAppUser(me)
      }
    } catch {
      // Non-critical — badge just won't show
    }
  }, [session?.user?.id])

  useEffect(() => {
    if (session?.user) fetchUser()
  }, [session?.user, fetchUser])

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f9f7]">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    )
  }

  if (!session) {
    router.push("/login")
    return null
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f9f7]">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#e8ede8] bg-white/90 px-4 py-3 backdrop-blur-sm sm:px-6">
        <h1 className="text-lg font-bold text-[#166534]">FarmFlow</h1>
        <div className="flex items-center gap-3">
          {appUser?.role === "superuser" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin")}
            >
              Admin
            </Button>
          )}
          <span className="hidden text-sm text-muted-foreground sm:inline">
            {session.user.name}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await signOut()
              router.push("/login")
            }}
          >
            Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-6 sm:px-6">
        <div className="mb-6 flex items-center gap-3">
          <h2 className="text-2xl font-bold tracking-tight text-[#0f1f0f]">
            Welcome, {session.user.name}
          </h2>
          {appUser && (
            <Badge variant="secondary" className="capitalize">
              {appUser.role}
            </Badge>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">🐄 Herd</CardTitle>
              <CardDescription>Manage your livestock</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Coming soon</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">🌾 Fields</CardTitle>
              <CardDescription>Crop management</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Coming soon</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">📋 Records</CardTitle>
              <CardDescription>Health, breeding &amp; milk</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Coming soon</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
