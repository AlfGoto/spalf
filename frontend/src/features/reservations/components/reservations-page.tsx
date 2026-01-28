"use client"

import { useTranslations } from "next-intl"
import { useState, useTransition } from "react"
import { Button } from "@/package/ui/button"
import { Plus, List, CalendarDays } from "lucide-react"
import { ReservationList } from "./reservation-list"
import { ReservationForm } from "./reservation-form"
import { DeleteReservationDialog } from "./delete-reservation-dialog"
import { WeekCalendar, type ReservationDropData } from "./week-calendar"
import type { Reservation, CreateReservationInput } from "../types"
import {
  createReservation,
  updateReservation,
  deleteReservation,
} from "../api"
import { formatDate } from "../types"
import type { Service } from "@/features/services/types"
import type { Client } from "@/features/clients/types"
import type { Employee } from "@/features/employees/types"
import type { Room } from "@/features/rooms/types"

type ViewMode = "list" | "calendar"

interface ReservationsPageProps {
  initialReservations: Reservation[]
  services: Service[]
  clients: Client[]
  employees: Employee[]
  rooms: Room[]
}

export function ReservationsPage({
  initialReservations,
  services,
  clients,
  employees,
  rooms,
}: ReservationsPageProps) {
  const t = useTranslations()
  const [isPending, startTransition] = useTransition()

  const [reservations, setReservations] =
    useState<Reservation[]>(initialReservations)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedReservation, setSelectedReservation] =
    useState<Reservation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>("calendar")
  const [currentDate, setCurrentDate] = useState(new Date())

  const handleAdd = () => {
    setSelectedReservation(null)
    setFormOpen(true)
  }

  const handleEdit = (reservation: Reservation) => {
    setSelectedReservation(reservation)
    setFormOpen(true)
  }

  const handleDeleteClick = (reservation: Reservation) => {
    setSelectedReservation(reservation)
    setDeleteDialogOpen(true)
  }

  const handleFormSubmit = async (data: CreateReservationInput) => {
    setError(null)
    startTransition(async () => {
      if (selectedReservation) {
        // Update existing reservation
        const result = await updateReservation(selectedReservation.id, data)
        if (result.error) {
          setError(result.error.message)
          return
        }
        if (result.data) {
          setReservations((prev) =>
            prev.map((r) =>
              r.id === selectedReservation.id ? result.data! : r
            )
          )
        }
      } else {
        // Create new reservation
        const result = await createReservation(data)
        if (result.error) {
          setError(result.error.message)
          return
        }
        if (result.data) {
          setReservations((prev) => [...prev, result.data!])
        }
      }
      setFormOpen(false)
      setSelectedReservation(null)
    })
  }

  const handleDeleteConfirm = async () => {
    if (!selectedReservation) return

    setError(null)
    startTransition(async () => {
      const result = await deleteReservation(selectedReservation.id)
      if (result.error) {
        setError(result.error.message)
        return
      }
      setReservations((prev) =>
        prev.filter((r) => r.id !== selectedReservation.id)
      )
      setDeleteDialogOpen(false)
      setSelectedReservation(null)
    })
  }

  const handleReservationDrop = async (data: ReservationDropData) => {
    const { reservation, newDate, newStartTime, newEndTime } = data

    setError(null)
    startTransition(async () => {
      const result = await updateReservation(reservation.id, {
        serviceId: reservation.serviceId,
        clientId: reservation.clientId,
        employeeId: reservation.employeeId,
        roomId: reservation.roomId,
        date: newDate,
        startTime: newStartTime,
        endTime: newEndTime,
        status: reservation.status,
        notes: reservation.notes ?? undefined,
      })

      if (result.error) {
        setError(result.error.message)
        return
      }

      if (result.data) {
        setReservations((prev) =>
          prev.map((r) => (r.id === reservation.id ? result.data! : r))
        )
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("nav.reservations")}</h1>
          <p className="text-neutral-500">{t("reservations.description")}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center rounded-md border border-neutral-200 p-1">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="px-3"
            >
              <List className="mr-2 h-4 w-4" />
              {t("reservations.listView")}
            </Button>
            <Button
              variant={viewMode === "calendar" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("calendar")}
              className="px-3"
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              {t("reservations.calendarView")}
            </Button>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            {t("reservations.addReservation")}
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {viewMode === "list" ? (
        <div className="rounded-lg border border-neutral-200">
          <ReservationList
            reservations={reservations}
            services={services}
            clients={clients}
            employees={employees}
            rooms={rooms}
            onEdit={handleEdit}
            onDelete={handleDeleteClick}
          />
        </div>
      ) : (
        <WeekCalendar
          reservations={reservations}
          services={services}
          clients={clients}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
          onReservationClick={handleEdit}
          onReservationDrop={handleReservationDrop}
        />
      )}

      <ReservationForm
        open={formOpen}
        onOpenChange={setFormOpen}
        reservation={selectedReservation}
        services={services}
        clients={clients}
        employees={employees}
        rooms={rooms}
        onSubmit={handleFormSubmit}
        isLoading={isPending}
      />

      <DeleteReservationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        reservation={selectedReservation}
        services={services}
        clients={clients}
        onConfirm={handleDeleteConfirm}
        isLoading={isPending}
      />
    </div>
  )
}
