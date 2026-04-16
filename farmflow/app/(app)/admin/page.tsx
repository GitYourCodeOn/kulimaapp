"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession, signOut } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"

import { UserManagement } from "./user-management"
import { FarmSettings } from "./farm-settings"

interface AppUser {
  id: string
  email: string
  name: string
  role: "manager" | "worker"
  farmId: string | null
  createdAt: string
}

interface Invite {
  id: string
  farmId: string
  email: string
  role: "manager" | "worker"
  token: string
  expiresAt: string
  acceptedAt: string | null
}

interface Farm {
  id: string
  name: string
  ownerId: string
  farmingType: "dairy" | "pigs" | "chickens" | "crops"
  location: string | null
  sizeHa: number | null
  createdAt: string
}

export default function AdminPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()

  const [users, setUsers] = useState<AppUser[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [farm, setFarm] = useState<Farm | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [usersRes, farmRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/farm"),
      ])

      if (usersRes.status === 403) {
        toast.error("You do not have permission to access this page")
        router.push("/dashboard")
        return
      }

      if (usersRes.ok) {
        const data = await usersRes.json()
        setUsers(data.users)
        setInvites(data.invites)
      }

      if (farmRes.ok) {
        const data = await farmRes.json()
        setFarm(data.farm)
      }
    } catch {
      toast.error("Failed to load admin data")
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    if (!isPending && session) fetchData()
  }, [isPending, session, fetchData])

  useEffect(() => {
    if (isPending) return
    if (!session) {
      router.replace("/login")
    }
  }, [isPending, session, router])

  if (isPending || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f9f7]">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f9f7]">
        <p className="text-muted-foreground">Redirecting…</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f9f7]">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#e8ede8] bg-white/90 px-4 py-3 backdrop-blur-sm sm:px-6">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-[#166534]">FarmFlow</h1>
          <span className="hidden text-sm text-muted-foreground sm:inline">
            / Admin
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard")}>
            Dashboard
          </Button>
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
        <h2 className="mb-6 text-2xl font-bold tracking-tight text-[#0f1f0f]">
          Admin Panel
        </h2>

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="farm">Farm Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UserManagement
              users={users}
              invites={invites}
              onRefresh={fetchData}
            />
          </TabsContent>

          <TabsContent value="farm">
            {farm && <FarmSettings farm={farm} onRefresh={fetchData} />}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
