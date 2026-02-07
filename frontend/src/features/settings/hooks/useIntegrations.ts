"use client";

import { useState, useCallback } from "react";
import { API_BASE_URL } from "@/shared/api";
import type {
  Integration,
  CreateIntegrationInput,
  UpdateIntegrationInput,
  IntegrationCreatedResponse,
  RegenerateSecretResponse,
  ApiListResponse,
  ApiResponse,
} from "@/shared/types";

// For now, we use a hardcoded spa ID. This will come from auth context later.
const SPA_ID = "demo-spa";

interface UseIntegrationsState {
  integrations: Integration[];
  isLoading: boolean;
  error: string | null;
}

interface UseIntegrationsReturn extends UseIntegrationsState {
  fetchIntegrations: () => Promise<void>;
  createIntegration: (input: CreateIntegrationInput) => Promise<IntegrationCreatedResponse | null>;
  updateIntegration: (id: string, input: UpdateIntegrationInput) => Promise<Integration | null>;
  deleteIntegration: (id: string) => Promise<boolean>;
  regenerateSecret: (id: string) => Promise<RegenerateSecretResponse | null>;
  clearError: () => void;
}

export function useIntegrations(): UseIntegrationsReturn {
  const [state, setState] = useState<UseIntegrationsState>({
    integrations: [],
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

  const fetchIntegrations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/integrations?spaId=${SPA_ID}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch integrations");
      }

      const result = (await response.json()) as ApiListResponse<Integration>;
      setState({
        integrations: result.data,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch integrations");
    }
  }, []);

  const createIntegration = useCallback(
    async (input: CreateIntegrationInput): Promise<IntegrationCreatedResponse | null> => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/integrations?spaId=${SPA_ID}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to create integration");
        }

        const result = (await response.json()) as ApiResponse<IntegrationCreatedResponse>;
        // Add integration to local state (without secret)
        const { secretToken, authorizationHeader, ...integration } = result.data;
        setState((prev) => ({
          ...prev,
          integrations: [...prev.integrations, integration as Integration],
          isLoading: false,
          error: null,
        }));
        return result.data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create integration");
        return null;
      }
    },
    []
  );

  const updateIntegration = useCallback(
    async (id: string, input: UpdateIntegrationInput): Promise<Integration | null> => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/integrations/${id}?spaId=${SPA_ID}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to update integration");
        }

        const result = (await response.json()) as ApiResponse<Integration>;
        setState((prev) => ({
          ...prev,
          integrations: prev.integrations.map((i) =>
            i.integrationId === id ? { ...i, ...result.data } : i
          ),
          isLoading: false,
          error: null,
        }));
        return result.data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update integration");
        return null;
      }
    },
    []
  );

  const deleteIntegration = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/integrations/${id}?spaId=${SPA_ID}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete integration");
      }

      setState((prev) => ({
        ...prev,
        integrations: prev.integrations.filter((i) => i.integrationId !== id),
        isLoading: false,
        error: null,
      }));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete integration");
      return false;
    }
  }, []);

  const regenerateSecret = useCallback(
    async (id: string): Promise<RegenerateSecretResponse | null> => {
      setLoading(true);
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/integrations/${id}/regenerate-secret?spaId=${SPA_ID}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to regenerate secret");
        }

        const result = (await response.json()) as ApiResponse<RegenerateSecretResponse>;
        setState((prev) => ({ ...prev, isLoading: false, error: null }));
        return result.data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to regenerate secret");
        return null;
      }
    },
    []
  );

  return {
    ...state,
    fetchIntegrations,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    regenerateSecret,
    clearError,
  };
}
