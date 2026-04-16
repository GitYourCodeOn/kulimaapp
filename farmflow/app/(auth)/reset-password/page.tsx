"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { resetPassword } from "@/lib/auth-client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { buttonVariants } from "@/components/ui/button-variants"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f7f9f7] p-4">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const err = searchParams.get("error")

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)

  if (err === "INVALID_TOKEN" || err === "invalid_token") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f9f7] p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl text-destructive">
              Link invalid or expired
            </CardTitle>
            <CardDescription>
              Request a new reset link from the forgot password page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/forgot-password"
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "inline-flex w-full justify-center bg-[#166534] hover:bg-[#14532d]"
              )}
            >
              Request new link
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f9f7] p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-xl">Missing reset token</CardTitle>
            <CardDescription>
              Open the link from your email, or request a new password reset.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Link
              href="/forgot-password"
              className={cn(
                buttonVariants({ variant: "default", size: "lg" }),
                "inline-flex w-full justify-center bg-[#166534] hover:bg-[#14532d]"
              )}
            >
              Forgot password
            </Link>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "inline-flex w-full justify-center"
              )}
            >
              Sign in
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token) return
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters.")
      return
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.")
      return
    }

    setLoading(true)
    try {
      const { error } = await resetPassword({
        newPassword: password,
        token,
      })

      if (error) {
        toast.error(error.message ?? "Could not reset password.")
        setLoading(false)
        return
      }

      toast.success("Password updated. You can sign in with your new password.")
      router.push("/login")
    } catch {
      toast.error("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f9f7] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-[#166534]">
            Set new password
          </CardTitle>
          <CardDescription>
            Choose a strong password for your FarmFlow account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                name="confirm"
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#166534] hover:bg-[#14532d]"
              size="lg"
            >
              {loading ? "Saving…" : "Update password"}
            </Button>
            <p className="text-center text-sm">
              <Link
                href="/login"
                className="font-medium text-[#166534] underline-offset-4 hover:underline"
              >
                Back to sign in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
