"use server"

import { apiClient } from "@/shared/api/client"
import type { Client, CreateClientInput, UpdateClientInput } from "./types"
import { getServerSession, getAccessToken } from "@/package/auth/server"
import { redirect } from "next/navigation"

async function getAuthHeaders(): Promise<HeadersInit> {
  const session = await getServerSession()
  if (!session) {
    redirect("/login")
  }

  const accessToken = await getAccessToken()
  if (!accessToken) {
    // No access token means the OAuth session is invalid - redirect to login
    redirect("/login")
  }

  // TODO: Extract spaId from user context once multi-tenant selection is implemented
  // For now, use a placeholder - this will be replaced when spa selection is added
  return {
    Authorization: accessToken,
    "x-spa-id": "test-spa-id",
  }
}

export async function listClients(): Promise<{ data?: Client[]; error?: { error: string; message: string } }> {
  const headers = await getAuthHeaders()
  return apiClient<Client[]>("/api/clients", { headers })
}

export async function getClient(id: string): Promise<{ data?: Client; error?: { error: string; message: string } }> {
  const headers = await getAuthHeaders()
  return apiClient<Client>(`/api/clients/${id}`, { headers })
}

export async function createClient(
  input: CreateClientInput
): Promise<{ data?: Client; error?: { error: string; message: string } }> {
  const headers = await getAuthHeaders()
  return apiClient<Client>("/api/clients", {
    method: "POST",
    headers,
    body: JSON.stringify(input),
  })
}

export async function updateClient(
  id: string,
  input: UpdateClientInput
): Promise<{ data?: Client; error?: { error: string; message: string } }> {
  const headers = await getAuthHeaders()
  return apiClient<Client>(`/api/clients/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(input),
  })
}

export async function deleteClient(id: string): Promise<{ data?: void; error?: { error: string; message: string } }> {
  const headers = await getAuthHeaders()
  return apiClient<void>(`/api/clients/${id}`, {
    method: "DELETE",
    headers,
  })
}
