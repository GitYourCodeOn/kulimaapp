"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Farm {
  id: string
  name: string
  ownerId: string
  farmingType: "dairy" | "pigs" | "chickens" | "crops"
  location: string | null
  sizeHa: number | null
  createdAt: string
}

interface Props {
  farm: Farm
  onRefresh: () => Promise<void>
}

const farmingTypeLabels: Record<string, string> = {
  dairy: "Dairy Cattle",
  pigs: "Pig Farming",
  chickens: "Poultry",
  crops: "Crop Farming",
}

export function FarmSettings({ farm, onRefresh }: Props) {
  const router = useRouter()

  const [name, setName] = useState(farm.name)
  const [location, setLocation] = useState(farm.location ?? "")
  const [sizeHa, setSizeHa] = useState(farm.sizeHa?.toString() ?? "")
  const [farmingType, setFarmingType] = useState(farm.farmingType)
  const [saving, setSaving] = useState(false)

  const [confirmName, setConfirmName] = useState("")
  const [deleting, setDeleting] = useState(false)

  const hasChanges =
    name !== farm.name ||
    location !== (farm.location ?? "") ||
    sizeHa !== (farm.sizeHa?.toString() ?? "") ||
    farmingType !== farm.farmingType

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/farm", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          location: location || null,
          sizeHa: sizeHa ? parseFloat(sizeHa) : null,
          farmingType,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? "Failed to save")
        return
      }
      toast.success("Farm settings updated")
      await onRefresh()
    } catch {
      toast.error("Network error")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      const res = await fetch("/api/admin/farm", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmName }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? "Failed to deactivate farm")
        return
      }
      toast.success("Farm deactivated")
      router.push("/login")
    } catch {
      toast.error("Network error")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Farm Details</CardTitle>
          <CardDescription>
            Update your farm&apos;s basic information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="farm-name">Farm Name</Label>
              <Input
                id="farm-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="farm-type">Farming Type</Label>
              <Select
                value={farmingType}
                onValueChange={(v) =>
                  setFarmingType(v as Farm["farmingType"])
                }
              >
                <SelectTrigger id="farm-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(farmingTypeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="farm-location">Location / Region</Label>
              <Input
                id="farm-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Free State, SA"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="farm-size">Size (hectares)</Label>
              <Input
                id="farm-size"
                type="number"
                step="0.1"
                value={sizeHa}
                onChange={(e) => setSizeHa(e.target.value)}
                placeholder="e.g. 120"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={!hasChanges || saving}>
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions — proceed with extreme caution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Deactivate Farm</p>
              <p className="text-xs text-muted-foreground">
                This will soft-delete the farm and revoke all user access.
              </p>
            </div>
            <AlertDialog>
              <AlertDialogTrigger
                render={<Button variant="destructive" size="sm" />}
              >
                Deactivate Farm
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Deactivate &ldquo;{farm.name}&rdquo;?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. All farm data will become
                    inaccessible and all team members will lose access. Type the
                    farm name below to confirm.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-2 py-2">
                  <Label htmlFor="confirm-name">
                    Type <strong>{farm.name}</strong> to confirm
                  </Label>
                  <Input
                    id="confirm-name"
                    value={confirmName}
                    onChange={(e) => setConfirmName(e.target.value)}
                    placeholder={farm.name}
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setConfirmName("")}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    disabled={confirmName !== farm.name || deleting}
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? "Deactivating…" : "Deactivate Farm"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
