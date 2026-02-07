"use client";

import { useState, useCallback } from "react";
import { API_BASE_URL } from "@/shared/api";
import type {
  Service,
  CreateServiceInput,
  UpdateServiceInput,
  ApiListResponse,
  ApiResponse,
} from "@/shared/types";

// For now, we use a hardcoded spa ID. This will come from auth context later.
const SPA_ID = "demo-spa";

interface UseServicesState {
  services: Service[];
  isLoading: boolean;
  error: string | null;
}

interface UseServicesReturn extends UseServicesState {
  fetchServices: () => Promise<void>;
  createService: (input: CreateServiceInput) => Promise<Service | null>;
  updateService: (id: string, input: UpdateServiceInput) => Promise<Service | null>;
  deleteService: (id: string) => Promise<boolean>;
  clearError: () => void;
}

export function useServices(): UseServicesReturn {
  const [state, setState] = useState<UseServicesState>({
    services: [],
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

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/services?spaId=${SPA_ID}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch services");
      }
      
      const result = (await response.json()) as ApiListResponse<Service>;
      setState({
        services: result.data,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch services");
    }
  }, []);

  const createService = useCallback(async (input: CreateServiceInput): Promise<Service | null> => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/services?spaId=${SPA_ID}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create service");
      }
      
      const result = (await response.json()) as ApiResponse<Service>;
      setState((prev) => ({
        ...prev,
        services: [...prev.services, result.data],
        isLoading: false,
        error: null,
      }));
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create service");
      return null;
    }
  }, []);

  const updateService = useCallback(
    async (id: string, input: UpdateServiceInput): Promise<Service | null> => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/services/${id}?spaId=${SPA_ID}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to update service");
        }
        
        const result = (await response.json()) as ApiResponse<Service>;
        setState((prev) => ({
          ...prev,
          services: prev.services.map((service) =>
            service.serviceId === id ? result.data : service
          ),
          isLoading: false,
          error: null,
        }));
        return result.data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update service");
        return null;
      }
    },
    []
  );

  const deleteService = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/services/${id}?spaId=${SPA_ID}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete service");
      }
      
      setState((prev) => ({
        ...prev,
        services: prev.services.filter((service) => service.serviceId !== id),
        isLoading: false,
        error: null,
      }));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete service");
      return false;
    }
  }, []);

  return {
    ...state,
    fetchServices,
    createService,
    updateService,
    deleteService,
    clearError,
  };
}
