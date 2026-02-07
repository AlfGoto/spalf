import createClient, { type Middleware } from "openapi-fetch";
import { getIdToken } from "@/package/auth";
// import type { paths } from "@/shared/types/api";

/**
 * API client for the Spalf backend.
 *
 * Once the OpenAPI schema is generated from the backend,
 * uncomment the type import and add it to createClient<paths>()
 * for full type safety.
 *
 * Usage:
 * ```ts
 * import { api, API_BASE_URL } from "@/shared/api/client";
 *
 * const { data, error } = await api.GET("/api/employees");
 * ```
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export const api = createClient({
  baseUrl: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Auth middleware that adds the Cognito ID token to requests.
 * The token is fetched fresh for each request to ensure it's always valid.
 */
const authMiddleware: Middleware = {
  async onRequest({ request }) {
    try {
      const token = await getIdToken();
      if (token) {
        request.headers.set("Authorization", `Bearer ${token}`);
      }
    } catch {
      // User not authenticated, continue without token
    }
    return request;
  },
};

// Register the auth middleware
api.use(authMiddleware);

/**
 * @deprecated Use the auth middleware instead. Token is automatically included in requests.
 */
export function setAuthToken(_token: string) {
  console.warn(
    "setAuthToken is deprecated. Auth tokens are now automatically included via middleware."
  );
}
