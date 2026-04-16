"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

interface Farm {
  id: string
  name: string
  farmingType: string
  location: string | null
  sizeHa: number | null
  createdAt: string
  userCount: number
}

interface FarmUser {
  id: string
  email: string
  name: string
  role: "manager" | "worker"
  farmId: string
  createdAt: string
}

export default function PlatformPage() {
  const router = useRouter()
  const [farms, setFarms] = useState<Farm[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [creating, setCreating] = useState(false)

  // Create farm form
  const [farmName, setFarmName] = useState("")
  const [farmingType, setFarmingType] = useState("")
  const [location, setLocation] = useState("")
  const [managerEmail, setManagerEmail] = useState("")
  const [managerName, setManagerName] = useState("")

  // Invite to farm
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteFarmId, setInviteFarmId] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"manager" | "worker">("worker")
  const [inviting, setInviting] = useState(false)

  // Impersonation
  const [impOpen, setImpOpen] = useState(false)
  const [impFarm, setImpFarm] = useState<Farm | null>(null)
  const [impUsers, setImpUsers] = useState<FarmUser[]>([])
  const [impUserId, setImpUserId] = useState("")
  const [impReason, setImpReason] = useState("")
  const [impLoading, setImpLoading] = useState(false)

  const fetchFarms = useCallback(async () => {
    try {
      const res = await fetch("/api/platform/farms")
      if (res.status === 403) {
        toast.error("You do not have platform access")
        router.push("/dashboard")
        return
      }
      if (res.ok) {
        const data = await res.json()
        setFarms(data.farms)
      }
    } catch {
      toast.error("Failed to load farms")
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchFarms()
  }, [fetchFarms])

  async function handleCreateFarm(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    try {
      const res = await fetch("/api/platform/farms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farmName,
          farmingType,
          location: location || undefined,
          managerEmail,
          managerName,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? "Failed to create farm")
        return
      }
      toast.success(`Farm "${farmName}" created`)
      setCreateOpen(false)
      setFarmName("")
      setFarmingType("")
      setLocation("")
      setManagerEmail("")
      setManagerName("")
      await fetchFarms()
    } catch {
      toast.error("Network error")
    } finally {
      setCreating(false)
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviting(true)
    try {
      const res = await fetch("/api/platform/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farmId: inviteFarmId,
          email: inviteEmail,
          role: inviteRole,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? "Failed to send invite")
        return
      }
      toast.success(`Invitation sent to ${inviteEmail}`)
      setInviteOpen(false)
      setInviteEmail("")
      setInviteRole("worker")
      setInviteFarmId("")
    } catch {
      toast.error("Network error")
    } finally {
      setInviting(false)
    }
  }

  async function openImpersonate(farm: Farm) {
    setImpFarm(farm)
    setImpOpen(true)
    setImpUsers([])
    setImpUserId("")
    setImpReason("")
    try {
      const res = await fetch(`/api/platform/farms/${farm.id}/users`)
      if (res.ok) {
        const data = await res.json()
        setImpUsers(data.users)
      }
    } catch {
      toast.error("Failed to load farm users")
    }
  }

  async function handleImpersonate() {
    if (!impUserId) return
    setImpLoading(true)
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: impUserId, reason: impReason || undefined }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? "Failed to impersonate")
        return
      }
      const target = impUsers.find((u) => u.id === impUserId)
      toast.success(`Now impersonating ${target?.name ?? "user"}`)
      setImpOpen(false)
      window.location.href = "/dashboard"
    } catch {
      toast.error("Network error")
    } finally {
      setImpLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading platform…</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl space-y-10 p-6 md:p-10">
      <div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#166534]">
          Superadmin
        </span>
        <h2 className="mt-1 text-4xl font-extrabold tracking-tight text-[#0f1f0f]">
          Platform
        </h2>
      </div>

      <Tabs defaultValue="farms" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="farms">Farms / Orgs</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="farms" className="space-y-6">
          {/* Actions bar */}
          <div className="flex flex-wrap gap-3">
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger render={<Button size="sm" />}>
                + Create Farm
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create a new farm</DialogTitle>
                  <DialogDescription>
                    Set up a farm and assign its first manager.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateFarm} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pf-name">Farm Name</Label>
                    <Input
                      id="pf-name"
                      value={farmName}
                      onChange={(e) => setFarmName(e.target.value)}
                      placeholder="e.g. Sunrise Dairy"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pf-type">Farming Type</Label>
                    <Select value={farmingType} onValueChange={(v) => setFarmingType(v ?? "")}>
                      <SelectTrigger id="pf-type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dairy">Dairy</SelectItem>
                        <SelectItem value="pigs">Pigs</SelectItem>
                        <SelectItem value="chickens">Chickens</SelectItem>
                        <SelectItem value="crops">Crops</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pf-location">Location (optional)</Label>
                    <Input
                      id="pf-location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. Free State, SA"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pf-mgr-name">Manager Name</Label>
                    <Input
                      id="pf-mgr-name"
                      value={managerName}
                      onChange={(e) => setManagerName(e.target.value)}
                      placeholder="Full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pf-mgr-email">Manager Email</Label>
                    <Input
                      id="pf-mgr-email"
                      type="email"
                      value={managerEmail}
                      onChange={(e) => setManagerEmail(e.target.value)}
                      placeholder="manager@example.com"
                      required
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={creating || !farmingType} className="w-full sm:w-auto">
                      {creating ? "Creating…" : "Create Farm"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
              <DialogTrigger render={<Button size="sm" variant="outline" />}>
                + Invite User
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Invite user to a farm</DialogTitle>
                  <DialogDescription>
                    Send an invite as either a manager or worker.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleInvite} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="pi-farm">Farm</Label>
                    <Select value={inviteFarmId} onValueChange={(v) => setInviteFarmId(v ?? "")}>
                      <SelectTrigger id="pi-farm">
                        <SelectValue placeholder="Select farm" />
                      </SelectTrigger>
                      <SelectContent>
                        {farms.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pi-email">Email</Label>
                    <Input
                      id="pi-email"
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pi-role">Role</Label>
                    <Select value={inviteRole} onValueChange={(v) => setInviteRole((v as "manager" | "worker") ?? "worker")}>
                      <SelectTrigger id="pi-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="worker">Worker</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={inviting || !inviteFarmId} className="w-full sm:w-auto">
                      {inviting ? "Sending…" : "Send Invitation"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Farms table */}
          <Card>
            <CardHeader>
              <CardTitle>All Farms</CardTitle>
              <CardDescription>{farms.length} organisations</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Mobile cards */}
              <div className="space-y-3 sm:hidden">
                {farms.map((farm) => (
                  <div
                    key={farm.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{farm.name}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <Badge variant="secondary" className="capitalize">
                          {farm.farmingType}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {farm.userCount} users
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openImpersonate(farm)}
                    >
                      Enter
                    </Button>
                  </div>
                ))}
              </div>

              {/* Desktop table */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Farm</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Users</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {farms.map((farm) => (
                      <TableRow key={farm.id}>
                        <TableCell className="font-medium">{farm.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {farm.farmingType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {farm.location ?? "—"}
                        </TableCell>
                        <TableCell>{farm.userCount}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(farm.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openImpersonate(farm)}
                          >
                            Enter farm
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>Coming soon — impersonation logs and audit trail</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="py-12 text-center text-sm text-muted-foreground">
                No activity to display yet.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Impersonate dialog — pick user from farm */}
      <Dialog open={impOpen} onOpenChange={setImpOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enter {impFarm?.name}</DialogTitle>
            <DialogDescription>
              Choose a user to impersonate. This will be logged.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>User</Label>
              {impUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">Loading users…</p>
              ) : (
                <Select value={impUserId} onValueChange={(v) => setImpUserId(v ?? "")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {impUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="imp-reason">Reason (optional)</Label>
              <Textarea
                id="imp-reason"
                value={impReason}
                onChange={(e) => setImpReason(e.target.value)}
                placeholder="e.g. debugging invite flow"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleImpersonate}
              disabled={impLoading || !impUserId}
              className="w-full sm:w-auto"
            >
              {impLoading ? "Starting…" : "Start Impersonation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
