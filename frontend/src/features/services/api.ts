"use server"

import { apiClient } from "@/shared/api/client"
import type { Service, CreateServiceInput, UpdateServiceInput } from "./types"
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

export async function listServices(): Promise<{ data?: Service[]; error?: { error: string; message: string } }> {
  const headers = await getAuthHeaders()
  return apiClient<Service[]>("/api/services", { headers })
}

export async function getService(id: string): Promise<{ data?: Service; error?: { error: string; message: string } }> {
  const headers = await getAuthHeaders()
  return apiClient<Service>(`/api/services/${id}`, { headers })
}

export async function createService(
  input: CreateServiceInput
): Promise<{ data?: Service; error?: { error: string; message: string } }> {
  const headers = await getAuthHeaders()
  return apiClient<Service>("/api/services", {
    method: "POST",
    headers,
    body: JSON.stringify(input),
  })
}

export async function updateService(
  id: string,
  input: UpdateServiceInput
): Promise<{ data?: Service; error?: { error: string; message: string } }> {
  const headers = await getAuthHeaders()
  return apiClient<Service>(`/api/services/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(input),
  })
}

export async function deleteService(id: string): Promise<{ data?: void; error?: { error: string; message: string } }> {
  const headers = await getAuthHeaders()
  return apiClient<void>(`/api/services/${id}`, {
    method: "DELETE",
    headers,
  })
}
