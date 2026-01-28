"use client"

import { useTranslations } from "next-intl"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/package/ui/table"
import { Button } from "@/package/ui/button"
import { Pencil, Trash2 } from "lucide-react"
import type { Employee } from "../types"

interface EmployeeListProps {
  employees: Employee[]
  onEdit: (employee: Employee) => void
  onDelete: (employee: Employee) => void
}

export function EmployeeList({ employees, onEdit, onDelete }: EmployeeListProps) {
  const t = useTranslations()

  if (employees.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-500">
        {t("employees.noEmployees")}
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("employees.firstName")}</TableHead>
          <TableHead>{t("employees.lastName")}</TableHead>
          <TableHead>{t("employees.email")}</TableHead>
          <TableHead>{t("employees.phone")}</TableHead>
          <TableHead>{t("employees.employmentType")}</TableHead>
          <TableHead className="w-[100px]">{t("common.actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {employees.map((employee) => (
          <TableRow key={employee.id}>
            <TableCell className="font-medium">{employee.firstName}</TableCell>
            <TableCell>{employee.lastName}</TableCell>
            <TableCell>{employee.email}</TableCell>
            <TableCell>{employee.phone || "-"}</TableCell>
            <TableCell>
              {employee.employmentType === "FULLTIME"
                ? t("employees.fullTime")
                : t("employees.freelance")}
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(employee)}
                  aria-label={t("common.edit")}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(employee)}
                  aria-label={t("common.delete")}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
