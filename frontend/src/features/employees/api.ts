"use server"

import { apiClient } from "@/shared/api/client"
import type { Employee, CreateEmployeeInput, UpdateEmployeeInput } from "./types"
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

export async function listEmployees(): Promise<{ data?: Employee[]; error?: { error: string; message: string } }> {
  const headers = await getAuthHeaders()
  return apiClient<Employee[]>("/api/employees", { headers })
}

export async function getEmployee(id: string): Promise<{ data?: Employee; error?: { error: string; message: string } }> {
  const headers = await getAuthHeaders()
  return apiClient<Employee>(`/api/employees/${id}`, { headers })
}

export async function createEmployee(
  input: CreateEmployeeInput
): Promise<{ data?: Employee; error?: { error: string; message: string } }> {
  const headers = await getAuthHeaders()
  return apiClient<Employee>("/api/employees", {
    method: "POST",
    headers,
    body: JSON.stringify(input),
  })
}

export async function updateEmployee(
  id: string,
  input: UpdateEmployeeInput
): Promise<{ data?: Employee; error?: { error: string; message: string } }> {
  const headers = await getAuthHeaders()
  return apiClient<Employee>(`/api/employees/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(input),
  })
}

export async function deleteEmployee(id: string): Promise<{ data?: void; error?: { error: string; message: string } }> {
  const headers = await getAuthHeaders()
  return apiClient<void>(`/api/employees/${id}`, {
    method: "DELETE",
    headers,
  })
}
