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
import type { Client } from "../types"

interface DeleteClientDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client: Client | null
  onConfirm: () => Promise<void>
  isLoading?: boolean
}

export function DeleteClientDialog({
  open,
  onOpenChange,
  client,
  onConfirm,
  isLoading,
}: DeleteClientDialogProps) {
  const t = useTranslations()

  if (!client) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("clients.deleteClient")}</DialogTitle>
          <DialogDescription>
            {t("clients.deleteConfirmation", {
              name: `${client.firstName} ${client.lastName}`,
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
