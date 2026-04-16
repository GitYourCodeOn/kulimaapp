/**
 * Ported from farmflow-v2.html — keep logic in sync with the wireframe.
 * External parents use sireId/damId prefixed EXT_ and are skipped in lineage traversal.
 */

export type InbreedingLevel = "critical" | "warning" | "safe"

export interface InbreedingAnimal {
  id: string
  name: string
  sireId: string | null
  damId: string | null
  /** Optional — used by UI to filter male/female selectors */
  sex?: "M" | "F" | null
}

export interface InbreedingResult {
  level: InbreedingLevel
  msg: string
  commonAncestors: string[]
}

function isExt(id: string | null | undefined): boolean {
  return !id || id.startsWith("EXT_")
}

export function getLineage(
  id: string | null | undefined,
  animals: InbreedingAnimal[],
  depth = 3,
  visited: Set<string> = new Set()
): Set<string> {
  if (!id || depth === 0 || visited.has(id)) return new Set()
  visited.add(id)
  const a = animals.find((x) => x.id === id)
  if (!a) return new Set()
  const s = new Set<string>()
  const parents = [a.sireId, a.damId].filter(
    (x): x is string => !!x && !x.startsWith("EXT_")
  )
  for (const pid of parents) {
    s.add(pid)
    getLineage(pid, animals, depth - 1, new Set(visited)).forEach((x) => s.add(x))
  }
  return s
}

export function getOffspring(
  id: string,
  animals: InbreedingAnimal[]
): InbreedingAnimal[] {
  return animals.filter((a) => a.sireId === id || a.damId === id)
}

export function inbreedingCheck(
  maleId: string,
  femaleId: string,
  animals: InbreedingAnimal[]
): InbreedingResult | null {
  if (!maleId || !femaleId || maleId === femaleId) return null

  const male = animals.find((a) => a.id === maleId)
  const female = animals.find((a) => a.id === femaleId)
  if (!male || !female) return null

  if (
    male.id === female.sireId ||
    male.id === female.damId ||
    female.id === male.sireId ||
    female.id === male.damId
  ) {
    return {
      level: "critical",
      msg: "⛔ Parent–offspring pairing — do NOT breed.",
      commonAncestors: [],
    }
  }

  const shS =
    !isExt(male.sireId) &&
    !isExt(female.sireId) &&
    male.sireId === female.sireId
  const shD =
    !isExt(male.damId) &&
    !isExt(female.damId) &&
    male.damId === female.damId

  if (shS && shD) {
    return {
      level: "critical",
      msg: "⛔ Full siblings — share both parents. Do NOT breed.",
      commonAncestors: [],
    }
  }

  if (shS) {
    const p = animals.find((x) => x.id === male.sireId)
    return {
      level: "critical",
      msg: `⛔ Half siblings — same sire (${p?.name ?? male.sireId}). Do NOT breed.`,
      commonAncestors: [],
    }
  }

  if (shD) {
    const p = animals.find((x) => x.id === male.damId)
    return {
      level: "critical",
      msg: `⛔ Half siblings — same dam (${p?.name ?? male.damId}). Do NOT breed.`,
      commonAncestors: [],
    }
  }

  const mL = getLineage(maleId, animals, 3)
  const fL = getLineage(femaleId, animals, 3)
  const commonIds = [...mL].filter((id) => fL.has(id))
  const common = commonIds
    .map((id) => animals.find((a) => a.id === id))
    .filter(Boolean) as InbreedingAnimal[]

  if (common.length > 0) {
    const names = common.map((a) => a.name)
    return {
      level: "warning",
      msg: `⚠️ ${common.length} common ancestor${common.length > 1 ? "s" : ""} within 3 generations: ${names.join(", ")}. Monitor carefully.`,
      commonAncestors: names,
    }
  }

  return {
    level: "safe",
    msg: "✅ No close relatives within 3 generations — safe to breed.",
    commonAncestors: [],
  }
}
