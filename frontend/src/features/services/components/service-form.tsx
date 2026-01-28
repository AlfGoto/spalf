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
import type { Service, CreateServiceInput } from "../types"
import { formatPrice, parsePriceToCents } from "../types"

interface ServiceFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  service?: Service | null
  onSubmit: (data: CreateServiceInput) => Promise<void>
  isLoading?: boolean
}

export function ServiceForm({
  open,
  onOpenChange,
  service,
  onSubmit,
  isLoading,
}: ServiceFormProps) {
  const t = useTranslations()
  const isEditing = !!service

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    duration: "",
    preparationTime: "",
    recoveryTime: "",
    cancellationDeadline: "",
    canReschedule: true,
  })

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name,
        description: service.description ?? "",
        price: formatPrice(service.price),
        duration: service.duration.toString(),
        preparationTime: service.preparationTime?.toString() ?? "",
        recoveryTime: service.recoveryTime?.toString() ?? "",
        cancellationDeadline: service.cancellationDeadline?.toString() ?? "",
        canReschedule: service.canReschedule,
      })
    } else {
      setFormData({
        name: "",
        description: "",
        price: "",
        duration: "",
        preparationTime: "",
        recoveryTime: "",
        cancellationDeadline: "",
        canReschedule: true,
      })
    }
  }, [service, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit({
      name: formData.name,
      description: formData.description || null,
      price: parsePriceToCents(formData.price),
      duration: parseInt(formData.duration, 10) || 0,
      preparationTime: formData.preparationTime
        ? parseInt(formData.preparationTime, 10)
        : null,
      recoveryTime: formData.recoveryTime
        ? parseInt(formData.recoveryTime, 10)
        : null,
      cancellationDeadline: formData.cancellationDeadline
        ? parseInt(formData.cancellationDeadline, 10)
        : null,
      canReschedule: formData.canReschedule,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("services.editService") : t("services.addService")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">{t("services.name")}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">{t("services.description")}</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder={t("services.descriptionPlaceholder")}
              />
            </div>

            {/* Price and Duration row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">{t("services.price")}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                    $
                  </span>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    className="pl-7"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, price: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">{t("services.duration")}</Label>
                <div className="relative">
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    className="pr-12"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        duration: e.target.value,
                      }))
                    }
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">
                    min
                  </span>
                </div>
              </div>
            </div>

            {/* Preparation and Recovery times */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="preparationTime">
                  {t("services.preparationTime")}
                </Label>
                <div className="relative">
                  <Input
                    id="preparationTime"
                    type="number"
                    min="0"
                    className="pr-12"
                    value={formData.preparationTime}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        preparationTime: e.target.value,
                      }))
                    }
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">
                    min
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="recoveryTime">{t("services.recoveryTime")}</Label>
                <div className="relative">
                  <Input
                    id="recoveryTime"
                    type="number"
                    min="0"
                    className="pr-12"
                    value={formData.recoveryTime}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        recoveryTime: e.target.value,
                      }))
                    }
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">
                    min
                  </span>
                </div>
              </div>
            </div>

            {/* Cancellation Deadline */}
            <div className="space-y-2">
              <Label htmlFor="cancellationDeadline">
                {t("services.cancellationDeadline")}
              </Label>
              <div className="relative">
                <Input
                  id="cancellationDeadline"
                  type="number"
                  min="0"
                  className="pr-12"
                  value={formData.cancellationDeadline}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      cancellationDeadline: e.target.value,
                    }))
                  }
                  placeholder={t("services.cancellationDeadlinePlaceholder")}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">
                  {t("services.hours")}
                </span>
              </div>
              <p className="text-xs text-neutral-500">
                {t("services.cancellationDeadlineHelp")}
              </p>
            </div>

            {/* Can Reschedule */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="canReschedule"
                checked={formData.canReschedule}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    canReschedule: e.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-neutral-300"
              />
              <Label htmlFor="canReschedule" className="cursor-pointer">
                {t("services.allowReschedule")}
              </Label>
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
