"use client"

import { useMemo, useState } from "react"
import type { InbreedingAnimal } from "@/lib/inbreeding"
import { useInbreeding } from "@/hooks/use-inbreeding"
import { InbreedingBanner } from "@/components/lineage/InbreedingBanner"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type SexFilter = "M" | "F" | null

interface Props {
  animals: InbreedingAnimal[]
  /** Restrict male dropdown to M and female to F when set */
  maleSex?: SexFilter
  femaleSex?: SexFilter
  title?: string
}

export function InbreedingChecker({
  animals,
  maleSex = "M",
  femaleSex = "F",
  title = "Inbreeding check",
}: Props) {
  const males = useMemo(
    () =>
      animals.filter((a) =>
        !maleSex || a.sex == null || a.sex === maleSex
      ),
    [animals, maleSex]
  )
  const females = useMemo(
    () =>
      animals.filter((a) =>
        !femaleSex || a.sex == null || a.sex === femaleSex
      ),
    [animals, femaleSex]
  )

  const [maleId, setMaleId] = useState("")
  const [femaleId, setFemaleId] = useState("")

  const result = useInbreeding(maleId, femaleId, animals)

  if (animals.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Add animals to your herd first (with sex recorded for clearer male/female
            lists).
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {(males.length === 0 || females.length === 0) && (
          <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Some lists are empty — set animal sex (M/F) in the database or include
            animals without sex in both lists for manual selection.
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="inb-male">Male / sire side</Label>
            <Select
              value={maleId || undefined}
              onValueChange={(v) => setMaleId(v ?? "")}
            >
              <SelectTrigger id="inb-male" className="min-h-11 w-full">
                <SelectValue placeholder="Select male" />
              </SelectTrigger>
              <SelectContent>
                {males.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="inb-female">Female / dam side</Label>
            <Select
              value={femaleId || undefined}
              onValueChange={(v) => setFemaleId(v ?? "")}
            >
              <SelectTrigger id="inb-female" className="min-h-11 w-full">
                <SelectValue placeholder="Select female" />
              </SelectTrigger>
              <SelectContent>
                {females.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {maleId && femaleId && result && (
          <InbreedingBanner
            level={result.level}
            msg={result.msg}
            commonAncestors={result.commonAncestors}
          />
        )}

        {maleId && femaleId && !result && (
          <p className="text-sm text-muted-foreground">
            Could not evaluate pairing — check both animals exist.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
