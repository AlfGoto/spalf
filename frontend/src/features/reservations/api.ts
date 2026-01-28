"use server"

import { apiClient } from "@/shared/api/client"
import type { Reservation, CreateReservationInput, UpdateReservationInput } from "./types"
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

export async function listReservations(): Promise<{ data?: Reservation[]; error?: { error: string; message: string } }> {
  const headers = await getAuthHeaders()
  return apiClient<Reservation[]>("/api/reservations", { headers })
}

export async function getReservation(id: string): Promise<{ data?: Reservation; error?: { error: string; message: string } }> {
  const headers = await getAuthHeaders()
  return apiClient<Reservation>(`/api/reservations/${id}`, { headers })
}

export async function createReservation(
  input: CreateReservationInput
): Promise<{ data?: Reservation; error?: { error: string; message: string } }> {
  const headers = await getAuthHeaders()
  return apiClient<Reservation>("/api/reservations", {
    method: "POST",
    headers,
    body: JSON.stringify(input),
  })
}

export async function updateReservation(
  id: string,
  input: UpdateReservationInput
): Promise<{ data?: Reservation; error?: { error: string; message: string } }> {
  const headers = await getAuthHeaders()
  return apiClient<Reservation>(`/api/reservations/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(input),
  })
}

export async function deleteReservation(id: string): Promise<{ data?: void; error?: { error: string; message: string } }> {
  const headers = await getAuthHeaders()
  return apiClient<void>(`/api/reservations/${id}`, {
    method: "DELETE",
    headers,
  })
}

// Calendar API functions
export async function getCalendarReservations(
  startDate: string,
  endDate: string
): Promise<{ data?: Reservation[]; error?: { error: string; message: string } }> {
  const headers = await getAuthHeaders()
  return apiClient<Reservation[]>(`/api/reservations/calendar?startDate=${startDate}&endDate=${endDate}`, { headers })
}

export async function getEmployeeCalendar(
  employeeId: string,
  startDate?: string,
  endDate?: string
): Promise<{ data?: Reservation[]; error?: { error: string; message: string } }> {
  const headers = await getAuthHeaders()
  const params = new URLSearchParams()
  if (startDate) params.set("startDate", startDate)
  if (endDate) params.set("endDate", endDate)
  const query = params.toString() ? `?${params.toString()}` : ""
  return apiClient<Reservation[]>(`/api/employees/${employeeId}/calendar${query}`, { headers })
}

export async function getRoomCalendar(
  roomId: string,
  startDate?: string,
  endDate?: string
): Promise<{ data?: Reservation[]; error?: { error: string; message: string } }> {
  const headers = await getAuthHeaders()
  const params = new URLSearchParams()
  if (startDate) params.set("startDate", startDate)
  if (endDate) params.set("endDate", endDate)
  const query = params.toString() ? `?${params.toString()}` : ""
  return apiClient<Reservation[]>(`/api/rooms/${roomId}/calendar${query}`, { headers })
}
