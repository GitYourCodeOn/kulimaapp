import { redirect } from "next/navigation"
import { getTenant } from "@/lib/tenant"
import { db } from "@/lib/db"
import { animals } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import type { InbreedingAnimal } from "@/lib/inbreeding"
import { InbreedingChecker } from "@/components/lineage/InbreedingChecker"

function mapRow(row: typeof animals.$inferSelect): InbreedingAnimal {
  return {
    id: row.id,
    name: row.name,
    sireId: row.sireId ?? null,
    damId: row.damId ?? null,
    sex: row.sex ?? null,
  }
}

export default async function BreedingPage() {
  let tenant
  try {
    tenant = await getTenant()
  } catch {
    redirect("/login")
  }

  const rows = await db
    .select()
    .from(animals)
    .where(eq(animals.farmId, tenant.farmId))

  const mapped = rows.map(mapRow)

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#e8ede8] bg-white/90 px-4 py-3 backdrop-blur-sm sm:px-6">
        <h1 className="text-2xl font-bold tracking-tight text-[#0f1f0f]">
          Breeding
        </h1>
      </header>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6">
        <p className="text-sm text-muted-foreground">
          Select a male and female to check inbreeding risk before recording a
          mating. Logic matches the farmflow wireframe (three generations, EXT_
          parents excluded from lineage).
        </p>
        <InbreedingChecker animals={mapped} title="Inbreeding check" />
      </div>
    </>
  )
}
