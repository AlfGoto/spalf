"use client";

import { useState, useCallback } from "react";
import { API_BASE_URL } from "@/shared/api";
import type {
  Room,
  CreateRoomInput,
  UpdateRoomInput,
  ApiListResponse,
  ApiResponse,
} from "@/shared/types";

// For now, we use a hardcoded spa ID. This will come from auth context later.
const SPA_ID = "demo-spa";

interface UseRoomsState {
  rooms: Room[];
  isLoading: boolean;
  error: string | null;
}

interface UseRoomsReturn extends UseRoomsState {
  fetchRooms: () => Promise<void>;
  createRoom: (input: CreateRoomInput) => Promise<Room | null>;
  updateRoom: (id: string, input: UpdateRoomInput) => Promise<Room | null>;
  deleteRoom: (id: string) => Promise<boolean>;
  clearError: () => void;
}

export function useRooms(): UseRoomsReturn {
  const [state, setState] = useState<UseRoomsState>({
    rooms: [],
    isLoading: false,
    error: null,
  });

  const setLoading = (isLoading: boolean) => {
    setState((prev) => ({ ...prev, isLoading }));
  };

  const setError = (error: string | null) => {
    setState((prev) => ({ ...prev, error, isLoading: false }));
  };

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/rooms?spaId=${SPA_ID}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch rooms");
      }
      
      const result = (await response.json()) as ApiListResponse<Room>;
      setState({
        rooms: result.data,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch rooms");
    }
  }, []);

  const createRoom = useCallback(async (input: CreateRoomInput): Promise<Room | null> => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/rooms?spaId=${SPA_ID}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create room");
      }
      
      const result = (await response.json()) as ApiResponse<Room>;
      setState((prev) => ({
        ...prev,
        rooms: [...prev.rooms, result.data],
        isLoading: false,
        error: null,
      }));
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create room");
      return null;
    }
  }, []);

  const updateRoom = useCallback(
    async (id: string, input: UpdateRoomInput): Promise<Room | null> => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/rooms/${id}?spaId=${SPA_ID}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to update room");
        }
        
        const result = (await response.json()) as ApiResponse<Room>;
        setState((prev) => ({
          ...prev,
          rooms: prev.rooms.map((room) =>
            room.roomId === id ? result.data : room
          ),
          isLoading: false,
          error: null,
        }));
        return result.data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update room");
        return null;
      }
    },
    []
  );

  const deleteRoom = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/rooms/${id}?spaId=${SPA_ID}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete room");
      }
      
      setState((prev) => ({
        ...prev,
        rooms: prev.rooms.filter((room) => room.roomId !== id),
        isLoading: false,
        error: null,
      }));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete room");
      return false;
    }
  }, []);

  return {
    ...state,
    fetchRooms,
    createRoom,
    updateRoom,
    deleteRoom,
    clearError,
  };
}
