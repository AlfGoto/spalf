"use server"

import { apiClient } from "@/shared/api/client"
import type { Product, CreateProductInput, UpdateProductInput } from "./types"
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

export async function listProducts(): Promise<{ data?: Product[]; error?: { error: string; message: string } }> {
  const headers = await getAuthHeaders()
  return apiClient<Product[]>("/api/products", { headers })
}

export async function getProduct(id: string): Promise<{ data?: Product; error?: { error: string; message: string } }> {
  const headers = await getAuthHeaders()
  return apiClient<Product>(`/api/products/${id}`, { headers })
}

export async function createProduct(
  input: CreateProductInput
): Promise<{ data?: Product; error?: { error: string; message: string } }> {
  const headers = await getAuthHeaders()
  return apiClient<Product>("/api/products", {
    method: "POST",
    headers,
    body: JSON.stringify(input),
  })
}

export async function updateProduct(
  id: string,
  input: UpdateProductInput
): Promise<{ data?: Product; error?: { error: string; message: string } }> {
  const headers = await getAuthHeaders()
  return apiClient<Product>(`/api/products/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(input),
  })
}

export async function deleteProduct(id: string): Promise<{ data?: void; error?: { error: string; message: string } }> {
  const headers = await getAuthHeaders()
  return apiClient<void>(`/api/products/${id}`, {
    method: "DELETE",
    headers,
  })
}
