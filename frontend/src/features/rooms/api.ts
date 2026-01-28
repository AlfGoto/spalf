"use server"

import { apiClient } from "@/shared/api/client"
import type { Room, CreateRoomInput, UpdateRoomInput } from "./types"
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

export async function listRooms(): Promise<{ data?: Room[]; error?: { error: string; message: string } }> {
  const headers = await getAuthHeaders()
  return apiClient<Room[]>("/api/rooms", { headers })
}

export async function getRoom(id: string): Promise<{ data?: Room; error?: { error: string; message: string } }> {
  const headers = await getAuthHeaders()
  return apiClient<Room>(`/api/rooms/${id}`, { headers })
}

export async function createRoom(
  input: CreateRoomInput
): Promise<{ data?: Room; error?: { error: string; message: string } }> {
  const headers = await getAuthHeaders()
  return apiClient<Room>("/api/rooms", {
    method: "POST",
    headers,
    body: JSON.stringify(input),
  })
}

export async function updateRoom(
  id: string,
  input: UpdateRoomInput
): Promise<{ data?: Room; error?: { error: string; message: string } }> {
  const headers = await getAuthHeaders()
  return apiClient<Room>(`/api/rooms/${id}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(input),
  })
}

export async function deleteRoom(id: string): Promise<{ data?: void; error?: { error: string; message: string } }> {
  const headers = await getAuthHeaders()
  return apiClient<void>(`/api/rooms/${id}`, {
    method: "DELETE",
    headers,
  })
}
