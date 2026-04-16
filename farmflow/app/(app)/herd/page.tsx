import Link from "next/link"
import { redirect } from "next/navigation"
import { getTenant } from "@/lib/tenant"
import { db } from "@/lib/db"
import { animals } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"

function statusBadgeClass(status: string | null) {
  const s = (status ?? "").toLowerCase()
  if (s === "active")
    return "border-green-200 bg-green-50 text-green-700"
  if (s === "dry")
    return "border-sky-200 bg-sky-50 text-sky-700"
  if (s === "heifer" || s === "gilt")
    return "border-violet-200 bg-violet-50 text-violet-700"
  return ""
}

export default async function HerdPage() {
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

  return (
    <>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#e8ede8] bg-white/90 px-4 py-3 backdrop-blur-sm sm:px-6">
        <h1 className="font-sans text-2xl font-bold tracking-tight text-[#0f1f0f]">
          Herd
        </h1>
      </header>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6 sm:px-6">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-muted-foreground">No animals yet</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 sm:hidden">
              {rows.map((a) => (
                <Link
                  key={a.id}
                  href={`/herd/${a.id}`}
                  className="block rounded-xl border border-[#e8ede8] bg-white p-4 transition-shadow hover:shadow-md"
                >
                  <p className="font-medium text-[#0f1f0f]">{a.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.species}
                    {a.sex ? ` · ${a.sex}` : ""}
                  </p>
                  {a.status && (
                    <Badge
                      variant="outline"
                      className={cn("mt-2 capitalize", statusBadgeClass(a.status))}
                    >
                      {a.status}
                    </Badge>
                  )}
                </Link>
              ))}
            </div>
            <div className="hidden sm:block">
              <div className="overflow-hidden rounded-xl border border-[#e8ede8] bg-white">
                <Table className="w-full table-fixed text-sm">
                  <TableHeader>
                    <TableRow className="border-[#e8ede8] hover:bg-transparent">
                      <TableHead className="h-11 w-[30%] pl-4 font-sans font-semibold text-[#0f1f0f]">
                        Name
                      </TableHead>
                      <TableHead className="w-[22%] font-sans font-semibold text-[#0f1f0f]">
                        Species
                      </TableHead>
                      <TableHead className="w-16 font-sans font-semibold text-[#0f1f0f]">
                        Sex
                      </TableHead>
                      <TableHead className="w-[28%] font-sans font-semibold text-[#0f1f0f]">
                        Status
                      </TableHead>
                      <TableHead className="w-[120px] pr-4 text-right font-sans font-semibold text-[#0f1f0f]">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((a) => (
                      <TableRow
                        key={a.id}
                        className="border-[#e8ede8] odd:bg-[#fafcfa]"
                      >
                        <TableCell className="pl-4 font-medium text-[#0f1f0f]">
                          {a.name}
                        </TableCell>
                        <TableCell className="truncate text-muted-foreground">
                          {a.species}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {a.sex ?? "—"}
                        </TableCell>
                        <TableCell>
                          {a.status && (
                            <Badge
                              variant="outline"
                              className={cn(
                                "capitalize",
                                statusBadgeClass(a.status)
                              )}
                            >
                              {a.status}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="pr-4 text-right">
                          <Link
                            href={`/herd/${a.id}`}
                            className={cn(
                              buttonVariants({ variant: "outline", size: "sm" }),
                              "inline-flex min-h-11 min-w-[5.5rem] items-center justify-center border-[#e8ede8] bg-white font-semibold text-[#166534] shadow-none transition-colors",
                              "hover:border-[#166534]/35 hover:bg-[#e8f5e8] hover:text-[#14532d]",
                              "focus-visible:ring-2 focus-visible:ring-[#166534]/25"
                            )}
                          >
                            View
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
