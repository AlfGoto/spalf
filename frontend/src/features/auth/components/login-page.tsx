"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useSearchParams, useRouter } from "next/navigation"
import { Link } from "@/i18n/navigation"
import { Button } from "@/package/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/package/ui/card"
import { Input } from "@/package/ui/input"
import { Label } from "@/package/ui/label"
import { signIn, completeNewPassword } from "@/package/auth/actions"

export function LoginPage() {
  const t = useTranslations()
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get("callbackUrl") || "/"
  const urlError = searchParams.get("error")

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [error, setError] = useState<string | null>(urlError)
  const [loading, setLoading] = useState(false)
  const [challenge, setChallenge] = useState<{
    challengeName: string
    session: string
    username: string
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await signIn({ username: email, password })

      if ("challengeName" in result) {
        setChallenge(result)
        setLoading(false)
        return
      }

      if (!result.success) {
        setError(result.error)
        setLoading(false)
        return
      }

      router.push(callbackUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setLoading(false)
    }
  }

  const handleNewPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!challenge) return

    setError(null)
    setLoading(true)

    try {
      const result = await completeNewPassword({
        username: challenge.username,
        session: challenge.session,
        newPassword,
      })

      if (!result.success) {
        setError(result.error)
        setLoading(false)
        return
      }

      router.push(callbackUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setLoading(false)
    }
  }

  // Show new password form if challenge is required
  if (challenge?.challengeName === "NEW_PASSWORD_REQUIRED") {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t("auth.setNewPassword")}</CardTitle>
          <CardDescription>
            {t("auth.setNewPasswordDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
          <form onSubmit={handleNewPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t("auth.newPassword")}</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("common.loading") : t("auth.setPassword")}
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t("auth.login")}</CardTitle>
        <CardDescription>
          {t("app.description")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t("auth.email")}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{t("auth.password")}</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("common.loading") : t("auth.login")}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-neutral-600">
          {t("auth.noAccount")}{" "}
          <Link href="/register" className="font-medium text-black hover:underline">
            {t("auth.register")}
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
