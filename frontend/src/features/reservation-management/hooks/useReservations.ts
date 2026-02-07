"use client";

import { useState, useCallback } from "react";
import { API_BASE_URL } from "@/shared/api";
import type {
  Reservation,
  CreateReservationInput,
  UpdateReservationInput,
  ApiListResponse,
  ApiResponse,
} from "@/shared/types";

// For now, we use a hardcoded spa ID. This will come from auth context later.
const SPA_ID = "demo-spa";

interface UseReservationsState {
  reservations: Reservation[];
  isLoading: boolean;
  error: string | null;
}

interface UseReservationsReturn extends UseReservationsState {
  fetchReservations: (date?: string) => Promise<void>;
  fetchCalendarReservations: (startDate: string, endDate: string, filters?: { employeeId?: string; roomId?: string }) => Promise<void>;
  createReservation: (input: CreateReservationInput) => Promise<Reservation | null>;
  updateReservation: (id: string, input: UpdateReservationInput) => Promise<Reservation | null>;
  cancelReservation: (id: string, reason?: string) => Promise<boolean>;
  deleteReservation: (id: string) => Promise<boolean>;
  clearError: () => void;
}

export function useReservations(): UseReservationsReturn {
  const [state, setState] = useState<UseReservationsState>({
    reservations: [],
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

  const fetchReservations = useCallback(async (date?: string) => {
    setLoading(true);
    try {
      const url = date
        ? `${API_BASE_URL}/api/reservations?spaId=${SPA_ID}&date=${date}`
        : `${API_BASE_URL}/api/reservations?spaId=${SPA_ID}`;
      
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch reservations");
      }

      const result = (await response.json()) as ApiListResponse<Reservation>;
      setState({
        reservations: result.data,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch reservations");
    }
  }, []);

  const fetchCalendarReservations = useCallback(
    async (
      startDate: string,
      endDate: string,
      filters?: { employeeId?: string; roomId?: string }
    ) => {
      setLoading(true);
      try {
        let url = `${API_BASE_URL}/api/reservations/calendar?spaId=${SPA_ID}&startDate=${startDate}&endDate=${endDate}`;
        
        if (filters?.employeeId) {
          url += `&employeeId=${filters.employeeId}`;
        }
        if (filters?.roomId) {
          url += `&roomId=${filters.roomId}`;
        }

        const response = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Failed to fetch calendar reservations");
        }

        const result = (await response.json()) as ApiListResponse<Reservation>;
        setState({
          reservations: result.data,
          isLoading: false,
          error: null,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch calendar reservations");
      }
    },
    []
  );

  const createReservation = useCallback(
    async (input: CreateReservationInput): Promise<Reservation | null> => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/reservations?spaId=${SPA_ID}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || "Failed to create reservation");
        }

        const result = (await response.json()) as ApiResponse<Reservation>;
        setState((prev) => ({
          ...prev,
          reservations: [...prev.reservations, result.data],
          isLoading: false,
          error: null,
        }));
        return result.data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create reservation");
        return null;
      }
    },
    []
  );

  const updateReservation = useCallback(
    async (id: string, input: UpdateReservationInput): Promise<Reservation | null> => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/reservations/${id}?spaId=${SPA_ID}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || "Failed to update reservation");
        }

        const result = (await response.json()) as ApiResponse<Reservation>;
        setState((prev) => ({
          ...prev,
          reservations: prev.reservations.map((res) =>
            res.reservationId === id ? result.data : res
          ),
          isLoading: false,
          error: null,
        }));
        return result.data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update reservation");
        return null;
      }
    },
    []
  );

  const cancelReservation = useCallback(
    async (id: string, reason?: string): Promise<boolean> => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/reservations/${id}?spaId=${SPA_ID}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "CANCELLED",
            cancellationReason: reason,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || "Failed to cancel reservation");
        }

        const result = (await response.json()) as ApiResponse<Reservation>;
        setState((prev) => ({
          ...prev,
          reservations: prev.reservations.map((res) =>
            res.reservationId === id ? result.data : res
          ),
          isLoading: false,
          error: null,
        }));
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to cancel reservation");
        return false;
      }
    },
    []
  );

  const deleteReservation = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/reservations/${id}?spaId=${SPA_ID}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to delete reservation");
      }

      setState((prev) => ({
        ...prev,
        reservations: prev.reservations.filter((res) => res.reservationId !== id),
        isLoading: false,
        error: null,
      }));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete reservation");
      return false;
    }
  }, []);

  return {
    ...state,
    fetchReservations,
    fetchCalendarReservations,
    createReservation,
    updateReservation,
    cancelReservation,
    deleteReservation,
    clearError,
  };
}
