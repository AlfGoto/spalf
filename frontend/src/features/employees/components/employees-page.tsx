"use client"

import { useTranslations } from "next-intl"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/package/ui/button"
import { Plus } from "lucide-react"
import { EmployeeList } from "./employee-list"
import { EmployeeForm } from "./employee-form"
import { DeleteEmployeeDialog } from "./delete-employee-dialog"
import type { Employee, CreateEmployeeInput } from "../types"
import {
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "../api"

interface EmployeesPageProps {
  initialEmployees: Employee[]
}

export function EmployeesPage({ initialEmployees }: EmployeesPageProps) {
  const t = useTranslations()
  const [isPending, startTransition] = useTransition()

  const [employees, setEmployees] = useState<Employee[]>(initialEmployees)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null)

  const handleAdd = () => {
    setSelectedEmployee(null)
    setFormOpen(true)
  }

  const handleEdit = (employee: Employee) => {
    setSelectedEmployee(employee)
    setFormOpen(true)
  }

  const handleDeleteClick = (employee: Employee) => {
    setSelectedEmployee(employee)
    setDeleteDialogOpen(true)
  }

  const handleFormSubmit = async (data: CreateEmployeeInput) => {
    startTransition(async () => {
      if (selectedEmployee) {
        // Update existing employee
        const result = await updateEmployee(selectedEmployee.id, data)
        if (result.error) {
          toast.error(result.error.message)
          return
        }
        if (result.data) {
          setEmployees((prev) =>
            prev.map((e) => (e.id === selectedEmployee.id ? result.data! : e))
          )
          toast.success(t("common.success"))
        }
      } else {
        // Create new employee
        const result = await createEmployee(data)
        if (result.error) {
          toast.error(result.error.message)
          return
        }
        if (result.data) {
          setEmployees((prev) => [...prev, result.data!])
          toast.success(t("common.success"))
        }
      }
      setFormOpen(false)
      setSelectedEmployee(null)
    })
  }

  const handleDeleteConfirm = async () => {
    if (!selectedEmployee) return

    startTransition(async () => {
      const result = await deleteEmployee(selectedEmployee.id)
      if (result.error) {
        toast.error(result.error.message)
        return
      }
      setEmployees((prev) => prev.filter((e) => e.id !== selectedEmployee.id))
      toast.success(t("common.success"))
      setDeleteDialogOpen(false)
      setSelectedEmployee(null)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("nav.employees")}</h1>
          <p className="text-neutral-500">{t("employees.description")}</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          {t("employees.addEmployee")}
        </Button>
      </div>

      <div className="rounded-lg border border-neutral-200">
        <EmployeeList
          employees={employees}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
        />
      </div>

      <EmployeeForm
        open={formOpen}
        onOpenChange={setFormOpen}
        employee={selectedEmployee}
        onSubmit={handleFormSubmit}
        isLoading={isPending}
      />

      <DeleteEmployeeDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        employee={selectedEmployee}
        onConfirm={handleDeleteConfirm}
        isLoading={isPending}
      />
    </div>
  )
}
