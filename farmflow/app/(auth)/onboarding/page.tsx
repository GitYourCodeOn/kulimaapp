"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
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

const FARMING_TYPES = [
  { id: "dairy", label: "Dairy Cattle", icon: "🐄", desc: "Milk production, breeding, herd management" },
  { id: "pigs", label: "Pig Farming", icon: "🐷", desc: "Sows, boars, piglets, farrowing" },
  { id: "chickens", label: "Poultry", icon: "🐔", desc: "Layers, broilers, breeding flocks" },
  { id: "crops", label: "Crop Farming", icon: "🌾", desc: "Fields, planting, harvest tracking" },
] as const

interface Farm {
  id: string
  name: string
  farmingType: string
  location: string | null
  sizeHa: number | null
}

export default function OnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState(0)

  const [farm, setFarm] = useState<Farm | null>(null)
  const [farmingType, setFarmingType] = useState("")

  // Step 3 fields
  const [firstName, setFirstName] = useState("")
  const [breed, setBreed] = useState("")
  const [animalRole, setAnimalRole] = useState("")
  const [crop, setCrop] = useState("")
  const [flockType, setFlockType] = useState("")

  const checkOnboarding = useCallback(async () => {
    try {
      const res = await fetch("/api/onboarding")
      if (!res.ok) {
        router.push("/login")
        return
      }
      const data = await res.json()
      if (!data.needsOnboarding) {
        router.push("/dashboard")
        return
      }
      if (data.step === "first-entry" && data.farm) {
        setFarm(data.farm)
        setFarmingType(data.farm.farmingType)
        setStep(2)
      }
    } catch {
      router.push("/login")
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    checkOnboarding()
  }, [checkOnboarding])

  async function handleComplete() {
    if (!firstName) {
      toast.error("Please enter a name")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farmingType,
          name: firstName,
          breed: breed || undefined,
          role: animalRole || undefined,
          crop: crop || undefined,
          type: flockType || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error ?? "Something went wrong")
        return
      }

      toast.success("You're all set!")
      router.push("/dashboard")
    } catch {
      toast.error("Network error — please try again")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#052e16] via-[#166534] to-[#15803d]">
        <p className="text-white/60">Loading…</p>
      </div>
    )
  }

  const steps = ["Farm Type", "Farm Details", "First Entry"]
  const ft = farmingType

  const entryLabel =
    ft === "crops"
      ? "field"
      : ft === "chickens"
        ? "flock"
        : "animal"

  const nameLabel =
    ft === "crops"
      ? "Field Name"
      : ft === "chickens"
        ? "Flock Name"
        : "Name / Tag"

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#052e16] via-[#166534] to-[#15803d] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-1 text-4xl">🌾</div>
          <h2 className="text-xl font-bold tracking-tight text-[#0f1f0f]">
            Set Up Your Farm
          </h2>
          <p className="text-xs text-muted-foreground">
            Step {step + 1} of {steps.length} — {steps[step]}
          </p>

          {/* Progress bar */}
          <div className="mt-3 flex items-center justify-center gap-1">
            {steps.map((_, i) => (
              <div
                key={i}
                className="h-1 rounded-full transition-all duration-200"
                style={{
                  width: i <= step ? 36 : 20,
                  background: i <= step ? "#166534" : "#e8ede8",
                }}
              />
            ))}
          </div>
        </CardHeader>

        <CardContent>
          {/* Step 1: Farm Type */}
          {step === 0 && (
            <div className="space-y-2">
              {FARMING_TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setFarmingType(t.id)}
                  className={`flex w-full items-center gap-3 rounded-xl border-[1.5px] p-3 text-left transition-all ${
                    farmingType === t.id
                      ? "border-[#166534] bg-green-50"
                      : "border-[#e8ede8] bg-white hover:border-[#c4d9c4]"
                  }`}
                >
                  <span className="text-2xl">{t.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-[#0f1f0f]">
                      {t.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{t.desc}</p>
                  </div>
                </button>
              ))}
              <Button
                className="mt-4 w-full"
                disabled={!farmingType}
                onClick={() => setStep(1)}
              >
                Next
              </Button>
            </div>
          )}

          {/* Step 2: Farm Details */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ob-farm-name">Farm Name</Label>
                <Input
                  id="ob-farm-name"
                  value={farm?.name ?? ""}
                  onChange={(e) =>
                    setFarm((prev) =>
                      prev ? { ...prev, name: e.target.value } : null
                    )
                  }
                  placeholder="e.g. Sunrise Farm"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ob-location">Location / Region</Label>
                <Input
                  id="ob-location"
                  value={farm?.location ?? ""}
                  onChange={(e) =>
                    setFarm((prev) =>
                      prev
                        ? { ...prev, location: e.target.value }
                        : null
                    )
                  }
                  placeholder="e.g. Free State, SA"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ob-size">Farm Size (ha)</Label>
                <Input
                  id="ob-size"
                  type="number"
                  step="0.1"
                  value={farm?.sizeHa?.toString() ?? ""}
                  onChange={(e) =>
                    setFarm((prev) =>
                      prev
                        ? {
                            ...prev,
                            sizeHa: e.target.value
                              ? parseFloat(e.target.value)
                              : null,
                          }
                        : null
                    )
                  }
                  placeholder="e.g. 120"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep(0)}>
                  Back
                </Button>
                <Button className="flex-1" onClick={() => setStep(2)}>
                  Next
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: First Entry */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Add your first {entryLabel} to get started.
              </p>

              <div className="space-y-2">
                <Label htmlFor="ob-name">{nameLabel}</Label>
                <Input
                  id="ob-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder={
                    ft === "crops"
                      ? "e.g. North Field"
                      : ft === "chickens"
                        ? "e.g. Flock A"
                        : "e.g. Bella"
                  }
                  required
                />
              </div>

              {ft === "dairy" && (
                <div className="space-y-2">
                  <Label htmlFor="ob-breed">Breed</Label>
                  <Input
                    id="ob-breed"
                    value={breed}
                    onChange={(e) => setBreed(e.target.value)}
                    placeholder="e.g. Holstein"
                  />
                </div>
              )}

              {ft === "pigs" && (
                <div className="space-y-2">
                  <Label htmlFor="ob-role">Role</Label>
                  <Select value={animalRole} onValueChange={(v) => setAnimalRole(v ?? "")}>
                    <SelectTrigger id="ob-role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Sow", "Gilt", "Boar", "Piglet"].map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {ft === "chickens" && (
                <div className="space-y-2">
                  <Label htmlFor="ob-ftype">Type</Label>
                  <Select value={flockType} onValueChange={(v) => setFlockType(v ?? "")}>
                    <SelectTrigger id="ob-ftype">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {["Layer", "Broiler", "Breeder"].map((t) => (
                        <SelectItem key={t} value={t}>
                          {t === "Layer"
                            ? "Layer Flock"
                            : t === "Broiler"
                              ? "Broiler Batch"
                              : "Breeding Bird"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {ft === "crops" && (
                <div className="space-y-2">
                  <Label htmlFor="ob-crop">Crop</Label>
                  <Select value={crop} onValueChange={(v) => setCrop(v ?? "")}>
                    <SelectTrigger id="ob-crop">
                      <SelectValue placeholder="Select crop" />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        "Maize",
                        "Soybeans",
                        "Sunflower",
                        "Vegetables",
                        "Wheat",
                        "Other",
                      ].map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex gap-2">
                {!farm && (
                  <Button variant="outline" onClick={() => setStep(1)}>
                    Back
                  </Button>
                )}
                <Button
                  className="flex-1"
                  disabled={saving || !firstName}
                  onClick={handleComplete}
                >
                  {saving ? "Setting up…" : "Launch FarmFlow"}
                </Button>
              </div>

              <button
                onClick={() => router.push("/dashboard")}
                className="w-full text-center text-xs text-muted-foreground hover:text-[#166534]"
              >
                Skip for now
              </button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
