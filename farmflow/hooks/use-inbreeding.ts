"use client"

import { useMemo } from "react"
import {
  inbreedingCheck,
  type InbreedingAnimal,
  type InbreedingResult,
} from "@/lib/inbreeding"

export function useInbreeding(
  maleId: string,
  femaleId: string,
  animals: InbreedingAnimal[]
): InbreedingResult | null {
  return useMemo(
    () => inbreedingCheck(maleId, femaleId, animals),
    [maleId, femaleId, animals]
  )
}
