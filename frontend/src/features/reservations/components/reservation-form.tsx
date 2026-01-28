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
import { Textarea } from "@/package/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/package/ui/select"
import type { Reservation, CreateReservationInput } from "../types"
import { ReservationStatus } from "../types"
import type { Service } from "@/features/services/types"
import type { Client } from "@/features/clients/types"
import type { Employee } from "@/features/employees/types"
import type { Room } from "@/features/rooms/types"

interface ReservationFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  reservation?: Reservation | null
  services: Service[]
  clients: Client[]
  employees: Employee[]
  rooms: Room[]
  onSubmit: (data: CreateReservationInput) => Promise<void>
  isLoading?: boolean
}

export function ReservationForm({
  open,
  onOpenChange,
  reservation,
  services,
  clients,
  employees,
  rooms,
  onSubmit,
  isLoading,
}: ReservationFormProps) {
  const t = useTranslations()
  const isEditing = !!reservation

  const [formData, setFormData] = useState<{
    serviceId: string
    clientId: string
    employeeId: string
    roomId: string
    date: string
    startTime: string
    endTime: string
    status: ReservationStatus
    notes: string
  }>({
    serviceId: "",
    clientId: "",
    employeeId: "",
    roomId: "",
    date: "",
    startTime: "",
    endTime: "",
    status: ReservationStatus.PENDING,
    notes: "",
  })

  useEffect(() => {
    if (reservation) {
      setFormData({
        serviceId: reservation.serviceId,
        clientId: reservation.clientId,
        employeeId: reservation.employeeId,
        roomId: reservation.roomId,
        date: reservation.date,
        startTime: reservation.startTime,
        endTime: reservation.endTime,
        status: reservation.status,
        notes: reservation.notes || "",
      })
    } else {
      // Set default date to today
      const today = new Date().toISOString().split("T")[0]
      setFormData({
        serviceId: "",
        clientId: "",
        employeeId: "",
        roomId: "",
        date: today,
        startTime: "",
        endTime: "",
        status: ReservationStatus.PENDING,
        notes: "",
      })
    }
  }, [reservation, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit({
      serviceId: formData.serviceId,
      clientId: formData.clientId,
      employeeId: formData.employeeId,
      roomId: formData.roomId,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      status: formData.status,
      notes: formData.notes || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? t("reservations.editReservation")
              : t("reservations.addReservation")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Service */}
            <div className="space-y-2">
              <Label htmlFor="serviceId">{t("reservations.service")}</Label>
              <Select
                value={formData.serviceId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, serviceId: value }))
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("reservations.selectService")} />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Client */}
            <div className="space-y-2">
              <Label htmlFor="clientId">{t("reservations.client")}</Label>
              <Select
                value={formData.clientId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, clientId: value }))
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("reservations.selectClient")} />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.firstName} {client.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Employee */}
            <div className="space-y-2">
              <Label htmlFor="employeeId">{t("reservations.employee")}</Label>
              <Select
                value={formData.employeeId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, employeeId: value }))
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("reservations.selectEmployee")} />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.firstName} {employee.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Room */}
            <div className="space-y-2">
              <Label htmlFor="roomId">{t("reservations.room")}</Label>
              <Select
                value={formData.roomId}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, roomId: value }))
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("reservations.selectRoom")} />
                </SelectTrigger>
                <SelectContent>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">{t("reservations.date")}</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, date: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startTime">{t("reservations.startTime")}</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, startTime: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">{t("reservations.endTime")}</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, endTime: e.target.value }))
                  }
                  required
                />
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">{t("reservations.status")}</Label>
              <Select
                value={formData.status}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    status: value as ReservationStatus,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ReservationStatus.PENDING}>
                    {t("reservations.statuses.pending")}
                  </SelectItem>
                  <SelectItem value={ReservationStatus.CONFIRMED}>
                    {t("reservations.statuses.confirmed")}
                  </SelectItem>
                  <SelectItem value={ReservationStatus.COMPLETED}>
                    {t("reservations.statuses.completed")}
                  </SelectItem>
                  <SelectItem value={ReservationStatus.CANCELLED}>
                    {t("reservations.statuses.cancelled")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">{t("reservations.notes")}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder={t("reservations.notesPlaceholder")}
                rows={3}
              />
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
