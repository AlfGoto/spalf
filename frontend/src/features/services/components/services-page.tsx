"use client"

import { useTranslations } from "next-intl"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/package/ui/button"
import { Plus } from "lucide-react"
import { ServiceList } from "./service-list"
import { ServiceForm } from "./service-form"
import { DeleteServiceDialog } from "./delete-service-dialog"
import type { Service, CreateServiceInput } from "../types"
import { createService, updateService, deleteService } from "../api"

interface ServicesPageProps {
  initialServices: Service[]
}

export function ServicesPage({ initialServices }: ServicesPageProps) {
  const t = useTranslations()
  const [isPending, startTransition] = useTransition()

  const [services, setServices] = useState<Service[]>(initialServices)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<Service | null>(null)

  const handleAdd = () => {
    setSelectedService(null)
    setFormOpen(true)
  }

  const handleEdit = (service: Service) => {
    setSelectedService(service)
    setFormOpen(true)
  }

  const handleDeleteClick = (service: Service) => {
    setSelectedService(service)
    setDeleteDialogOpen(true)
  }

  const handleFormSubmit = async (data: CreateServiceInput) => {
    startTransition(async () => {
      if (selectedService) {
        const result = await updateService(selectedService.id, data)
        if (result.error) {
          toast.error(result.error.message)
          return
        }
        if (result.data) {
          setServices((prev) =>
            prev.map((s) => (s.id === selectedService.id ? result.data! : s))
          )
          toast.success(t("common.success"))
        }
      } else {
        const result = await createService(data)
        if (result.error) {
          toast.error(result.error.message)
          return
        }
        if (result.data) {
          setServices((prev) => [...prev, result.data!])
          toast.success(t("common.success"))
        }
      }
      setFormOpen(false)
      setSelectedService(null)
    })
  }

  const handleDeleteConfirm = async () => {
    if (!selectedService) return

    startTransition(async () => {
      const result = await deleteService(selectedService.id)
      if (result.error) {
        toast.error(result.error.message)
        return
      }
      setServices((prev) => prev.filter((s) => s.id !== selectedService.id))
      toast.success(t("common.success"))
      setDeleteDialogOpen(false)
      setSelectedService(null)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("nav.services")}</h1>
          <p className="text-neutral-500">{t("services.description")}</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          {t("services.addService")}
        </Button>
      </div>

      <div className="rounded-lg border border-neutral-200">
        <ServiceList services={services} onEdit={handleEdit} onDelete={handleDeleteClick} />
      </div>

      <ServiceForm
        open={formOpen}
        onOpenChange={setFormOpen}
        service={selectedService}
        onSubmit={handleFormSubmit}
        isLoading={isPending}
      />

      <DeleteServiceDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        service={selectedService}
        onConfirm={handleDeleteConfirm}
        isLoading={isPending}
      />
    </div>
  )
}
