"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signUp } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const FARMING_TYPES = [
  { id: "dairy", label: "Dairy Farming", icon: "🐄" },
  { id: "pigs", label: "Pig Farming", icon: "🐷" },
  { id: "chickens", label: "Poultry / Chickens", icon: "🐔" },
  { id: "crops", label: "Crop Farming", icon: "🌾" },
] as const

export default function RegisterPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [farmingType, setFarmingType] = useState("")

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const name = form.get("name") as string
    const email = form.get("email") as string
    const password = form.get("password") as string
    const farmName = form.get("farmName") as string
    const location = form.get("location") as string

    if (!farmingType) {
      setError("Please select a farming type.")
      setLoading(false)
      return
    }

    try {
      const { error: authError } = await signUp.email({
        name,
        email,
        password,
      })

      if (authError) {
        setError(authError.message ?? "Registration failed.")
        setLoading(false)
        return
      }

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ farmName, farmingType, location }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Failed to create farm.")
        setLoading(false)
        return
      }

      router.push("/onboarding")
    } catch {
      setError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f9f7] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-[#166534]">
            Create your farm
          </CardTitle>
          <CardDescription>
            Set up your FarmFlow account and farm in one step.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g. John Moyo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                minLength={8}
                placeholder="Minimum 8 characters"
                required
              />
            </div>

            <div className="h-px bg-border" />

            <div className="space-y-2">
              <Label htmlFor="farmName">Farm name</Label>
              <Input
                id="farmName"
                name="farmName"
                placeholder="e.g. Sunrise Farm"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Farming type</Label>
              <Select value={farmingType} onValueChange={(v) => setFarmingType(v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Select farming type" />
                </SelectTrigger>
                <SelectContent>
                  {FARMING_TYPES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.icon} {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location (optional)</Label>
              <Input
                id="location"
                name="location"
                placeholder="e.g. Harare, Zimbabwe"
              />
            </div>

            {error && (
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#166534] hover:bg-[#14532d]"
              size="lg"
            >
              {loading ? "Creating..." : "Create account & farm"}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-[#166534] hover:underline"
              >
                Sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
