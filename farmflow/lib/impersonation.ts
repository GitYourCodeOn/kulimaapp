import { cookies } from "next/headers"

const COOKIE_NAME = "farmflow-impersonation"

export interface ImpersonationData {
  userId: string
  name: string
  role: string
  farmId: string
  logId: string
}

export async function getImpersonation(): Promise<ImpersonationData | null> {
  const store = await cookies()
  const raw = store.get(COOKIE_NAME)?.value
  if (!raw) return null
  try {
    return JSON.parse(raw) as ImpersonationData
  } catch {
    return null
  }
}

export async function setImpersonation(data: ImpersonationData) {
  const store = await cookies()
  store.set(COOKIE_NAME, JSON.stringify(data), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 4, // 4 hours max
  })
}

export async function clearImpersonation() {
  const store = await cookies()
  store.delete(COOKIE_NAME)
}
