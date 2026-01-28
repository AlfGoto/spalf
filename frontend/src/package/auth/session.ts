// Re-export from actions for backwards compatibility
export { getSession as getServerSession, getIdToken, getIdToken as getAccessToken } from "./actions"
export type { AuthSession as Session } from "./types"

import { getSession } from "./actions"

export async function requireAuth() {
  const session = await getSession()
  if (!session) {
    throw new Error("Unauthorized")
  }
  return session
}
