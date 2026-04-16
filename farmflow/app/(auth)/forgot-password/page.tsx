"use client"

import { useState } from "react"
import Link from "next/link"
import { requestPasswordReset } from "@/lib/auth-client"
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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const origin = window.location.origin
    const redirectTo = `${origin}/reset-password`

    try {
      const { error } = await requestPasswordReset({
        email: email.trim().toLowerCase(),
        redirectTo,
      })

      if (error) {
        toast.error(error.message ?? "Could not send reset email.")
        setLoading(false)
        return
      }

      setSent(true)
      toast.success("If that email is registered, you will receive a reset link shortly.")
    } catch {
      toast.error("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f9f7] p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-[#166534]">
            Forgot password
          </CardTitle>
          <CardDescription>
            Enter your account email. We will send you a link to set a new
            password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4 text-center text-sm text-muted-foreground">
              <p>
                Check your inbox (and spam folder) for an email from FarmFlow.
                The link expires after a short time.
              </p>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "inline-flex w-full justify-center"
                )}
              >
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-[#166534] hover:bg-[#14532d]"
                size="lg"
              >
                {loading ? "Sending…" : "Send reset link"}
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}
