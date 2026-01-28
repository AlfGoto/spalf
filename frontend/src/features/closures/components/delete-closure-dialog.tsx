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
import type { Closure } from "../types"

interface DeleteClosureDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  closure: Closure | null
  onConfirm: () => Promise<void>
  isLoading?: boolean
}

export function DeleteClosureDialog({
  open,
  onOpenChange,
  closure,
  onConfirm,
  isLoading,
}: DeleteClosureDialogProps) {
  const t = useTranslations()

  if (!closure) return null

  const formattedDate = formatDate(closure.date)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("closures.deleteClosure")}</DialogTitle>
          <DialogDescription>
            {t("closures.deleteConfirmation", { date: formattedDate })}
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

function formatDate(dateString: string): string {
  const date = new Date(dateString + "T00:00:00")
  return date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}
