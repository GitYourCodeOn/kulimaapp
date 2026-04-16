"use client"

import type { InbreedingLevel } from "@/lib/inbreeding"
import { Card, CardContent } from "@/components/ui/card"

const styles: Record<
  InbreedingLevel,
  { card: string; title: string }
> = {
  critical: {
    card: "border-red-300 bg-red-50",
    title: "text-red-800",
  },
  warning: {
    card: "border-amber-300 bg-amber-50",
    title: "text-amber-800",
  },
  safe: {
    card: "border-green-300 bg-green-50",
    title: "text-green-700",
  },
}

interface Props {
  level: InbreedingLevel
  msg: string
  commonAncestors: string[]
}

export function InbreedingBanner({ level, msg, commonAncestors }: Props) {
  const t = styles[level]

  return (
    <Card className={`border-2 ${t.card}`}>
      <CardContent className="space-y-2 pt-6">
        <p className={`text-sm font-medium ${t.title}`}>{msg}</p>
        {commonAncestors.length > 0 && (
          <ul className="list-inside list-disc text-xs text-muted-foreground">
            {commonAncestors.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
