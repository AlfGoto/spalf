"use client";

import { useState, useCallback } from "react";
import { API_BASE_URL } from "@/shared/api";
import type {
  Employee,
  CreateEmployeeInput,
  UpdateEmployeeInput,
  ApiListResponse,
  ApiResponse,
} from "@/shared/types";

// For now, we use a hardcoded spa ID. This will come from auth context later.
const SPA_ID = "demo-spa";

interface UseEmployeesState {
  employees: Employee[];
  isLoading: boolean;
  error: string | null;
}

interface UseEmployeesReturn extends UseEmployeesState {
  fetchEmployees: () => Promise<void>;
  createEmployee: (input: CreateEmployeeInput) => Promise<Employee | null>;
  updateEmployee: (id: string, input: UpdateEmployeeInput) => Promise<Employee | null>;
  deleteEmployee: (id: string) => Promise<boolean>;
  clearError: () => void;
}

export function useEmployees(): UseEmployeesReturn {
  const [state, setState] = useState<UseEmployeesState>({
    employees: [],
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

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/employees?spaId=${SPA_ID}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch employees");
      }
      
      const result = (await response.json()) as ApiListResponse<Employee>;
      setState({
        employees: result.data,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch employees");
    }
  }, []);

  const createEmployee = useCallback(async (input: CreateEmployeeInput): Promise<Employee | null> => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/employees?spaId=${SPA_ID}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to create employee");
      }
      
      const result = (await response.json()) as ApiResponse<Employee>;
      setState((prev) => ({
        ...prev,
        employees: [...prev.employees, result.data],
        isLoading: false,
        error: null,
      }));
      return result.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create employee");
      return null;
    }
  }, []);

  const updateEmployee = useCallback(
    async (id: string, input: UpdateEmployeeInput): Promise<Employee | null> => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/employees/${id}?spaId=${SPA_ID}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(input),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to update employee");
        }
        
        const result = (await response.json()) as ApiResponse<Employee>;
        setState((prev) => ({
          ...prev,
          employees: prev.employees.map((emp) =>
            emp.employeeId === id ? result.data : emp
          ),
          isLoading: false,
          error: null,
        }));
        return result.data;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to update employee");
        return null;
      }
    },
    []
  );

  const deleteEmployee = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/employees/${id}?spaId=${SPA_ID}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete employee");
      }
      
      setState((prev) => ({
        ...prev,
        employees: prev.employees.filter((emp) => emp.employeeId !== id),
        isLoading: false,
        error: null,
      }));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete employee");
      return false;
    }
  }, []);

  return {
    ...state,
    fetchEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    clearError,
  };
}
