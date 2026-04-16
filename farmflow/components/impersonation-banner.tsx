"use client"

import { useState, useEffect, useCallback, createContext, useContext } from "react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface ImpersonationState {
  active: boolean
  userId: string | null
  name: string | null
  role: string | null
}

const ImpersonationContext = createContext<ImpersonationState>({
  active: false,
  userId: null,
  name: null,
  role: null,
})

export function useImpersonation() {
  return useContext(ImpersonationContext)
}

export function ImpersonationProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [state, setState] = useState<ImpersonationState>({
    active: false,
    userId: null,
    name: null,
    role: null,
  })
  const [ending, setEnding] = useState(false)

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/impersonate")
      if (!res.ok) return
      const data = await res.json()
      if (data.impersonating) {
        setState({
          active: true,
          userId: data.impersonating.userId,
          name: data.impersonating.name,
          role: data.impersonating.role,
        })
      } else {
        setState({ active: false, userId: null, name: null, role: null })
      }
    } catch {
      // Silent fail — banner just won't show
    }
  }, [])

  useEffect(() => {
    checkStatus()
  }, [checkStatus])

  async function handleEnd() {
    setEnding(true)
    try {
      const res = await fetch("/api/admin/impersonate", { method: "DELETE" })
      if (res.ok) {
        setState({ active: false, userId: null, name: null, role: null })
        toast.success("Impersonation ended")
      }
    } catch {
      toast.error("Failed to end impersonation")
    } finally {
      setEnding(false)
    }
  }

  return (
    <ImpersonationContext.Provider value={state}>
      {state.active && (
        <div className="sticky top-0 z-50 flex items-center justify-center gap-3 bg-amber-500 px-4 py-2 text-sm font-medium text-white">
          <span>
            Impersonating{" "}
            <strong>{state.name}</strong> — viewing as{" "}
            <strong>{state.role}</strong>
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 border-white/40 bg-transparent text-white hover:bg-white/20 hover:text-white"
            onClick={handleEnd}
            disabled={ending}
          >
            {ending ? "Ending…" : "End Session"}
          </Button>
        </div>
      )}
      {children}
    </ImpersonationContext.Provider>
  )
}
