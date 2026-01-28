"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getCognito, type CognitoUser } from "./cognito"
import type { AuthSession } from "./types"

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 7, // 7 days
}

export async function signIn(credentials: {
  username: string
  password: string
}): Promise<
  | { success: true }
  | { success: false; error: string }
  | { challengeName: string; session: string; username: string }
> {
  try {
    const cognito = getCognito()
    const result = await cognito.signIn(credentials)

    // Handle challenge (e.g., NEW_PASSWORD_REQUIRED)
    if ("challengeName" in result) {
      return result
    }

    // Store tokens in cookies
    const cookieStore = await cookies()
    cookieStore.set("spalf.id_token", result.tokens.idToken, COOKIE_OPTIONS)
    cookieStore.set("spalf.access_token", result.tokens.accessToken, COOKIE_OPTIONS)
    cookieStore.set("spalf.refresh_token", result.tokens.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 60 * 60 * 24 * 30, // 30 days for refresh token
    })
    cookieStore.set("spalf.user", JSON.stringify(result.user), COOKIE_OPTIONS)
    cookieStore.set("spalf.username", credentials.username, COOKIE_OPTIONS)

    return { success: true }
  } catch (error) {
    console.error("Sign in error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Authentication failed",
    }
  }
}

export async function completeNewPassword(params: {
  username: string
  session: string
  newPassword: string
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const cognito = getCognito()
    const result = await cognito.completeNewPasswordChallenge(params)

    // Store tokens in cookies
    const cookieStore = await cookies()
    cookieStore.set("spalf.id_token", result.tokens.idToken, COOKIE_OPTIONS)
    cookieStore.set("spalf.access_token", result.tokens.accessToken, COOKIE_OPTIONS)
    cookieStore.set("spalf.refresh_token", result.tokens.refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 60 * 60 * 24 * 30,
    })
    cookieStore.set("spalf.user", JSON.stringify(result.user), COOKIE_OPTIONS)
    cookieStore.set("spalf.username", params.username, COOKIE_OPTIONS)

    return { success: true }
  } catch (error) {
    console.error("Complete new password error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to set new password",
    }
  }
}

export async function signOut(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete("spalf.id_token")
  cookieStore.delete("spalf.access_token")
  cookieStore.delete("spalf.refresh_token")
  cookieStore.delete("spalf.user")
  cookieStore.delete("spalf.username")
  redirect("/login")
}

export async function getSession(): Promise<AuthSession | null> {
  // E2E test mode bypass
  if (process.env.E2E_TEST_MODE === "true") {
    const cookieStore = await cookies()
    const testCookie = cookieStore.get("spalf.e2e_test")
    if (testCookie?.value === "authenticated") {
      return {
        user: {
          sub: "test-user-id",
          email: "test@example.com",
          name: "Test User",
        },
        tokens: {
          idToken: "test-id-token",
          accessToken: "test-access-token",
        },
      }
    }
  }

  const cookieStore = await cookies()
  const idToken = cookieStore.get("spalf.id_token")?.value
  const accessToken = cookieStore.get("spalf.access_token")?.value
  const userJson = cookieStore.get("spalf.user")?.value

  if (!idToken || !accessToken || !userJson) {
    return null
  }

  try {
    const user = JSON.parse(userJson) as CognitoUser
    return {
      user,
      tokens: { idToken, accessToken },
    }
  } catch {
    return null
  }
}

export async function getIdToken(): Promise<string | null> {
  // E2E test mode bypass
  if (process.env.E2E_TEST_MODE === "true") {
    const cookieStore = await cookies()
    const testCookie = cookieStore.get("spalf.e2e_test")
    if (testCookie?.value === "authenticated") {
      return "test-id-token"
    }
  }

  const cookieStore = await cookies()
  return cookieStore.get("spalf.id_token")?.value ?? null
}

export async function refreshTokens(): Promise<boolean> {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get("spalf.refresh_token")?.value
  const username = cookieStore.get("spalf.username")?.value

  if (!refreshToken || !username) {
    return false
  }

  try {
    const cognito = getCognito()
    const result = await cognito.refreshToken({ refreshToken, username })

    cookieStore.set("spalf.id_token", result.idToken, COOKIE_OPTIONS)
    cookieStore.set("spalf.access_token", result.accessToken, COOKIE_OPTIONS)

    return true
  } catch (error) {
    console.error("Token refresh error:", error)
    return false
  }
}

export async function signUp(params: {
  email: string
  password: string
  givenName: string
  familyName: string
}): Promise<
  | { success: true; userConfirmed: boolean }
  | { success: false; error: string }
> {
  try {
    const cognito = getCognito()
    const result = await cognito.signUp(params)

    return {
      success: true,
      userConfirmed: result.userConfirmed,
    }
  } catch (error) {
    console.error("Sign up error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Registration failed",
    }
  }
}

export async function confirmSignUp(params: {
  email: string
  code: string
}): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const cognito = getCognito()
    await cognito.confirmSignUp(params)

    return { success: true }
  } catch (error) {
    console.error("Confirm sign up error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Confirmation failed",
    }
  }
}
