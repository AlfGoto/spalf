import { redirect } from "next/navigation"

// Remove trailing slash from API_URL to avoid double slashes
const API_URL = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "")
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

// In E2E test mode, route to mock API
const getApiUrl = (endpoint: string): string => {
  if (process.env.E2E_TEST_MODE === "true") {
    // Route through mock API - strip the /api prefix and add /api/mock
    // Use absolute URL for server-side fetch
    const endpointWithoutApi = endpoint.replace(/^\/api/, "")
    return `${APP_URL}/api/mock${endpointWithoutApi}`
  }
  return `${API_URL}${endpoint}`
}

export interface ApiResponse<T> {
  data?: T
  error?: {
    error: string
    message: string
  }
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = getApiUrl(endpoint)

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    })

    if (!response.ok) {
      // Redirect to login on 401 Unauthorized
      if (response.status === 401) {
        redirect("/login")
      }

      const errorData = await response.json().catch(() => ({
        error: "UnknownError",
        message: "An unknown error occurred",
      }))
      return { error: errorData }
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return { data: undefined as T }
    }

    const data = await response.json()
    return { data }
  } catch (error) {
    return {
      error: {
        error: "NetworkError",
        message: error instanceof Error ? error.message : "Network error occurred",
      },
    }
  }
}
