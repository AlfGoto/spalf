"use server"

import { apiClient } from "@/shared/api/client"
import type { Closure, CreateClosureInput } from "./types"
import { getServerSession, getAccessToken } from "@/package/auth/server"
import { redirect } from "next/navigation"

async function getAuthHeaders(): Promise<HeadersInit> {
  const session = await getServerSession()
  if (!session) {
    redirect("/login")
  }

  const accessToken = await getAccessToken()
  if (!accessToken) {
    redirect("/login")
  }

  // TODO: Extract spaId from user context once multi-tenant selection is implemented
  // For now, use a placeholder - this will be replaced when spa selection is added
  return {
    Authorization: accessToken,
    "x-spa-id": "test-spa-id",
  }
}

export async function listClosures(): Promise<{ data?: Closure[]; error?: { error: string; message: string } }> {
  const headers = await getAuthHeaders()
  return apiClient<Closure[]>("/api/closures", { headers })
}

export async function getClosure(id: string): Promise<{ data?: Closure; error?: { error: string; message: string } }> {
  const headers = await getAuthHeaders()
  return apiClient<Closure>(`/api/closures/${id}`, { headers })
}

export async function createClosure(
  input: CreateClosureInput
): Promise<{ data?: Closure; error?: { error: string; message: string } }> {
  const headers = await getAuthHeaders()
  return apiClient<Closure>("/api/closures", {
    method: "POST",
    headers,
    body: JSON.stringify(input),
  })
}

export async function deleteClosure(id: string): Promise<{ data?: void; error?: { error: string; message: string } }> {
  const headers = await getAuthHeaders()
  return apiClient<void>(`/api/closures/${id}`, {
    method: "DELETE",
    headers,
  })
}
