import { NextRequest, NextResponse } from "next/server"
import createIntlMiddleware from "next-intl/middleware"
import { routing } from "./i18n/routing"

const intlMiddleware = createIntlMiddleware(routing)

// Paths that don't require authentication
const publicPaths = ["/login", "/register", "/docs"]

// Check if a path is public (doesn't require auth)
function isPublicPath(pathname: string): boolean {
  // Remove locale prefix to check the actual path
  const pathWithoutLocale = pathname.replace(/^\/(en|fr)/, "") || "/"

  return publicPaths.some(
    (path) => pathWithoutLocale === path || pathWithoutLocale.startsWith(`${path}/`)
  )
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip auth check for API routes, static files, and Next.js internals
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  // Apply i18n middleware first
  const response = intlMiddleware(request)

  // Check authentication for protected routes
  if (!isPublicPath(pathname)) {
    // Check for Cognito ID token cookie
    const idTokenCookie = request.cookies.get("spalf.id_token")
    // E2E test mode: also accept test cookie
    const testCookie =
      process.env.E2E_TEST_MODE === "true"
        ? request.cookies.get("spalf.e2e_test")
        : null
    const isAuthenticated =
      idTokenCookie || testCookie?.value === "authenticated"

    if (!isAuthenticated) {
      // Determine the locale from the URL or use default
      const localeMatch = pathname.match(/^\/(en|fr)/)
      const locale = localeMatch ? localeMatch[1] : routing.defaultLocale

      // Redirect to login
      const loginUrl = new URL(`/${locale}/login`, request.url)
      loginUrl.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return response
}

export const config = {
  // Match all pathnames except for API routes, static files, and Next.js internals
  matcher: ["/((?!api|_next|.*\\..*).*)"],
}
