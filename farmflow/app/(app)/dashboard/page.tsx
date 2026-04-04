"use client"

import { useSession, signOut } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const { data: session, isPending } = useSession()
  const router = useRouter()

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f9f7]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!session) {
    router.push("/login")
    return null
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f9f7]">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-[#e8ede8] bg-white/90 px-5 py-3 backdrop-blur-sm">
        <h1 className="text-lg font-bold text-[#166534]">FarmFlow</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {session.user.name}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              await signOut()
              router.push("/login")
            }}
          >
            Sign out
          </Button>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-[#0f1f0f]">
            Welcome, {session.user.name}
          </h2>
          <p className="mt-2 text-muted-foreground">
            Your dashboard is being built. Farming modules are coming next.
          </p>
        </div>
      </main>
    </div>
  )
}
