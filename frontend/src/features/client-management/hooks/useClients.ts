"use client";

import { useState, useCallback } from "react";
import { API_BASE_URL } from "@/shared/api";
import type {
  Client,
  CreateClientInput,
  UpdateClientInput,
  ApiListResponse,
  ApiResponse,
} from "@/shared/types";

// For now, we use a hardcoded spa ID. This will come from auth context later.
const SPA_ID = "demo-spa";

interface UseClientsState {
  clients: Client[];
  isLoading: boolean;
  error: string | null;
}

interface UseClientsReturn extends UseClientsState {
  fetchClients: () => Promise<void>;
  createClient: (input: CreateClientInput) => Promise<Client | null>;
  updateClient: (id: string, input: UpdateClientInput) => Promise<Client | null>;
  deleteClient: (id: string) => Promise<boolean>;
  clearError: () => void;
}

export function useClients(): UseClientsReturn {
  const [state, setState] = useState<UseClientsState>({
    clients: [],
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

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/clients?spaId=${SPA_ID}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch clients");
      }
      
      const result = (await response.json()) as ApiListResponse<Client>;
      setState({
        clients: result.data,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch clients");
    }
  }, []);

  const createClient = useCallback(async (input: CreateClientInput): Promise<Client | null> => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/clients?spaId=${SPA_ID}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create client");
      }
      
      const result = (await response.json()) as ApiResponse<Client>;
      setState((prev) => ({
        ...prev,
        clients: [...prev.clients, result.data],
        isLoading: false,
        error: null,
      }));
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create client");
      return null;
    }
  }, []);

  const updateClient = useCallback(
    async (id: string, input: UpdateClientInput): Promise<Client | null> => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/clients/${id}?spaId=${SPA_ID}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to update client");
        }
        
        const result = (await response.json()) as ApiResponse<Client>;
        setState((prev) => ({
          ...prev,
          clients: prev.clients.map((client) =>
            client.clientId === id ? result.data : client
          ),
          isLoading: false,
          error: null,
        }));
        return result.data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update client");
        return null;
      }
    },
    []
  );

  const deleteClient = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/clients/${id}?spaId=${SPA_ID}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete client");
      }
      
      setState((prev) => ({
        ...prev,
        clients: prev.clients.filter((client) => client.clientId !== id),
        isLoading: false,
        error: null,
      }));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete client");
      return false;
    }
  }, []);

  return {
    ...state,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
    clearError,
  };
}
