"use client";

import { useState, useCallback } from "react";
import { API_BASE_URL } from "@/shared/api";
import type {
  Product,
  CreateProductInput,
  UpdateProductInput,
  ApiListResponse,
  ApiResponse,
} from "@/shared/types";

// For now, we use a hardcoded spa ID. This will come from auth context later.
const SPA_ID = "demo-spa";

interface UseProductsState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
}

interface UseProductsReturn extends UseProductsState {
  fetchProducts: () => Promise<void>;
  createProduct: (input: CreateProductInput) => Promise<Product | null>;
  updateProduct: (id: string, input: UpdateProductInput) => Promise<Product | null>;
  deleteProduct: (id: string) => Promise<boolean>;
  clearError: () => void;
}

export function useProducts(): UseProductsReturn {
  const [state, setState] = useState<UseProductsState>({
    products: [],
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

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/products?spaId=${SPA_ID}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      
      const result = (await response.json()) as ApiListResponse<Product>;
      setState({
        products: result.data,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch products");
    }
  }, []);

  const createProduct = useCallback(async (input: CreateProductInput): Promise<Product | null> => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/products?spaId=${SPA_ID}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create product");
      }
      
      const result = (await response.json()) as ApiResponse<Product>;
      setState((prev) => ({
        ...prev,
        products: [...prev.products, result.data],
        isLoading: false,
        error: null,
      }));
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create product");
      return null;
    }
  }, []);

  const updateProduct = useCallback(
    async (id: string, input: UpdateProductInput): Promise<Product | null> => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/products/${id}?spaId=${SPA_ID}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to update product");
        }
        
        const result = (await response.json()) as ApiResponse<Product>;
        setState((prev) => ({
          ...prev,
          products: prev.products.map((product) =>
            product.productId === id ? result.data : product
          ),
          isLoading: false,
          error: null,
        }));
        return result.data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update product");
        return null;
      }
    },
    []
  );

  const deleteProduct = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/products/${id}?spaId=${SPA_ID}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete product");
      }
      
      setState((prev) => ({
        ...prev,
        products: prev.products.filter((product) => product.productId !== id),
        isLoading: false,
        error: null,
      }));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete product");
      return false;
    }
  }, []);

  return {
    ...state,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    clearError,
  };
}
