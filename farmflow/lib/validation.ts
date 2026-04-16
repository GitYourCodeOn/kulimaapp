import { z } from "zod"

export const registerSchema = z.object({
  farmName: z.string().min(1).max(100).trim(),
  farmingType: z.enum(["dairy", "pigs", "chickens", "crops"]),
  location: z.string().max(200).trim().optional().default(""),
})

export const acceptInviteSchema = z.object({
  token: z.string().min(1).max(128),
  name: z.string().min(1).max(100).trim(),
  password: z.string().min(8).max(128),
})

/** Farm managers invite workers only (see POST /api/admin/invite). */
export const managerInviteSchema = z.object({
  email: z.string().email().max(254).toLowerCase().trim(),
  role: z.literal("worker"),
})

/** Superadmin platform invites may be manager or worker (see POST /api/platform/invite). */
export const platformInviteSchema = z.object({
  farmId: z.string().min(1),
  email: z.string().email().max(254).toLowerCase().trim(),
  role: z.enum(["manager", "worker"]),
})

export const farmPatchSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  location: z.string().max(200).trim().optional(),
  sizeHa: z.number().min(0).max(1_000_000).optional(),
  farmingType: z.enum(["dairy", "pigs", "chickens", "crops"]).optional(),
})

export const userPatchSchema = z.object({
  role: z.enum(["worker"]),
})

export const platformCreateFarmSchema = z.object({
  farmName: z.string().min(1).max(100).trim(),
  farmingType: z.enum(["dairy", "pigs", "chickens", "crops"]),
  location: z.string().max(200).trim().optional().default(""),
  managerEmail: z.string().email().max(254).toLowerCase().trim(),
  managerName: z.string().min(1).max(100).trim(),
})

export const onboardingSchema = z.object({
  farmingType: z.enum(["dairy", "pigs", "chickens", "crops"]),
  name: z.string().min(1).max(100).trim(),
  breed: z.string().max(100).trim().optional(),
  role: z.string().max(50).trim().optional(),
  crop: z.string().max(100).trim().optional(),
  type: z.string().max(50).trim().optional(),
})
