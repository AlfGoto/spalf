"use client"

import { useTranslations } from "next-intl"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/package/ui/button"
import { Plus } from "lucide-react"
import { ClosureList } from "./closure-list"
import { ClosureForm } from "./closure-form"
import { DeleteClosureDialog } from "./delete-closure-dialog"
import type { Closure, CreateClosureInput } from "../types"
import { createClosure, deleteClosure } from "../api"

interface ClosuresPageProps {
  initialClosures: Closure[]
}

export function ClosuresPage({ initialClosures }: ClosuresPageProps) {
  const t = useTranslations()
  const [isPending, startTransition] = useTransition()

  const [closures, setClosures] = useState<Closure[]>(initialClosures)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedClosure, setSelectedClosure] = useState<Closure | null>(null)

  const handleAdd = () => {
    setFormOpen(true)
  }

  const handleDeleteClick = (closure: Closure) => {
    setSelectedClosure(closure)
    setDeleteDialogOpen(true)
  }

  const handleFormSubmit = async (data: CreateClosureInput) => {
    startTransition(async () => {
      const result = await createClosure(data)
      if (result.error) {
        toast.error(result.error.message)
        return
      }
      if (result.data) {
        setClosures((prev) => [...prev, result.data!])
        toast.success(t("common.success"))
      }
      setFormOpen(false)
    })
  }

  const handleDeleteConfirm = async () => {
    if (!selectedClosure) return

    startTransition(async () => {
      const result = await deleteClosure(selectedClosure.id)
      if (result.error) {
        toast.error(result.error.message)
        return
      }
      setClosures((prev) => prev.filter((c) => c.id !== selectedClosure.id))
      toast.success(t("common.success"))
      setDeleteDialogOpen(false)
      setSelectedClosure(null)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("nav.closures")}</h1>
          <p className="text-neutral-500">{t("closures.description")}</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          {t("closures.addClosure")}
        </Button>
      </div>

      <div className="rounded-lg border border-neutral-200">
        <ClosureList closures={closures} onDelete={handleDeleteClick} />
      </div>

      <ClosureForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        isLoading={isPending}
      />

      <DeleteClosureDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        closure={selectedClosure}
        onConfirm={handleDeleteConfirm}
        isLoading={isPending}
      />
    </div>
  )
}
