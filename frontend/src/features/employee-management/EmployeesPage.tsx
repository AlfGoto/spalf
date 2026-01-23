"use client";

import { useEffect, useState } from "react";
import { Button } from "@/package/ui/button";
import { useEmployees } from "./hooks/useEmployees";
import { EmployeeTable } from "./components/EmployeeTable";
import { EmployeeForm } from "./components/EmployeeForm";
import { DeleteConfirmDialog } from "./components/DeleteConfirmDialog";
import type { Employee, CreateEmployeeInput } from "@/shared/types";

export function EmployeesPage() {
  const {
    employees,
    isLoading,
    error,
    fetchEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
    clearError,
  } = useEmployees();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setIsFormOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsFormOpen(true);
  };

  const handleDeleteEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (data: CreateEmployeeInput) => {
    if (selectedEmployee) {
      const result = await updateEmployee(selectedEmployee.employeeId, data);
      if (result) {
        setIsFormOpen(false);
        setSelectedEmployee(null);
      }
    } else {
      const result = await createEmployee(data);
      if (result) {
        setIsFormOpen(false);
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedEmployee) {
      const success = await deleteEmployee(selectedEmployee.employeeId);
      if (success) {
        setIsDeleteDialogOpen(false);
        setSelectedEmployee(null);
      }
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Employees</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your spa employees and their schedules.
          </p>
        </div>
        <Button onClick={handleAddEmployee}>Add Employee</Button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-sm text-red-600">{error}</p>
          <Button variant="ghost" size="sm" onClick={clearError}>
            Dismiss
          </Button>
        </div>
      )}

      {isLoading && employees.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center text-gray-500">
          <p>Loading employees...</p>
        </div>
      ) : (
        <EmployeeTable
          employees={employees}
          onEdit={handleEditEmployee}
          onDelete={handleDeleteEmployee}
        />
      )}

      <EmployeeForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        employee={selectedEmployee}
        onSubmit={handleFormSubmit}
        isLoading={isLoading}
      />

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Employee"
        description={`Are you sure you want to delete ${selectedEmployee?.firstName} ${selectedEmployee?.lastName}? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        isLoading={isLoading}
      />
    </div>
  );
}
