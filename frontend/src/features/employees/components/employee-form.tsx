"use client"

import { useTranslations } from "next-intl"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/package/ui/dialog"
import { Button } from "@/package/ui/button"
import { Input } from "@/package/ui/input"
import { Label } from "@/package/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/package/ui/select"
import type { Employee, CreateEmployeeInput, EmploymentType } from "../types"

interface EmployeeFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee?: Employee | null
  onSubmit: (data: CreateEmployeeInput) => Promise<void>
  isLoading?: boolean
}

export function EmployeeForm({
  open,
  onOpenChange,
  employee,
  onSubmit,
  isLoading,
}: EmployeeFormProps) {
  const t = useTranslations()
  const isEditing = !!employee

  const [formData, setFormData] = useState<CreateEmployeeInput>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    employmentType: "FULLTIME",
  })

  useEffect(() => {
    if (employee) {
      setFormData({
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        phone: employee.phone || "",
        employmentType: employee.employmentType,
      })
    } else {
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        employmentType: "FULLTIME",
      })
    }
  }, [employee, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit({
      ...formData,
      phone: formData.phone || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("employees.editEmployee") : t("employees.addEmployee")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t("employees.firstName")}</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, firstName: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t("employees.lastName")}</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, lastName: e.target.value }))
                  }
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("employees.email")}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t("employees.phone")}</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employmentType">{t("employees.employmentType")}</Label>
              <Select
                value={formData.employmentType}
                onValueChange={(value: EmploymentType) =>
                  setFormData((prev) => ({ ...prev, employmentType: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FULLTIME">{t("employees.fullTime")}</SelectItem>
                  <SelectItem value="FREELANCE">{t("employees.freelance")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t("common.loading") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
