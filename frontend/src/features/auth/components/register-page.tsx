"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { Link } from "@/i18n/navigation"
import { Button } from "@/package/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/package/ui/card"
import { Input } from "@/package/ui/input"
import { Label } from "@/package/ui/label"
import { signUp, confirmSignUp } from "@/package/auth/actions"

export function RegisterPage() {
  const t = useTranslations()
  const router = useRouter()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [givenName, setGivenName] = useState("")
  const [familyName, setFamilyName] = useState("")
  const [confirmationCode, setConfirmationCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await signUp({ email, password, givenName, familyName })

      if (!result.success) {
        setError(result.error)
        setLoading(false)
        return
      }

      if (!result.userConfirmed) {
        setNeedsConfirmation(true)
      } else {
        router.push("/login?registered=true")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await confirmSignUp({ email, code: confirmationCode })

      if (!result.success) {
        setError(result.error)
        setLoading(false)
        return
      }

      router.push("/login?registered=true")
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  // Show confirmation code form
  if (needsConfirmation) {
    return (
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">{t("auth.confirmEmail")}</CardTitle>
          <CardDescription>
            {t("auth.confirmEmailDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}
          <form onSubmit={handleConfirm} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">{t("auth.confirmationCode")}</Label>
              <Input
                id="code"
                type="text"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                placeholder="123456"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("common.loading") : t("auth.confirm")}
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{t("auth.register")}</CardTitle>
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="givenName">{t("auth.firstName")}</Label>
              <Input
                id="givenName"
                type="text"
                value={givenName}
                onChange={(e) => setGivenName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="familyName">{t("auth.lastName")}</Label>
              <Input
                id="familyName"
                type="text"
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                required
              />
            </div>
          </div>
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
              minLength={8}
            />
            <p className="text-xs text-neutral-500">
              {t("auth.passwordRequirements")}
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t("common.loading") : t("auth.register")}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-neutral-600">
          {t("auth.hasAccount")}{" "}
          <Link href="/login" className="font-medium text-black hover:underline">
            {t("auth.login")}
          </Link>
        </p>
      </CardContent>
    </Card>
  )
}
