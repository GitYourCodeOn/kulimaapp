"use client"

import Link from "next/link"
import { getOffspring, type InbreedingAnimal } from "@/lib/inbreeding"
import { buttonVariants } from "@/components/ui/button-variants"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface Props {
  animal: InbreedingAnimal
  animals: InbreedingAnimal[]
  /** Farm animal ids — parents off-farm are not in this set */
  farmAnimalIds: Set<string>
}

function ParentRow({
  label,
  parentId,
  farmAnimalIds,
  animals,
}: {
  label: string
  parentId: string | null
  farmAnimalIds: Set<string>
  animals: InbreedingAnimal[]
}) {
  if (!parentId) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className="text-sm text-muted-foreground">—</span>
      </div>
    )
  }

  const ext = parentId.startsWith("EXT_")
  const onFarm = !ext && farmAnimalIds.has(parentId)
  const record = animals.find((a) => a.id === parentId)

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      {ext ? (
        <Badge variant="outline" className="font-normal text-muted-foreground">
          External ({parentId.replace(/^EXT_/, "") || "record"})
        </Badge>
      ) : onFarm && record ? (
        <Link
          href={`/herd/${parentId}`}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "inline-flex min-h-11 max-w-full items-center px-2 py-1 text-left"
          )}
        >
          {record.name}
        </Link>
      ) : (
        <span className="text-sm text-muted-foreground">
          {record?.name ?? parentId}
        </span>
      )}
    </div>
  )
}

export function LineageSection({ animal, animals, farmAnimalIds }: Props) {
  const offspring = getOffspring(animal.id, animals)

  return (
    <section className="space-y-4 rounded-xl border border-[#e8ede8] bg-white p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-[#0f1f0f]">Lineage</h3>

      <div className="space-y-3">
        <ParentRow
          label="Sire"
          parentId={animal.sireId}
          farmAnimalIds={farmAnimalIds}
          animals={animals}
        />
        <ParentRow
          label="Dam"
          parentId={animal.damId}
          farmAnimalIds={farmAnimalIds}
          animals={animals}
        />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Offspring
        </p>
        {offspring.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recorded offspring</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {offspring.map((o) => (
              <Link
                key={o.id}
                href={`/herd/${o.id}`}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "min-h-11 rounded-full"
                )}
              >
                {o.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
