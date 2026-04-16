import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { getTenant } from "@/lib/tenant"
import { db } from "@/lib/db"
import { animals } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import type { InbreedingAnimal } from "@/lib/inbreeding"
import { LineageSection } from "@/components/lineage/LineageSection"
import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"

function mapRow(row: typeof animals.$inferSelect): InbreedingAnimal {
  return {
    id: row.id,
    name: row.name,
    sireId: row.sireId ?? null,
    damId: row.damId ?? null,
    sex: row.sex ?? null,
  }
}

export default async function AnimalDetailPage({
  params,
}: {
  params: Promise<{ animalId: string }>
}) {
  let tenant
  try {
    tenant = await getTenant()
  } catch {
    redirect("/login")
  }

  const { animalId } = await params

  const [row] = await db
    .select()
    .from(animals)
    .where(and(eq(animals.id, animalId), eq(animals.farmId, tenant.farmId)))
    .limit(1)

  if (!row) notFound()

  const allRows = await db
    .select()
    .from(animals)
    .where(eq(animals.farmId, tenant.farmId))

  const mapped = allRows.map(mapRow)
  const farmAnimalIds = new Set(allRows.map((a) => a.id))
  const animal = mapRow(row)

  return (
    <>
      <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-2 border-b border-[#e8ede8] bg-white/90 px-4 py-3 backdrop-blur-sm sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/herd"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "shrink-0 min-h-11"
            )}
          >
            ← Herd
          </Link>
          <h1 className="truncate text-xl font-bold tracking-tight text-[#0f1f0f] sm:text-2xl">
            {row.name}
          </h1>
        </div>
      </header>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{row.species}</Badge>
          {row.sex && <Badge variant="outline">{row.sex}</Badge>}
          {row.status && (
            <Badge variant="outline" className="capitalize">
              {row.status}
            </Badge>
          )}
        </div>
        {(row.breed || row.dob) && (
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            {row.breed && (
              <>
                <dt className="text-muted-foreground">Breed</dt>
                <dd>{row.breed}</dd>
              </>
            )}
            {row.dob && (
              <>
                <dt className="text-muted-foreground">Date of birth</dt>
                <dd>{row.dob}</dd>
              </>
            )}
          </dl>
        )}
        {row.notes && (
          <p className="text-sm text-muted-foreground">{row.notes}</p>
        )}

        <LineageSection
          animal={animal}
          animals={mapped}
          farmAnimalIds={farmAnimalIds}
        />
      </div>
    </>
  )
}
