"use client"

import { useEffect, useCallback } from "react"
import { useSession } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  Stethoscope,
  Heart,
  Package,
  MoreVertical,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()

  const fetchUser = useCallback(async () => {
    try {
      const [meRes, onboardRes] = await Promise.all([
        fetch("/api/me"),
        fetch("/api/onboarding"),
      ])

      if (meRes.ok) {
        const data = await meRes.json()
        if (data.isSuperadmin && !data.farmId) {
          router.push("/platform")
          return
        }
      }

      if (onboardRes.ok) {
        const data = await onboardRes.json()
        if (data.needsOnboarding) {
          router.push("/onboarding")
          return
        }
      }
    } catch {
      /* non-critical */
    }
  }, [router])

  useEffect(() => {
    if (!session?.user) return
    void fetchUser()
  }, [session?.user, fetchUser])

  useEffect(() => {
    if (isPending) return
    if (!session) {
      router.replace("/login")
    }
  }, [isPending, session, router])

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Redirecting…</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl space-y-10 p-6 md:p-10">
      {/* ── Hero Heading ── */}
      <div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#166534]">
          Operations Centre
        </span>
        <h2 className="mt-1 text-4xl font-extrabold tracking-tight text-[#0f1f0f] md:text-5xl">
          Dashboard
        </h2>
      </div>

      {/* ── Top Stat Row ── */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active Cows"
          value="22"
          unit="Head"
          trend="up"
          trendValue="2%"
          sparkPath="M0 15 Q 10 5, 20 12 T 40 8 T 60 15 T 80 5 T 100 10"
        />
        <StatCard
          label="Daily Yield"
          value="855L"
          trend="up"
          trendValue="4%"
          sparkPath="M0 10 Q 10 15, 20 5 T 40 12 T 60 8 T 80 15 T 100 5"
        />
        <StatCard
          label="Avg Days in Milk"
          value="87"
          unit="Days"
          trend="stable"
          trendValue="Stable"
          sparkPath="M0 10 L 20 10 L 40 10 L 60 10 L 80 10 L 100 10"
        />
        <StatCard
          label="Fat %"
          value="4.1%"
          trend="down"
          trendValue="0.2%"
          sparkPath="M0 5 Q 10 12, 20 8 T 40 15 T 60 10 T 80 18 T 100 20"
        />
      </div>

      {/* ── Charts Section ── */}
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        {/* Area Chart — Milk Production */}
        <Card className="rounded-3xl border-0 bg-white p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-[#0f1f0f]">
                Milk Production
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Daily trend (Past 7 Days)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-[#166534]" />
              <span className="text-[10px] font-bold uppercase text-muted-foreground">
                Litres
              </span>
            </div>
          </div>
          <div className="relative h-[280px] w-full">
            <svg
              className="h-full w-full overflow-visible"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#166534" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#166534" stopOpacity={0} />
                </linearGradient>
              </defs>
              <line x1="0" x2="100" y1="25" y2="25" stroke="#e8ede8" strokeWidth="0.15" />
              <line x1="0" x2="100" y1="50" y2="50" stroke="#e8ede8" strokeWidth="0.15" />
              <line x1="0" x2="100" y1="75" y2="75" stroke="#e8ede8" strokeWidth="0.15" />
              <path
                d="M0 80 Q 15 70, 25 75 T 40 60 T 60 50 T 80 45 T 100 40 V 100 H 0 Z"
                fill="url(#areaGrad)"
              />
              <path
                d="M0 80 Q 15 70, 25 75 T 40 60 T 60 50 T 80 45 T 100 40"
                fill="none"
                stroke="#166534"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
              <circle cx="100" cy="40" r="1.5" fill="#166534" />
            </svg>
            <div className="mt-4 flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </div>
        </Card>

        {/* Bar Chart — Monthly Volumes */}
        <Card className="rounded-3xl border-0 bg-white p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-[#0f1f0f]">
                Monthly Volumes
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Total yields by calendar month
              </p>
            </div>
            <Button variant="ghost" size="icon" className="text-muted-foreground">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex h-[280px] items-end justify-between gap-2 px-2">
            {[60, 45, 75, 65, 90, 85].map((h, i) => (
              <div
                key={i}
                className={`group relative flex-1 rounded-t-lg transition-all ${
                  i === 5 ? "bg-[#166534]" : "bg-[#e8ede8]"
                }`}
                style={{ height: `${h}%` }}
              >
                {i !== 5 && (
                  <div className="absolute inset-0 origin-bottom scale-y-0 rounded-t-lg bg-[#166534]/20 transition-transform duration-300 group-hover:scale-y-100" />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            <span>Jan</span>
            <span>Feb</span>
            <span>Mar</span>
            <span>Apr</span>
            <span>May</span>
            <span>Jun</span>
          </div>
        </Card>
      </div>

      {/* ── Bottom Section: Herd Status & Alerts ── */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Herd Status (Donut) */}
        <Card className="flex flex-col items-center rounded-3xl border-0 bg-white p-8">
          <div className="mb-6 w-full text-left">
            <h3 className="text-xl font-bold tracking-tight text-[#0f1f0f]">
              Herd Status
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Current lifecycle split
            </p>
          </div>
          <div className="relative mb-8 h-48 w-48">
            <svg className="-rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="16" fill="none" stroke="#f2f4f2" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="16" fill="none"
                stroke="#166534" strokeWidth="3"
                strokeDasharray="65, 100"
              />
              <circle
                cx="18" cy="18" r="16" fill="none"
                stroke="#49654d" strokeWidth="3"
                strokeDasharray="20, 100"
                strokeDashoffset="-65"
              />
              <circle
                cx="18" cy="18" r="16" fill="none"
                stroke="#afceb1" strokeWidth="3"
                strokeDasharray="15, 100"
                strokeDashoffset="-85"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold tracking-tight text-[#0f1f0f]">
                104
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Total
              </span>
            </div>
          </div>
          <div className="w-full space-y-3">
            <LegendRow colour="bg-[#166534]" label="Active" value={68} />
            <LegendRow colour="bg-[#49654d]" label="Dry" value={21} />
            <LegendRow colour="bg-[#afceb1]" label="Heifers" value={15} />
          </div>
        </Card>

        {/* Alerts Panel */}
        <Card className="rounded-3xl border-0 bg-white p-8 lg:col-span-2">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-[#0f1f0f]">
                Critical Alerts
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Pending actions &amp; health notices
              </p>
            </div>
            <button className="text-xs font-bold uppercase tracking-widest text-[#166534]">
              Mark all read
            </button>
          </div>
          <div className="space-y-4">
            {/* Alert 1 — Error severity */}
            <div className="flex items-start gap-4 rounded-2xl border-l-4 border-red-600 bg-red-50/50 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <Stethoscope className="h-5 w-5 text-red-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <h4 className="text-sm font-bold text-[#0f1f0f]">
                    Low Activity Warning
                  </h4>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">
                    Now
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Cow #1028 showing 40% drop in movement. Potential health risk.
                </p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" className="h-7 bg-red-600 px-3 text-[10px] font-bold uppercase tracking-widest hover:bg-red-700">
                    Dispatch Vet
                  </Button>
                  <Button size="sm" variant="secondary" className="h-7 px-3 text-[10px] font-bold uppercase tracking-widest">
                    Ignore
                  </Button>
                </div>
              </div>
            </div>

            {/* Alert 2 — Breeding severity */}
            <div className="flex items-start gap-4 rounded-2xl border-l-4 border-rose-700 bg-rose-50/30 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100">
                <Heart className="h-5 w-5 text-rose-700" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <h4 className="text-sm font-bold text-[#0f1f0f]">
                    Estrous Detection
                  </h4>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">
                    2h ago
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Cow #0942 entering peak fertility window. 12 hours remaining for AI.
                </p>
                <div className="mt-3">
                  <Button size="sm" className="h-7 bg-rose-700 px-3 text-[10px] font-bold uppercase tracking-widest hover:bg-rose-800">
                    Log Insemination
                  </Button>
                </div>
              </div>
            </div>

            {/* Alert 3 — Info severity */}
            <div className="flex items-start gap-4 rounded-2xl border-l-4 border-[#e8ede8] bg-[#f2f4f2] p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8ede8]">
                <Package className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <h4 className="text-sm font-bold text-[#0f1f0f]">
                    Feed Supply Update
                  </h4>
                  <span className="text-[10px] font-bold uppercase text-muted-foreground">
                    6h ago
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Silo B-4 (High Protein Mix) is at 15% capacity. Reorder suggested.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* ── FAB (quick add) ── */}
      <Button
        size="icon"
        className="fixed bottom-24 right-6 z-40 h-14 w-14 rounded-2xl bg-[#166534] shadow-2xl transition-transform active:scale-90 hover:bg-[#166534]/90 md:bottom-8 md:right-8"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  )
}

/* ── Sub-components ── */

function StatCard({
  label,
  value,
  unit,
  trend,
  trendValue,
  sparkPath,
}: {
  label: string
  value: string
  unit?: string
  trend: "up" | "down" | "stable"
  trendValue: string
  sparkPath: string
}) {
  const trendColour =
    trend === "up"
      ? "text-[#166534] bg-green-50"
      : trend === "down"
        ? "text-red-600 bg-red-50"
        : "text-muted-foreground bg-[#e8ede8]"

  const TrendIcon =
    trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus

  const sparkStroke =
    trend === "down" ? "#dc2626" : trend === "stable" ? "#6b7280" : "#166534"

  return (
    <Card className="rounded-2xl border-0 bg-white p-6 transition-all hover:-translate-y-0.5">
      <div className="mb-4 flex items-start justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <Badge
          variant="secondary"
          className={`gap-0.5 rounded-full px-2 py-0.5 text-xs font-bold ${trendColour}`}
        >
          <TrendIcon className="h-3 w-3" />
          {trendValue}
        </Badge>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-4xl font-extrabold tracking-tight text-[#0f1f0f]">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-medium text-muted-foreground">{unit}</span>
        )}
      </div>
      <div className="mt-4 h-6 w-full opacity-40">
        <svg className="h-full w-full" viewBox="0 0 100 20" preserveAspectRatio="none">
          <path
            d={sparkPath}
            fill="none"
            stroke={sparkStroke}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    </Card>
  )
}

function LegendRow({
  colour,
  label,
  value,
}: {
  colour: string
  label: string
  value: number
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={`h-2 w-2 rounded-full ${colour}`} />
        <span className="text-sm font-medium text-[#0f1f0f]">{label}</span>
      </div>
      <span className="text-sm font-bold text-[#0f1f0f]">{value}</span>
    </div>
  )
}
