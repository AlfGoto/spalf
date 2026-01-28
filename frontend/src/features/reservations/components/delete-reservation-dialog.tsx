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
import type { Reservation } from "../types"
import { formatDate, formatTime } from "../types"
import type { Service } from "@/features/services/types"
import type { Client } from "@/features/clients/types"

interface DeleteReservationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reservation: Reservation | null
  services: Service[]
  clients: Client[]
  onConfirm: () => Promise<void>
  isLoading?: boolean
}

export function DeleteReservationDialog({
  open,
  onOpenChange,
  reservation,
  services,
  clients,
  onConfirm,
  isLoading,
}: DeleteReservationDialogProps) {
  const t = useTranslations()

  if (!reservation) return null

  const service = services.find((s) => s.id === reservation.serviceId)
  const client = clients.find((c) => c.id === reservation.clientId)
  const clientName = client
    ? `${client.firstName} ${client.lastName}`
    : reservation.clientId

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("reservations.deleteReservation")}</DialogTitle>
          <DialogDescription>
            {t("reservations.deleteConfirmation", {
              service: service?.name || reservation.serviceId,
              client: clientName,
              date: formatDate(reservation.date),
              time: formatTime(reservation.startTime),
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
