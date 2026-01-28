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
import type { Room } from "../types"

interface DeleteRoomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  room: Room | null
  onConfirm: () => Promise<void>
  isLoading?: boolean
}

export function DeleteRoomDialog({
  open,
  onOpenChange,
  room,
  onConfirm,
  isLoading,
}: DeleteRoomDialogProps) {
  const t = useTranslations()

  if (!room) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("rooms.deleteRoom")}</DialogTitle>
          <DialogDescription>
            {t("rooms.deleteConfirmation", {
              name: room.name,
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
