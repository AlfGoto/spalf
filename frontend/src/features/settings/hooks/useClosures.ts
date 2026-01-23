"use client";

import { useState, useCallback } from "react";
import { API_BASE_URL } from "@/shared/api";
import type {
  Closure,
  CreateClosureInput,
  ApiListResponse,
  ApiResponse,
} from "@/shared/types";

// For now, we use a hardcoded spa ID. This will come from auth context later.
const SPA_ID = "demo-spa";

interface UseClosuresState {
  closures: Closure[];
  isLoading: boolean;
  error: string | null;
}

interface UseClosuresReturn extends UseClosuresState {
  fetchClosures: (startDate?: string, endDate?: string) => Promise<void>;
  createClosure: (input: CreateClosureInput) => Promise<Closure | null>;
  deleteClosure: (id: string) => Promise<boolean>;
  clearError: () => void;
}

export function useClosures(): UseClosuresReturn {
  const [state, setState] = useState<UseClosuresState>({
    closures: [],
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

  const fetchClosures = useCallback(async (startDate?: string, endDate?: string) => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/api/closures?spaId=${SPA_ID}`;
      if (startDate && endDate) {
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      
      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch closures");
      }
      
      const result = (await response.json()) as ApiListResponse<Closure>;
      // Sort closures by date (ascending)
      const sortedClosures = result.data.sort((a, b) => a.date.localeCompare(b.date));
      setState({
        closures: sortedClosures,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch closures");
    }
  }, []);

  const createClosure = useCallback(async (input: CreateClosureInput): Promise<Closure | null> => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/closures?spaId=${SPA_ID}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create closure");
      }
      
      const result = (await response.json()) as ApiResponse<Closure>;
      setState((prev) => {
        const newClosures = [...prev.closures, result.data].sort((a, b) => 
          a.date.localeCompare(b.date)
        );
        return {
          ...prev,
          closures: newClosures,
          isLoading: false,
          error: null,
        };
      });
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create closure");
      return null;
    }
  }, []);

  const deleteClosure = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/closures/${id}?spaId=${SPA_ID}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete closure");
      }
      
      setState((prev) => ({
        ...prev,
        closures: prev.closures.filter((closure) => closure.closureId !== id),
        isLoading: false,
        error: null,
      }));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete closure");
      return false;
    }
  }, []);

  return {
    ...state,
    fetchClosures,
    createClosure,
    deleteClosure,
    clearError,
  };
}
