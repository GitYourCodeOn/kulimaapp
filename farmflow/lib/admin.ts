// Re-exports from lib/tenant.ts for backwards compatibility.
// New code should import directly from "@/lib/tenant".
export {
  requireManager,
  getTenant,
  requireSuperadmin,
  getPlatformAdmin,
} from "@/lib/tenant"
