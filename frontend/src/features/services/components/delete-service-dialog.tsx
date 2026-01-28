"use client"

import { useTranslations } from "next-intl"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/package/ui/dialog"
import { Button } from "@/package/ui/button"
import type { Service } from "../types"

interface DeleteServiceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  service: Service | null
  onConfirm: () => Promise<void>
  isLoading?: boolean
}

export function DeleteServiceDialog({
  open,
  onOpenChange,
  service,
  onConfirm,
  isLoading,
}: DeleteServiceDialogProps) {
  const t = useTranslations()

  if (!service) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("services.deleteService")}</DialogTitle>
          <DialogDescription>
            {t("services.deleteConfirmation", {
              name: service.name,
            })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? t("common.loading") : t("common.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
