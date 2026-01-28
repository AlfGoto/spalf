"use client"

import { useMemo, useCallback, memo } from "react"
import { useTranslations } from "next-intl"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/package/ui/table"
import { Button } from "@/package/ui/button"
import { Pencil, Trash2 } from "lucide-react"
import type { Reservation } from "../types"
import { formatDate, formatTime, getStatusColor } from "../types"
import type { Service } from "@/features/services/types"
import type { Client } from "@/features/clients/types"
import type { Employee } from "@/features/employees/types"
import type { Room } from "@/features/rooms/types"

interface ReservationListProps {
  reservations: Reservation[]
  services: Service[]
  clients: Client[]
  employees: Employee[]
  rooms: Room[]
  onEdit: (reservation: Reservation) => void
  onDelete: (reservation: Reservation) => void
}

// Memoized row component to prevent unnecessary re-renders
interface ReservationRowProps {
  reservation: Reservation
  serviceName: string
  clientName: string
  employeeName: string
  roomName: string
  onEdit: (reservation: Reservation) => void
  onDelete: (reservation: Reservation) => void
}

const ReservationRow = memo(function ReservationRow({
  reservation,
  serviceName,
  clientName,
  employeeName,
  roomName,
  onEdit,
  onDelete,
}: ReservationRowProps) {
  const t = useTranslations()

  return (
    <TableRow>
      <TableCell className="font-medium">
        {formatDate(reservation.date)}
      </TableCell>
      <TableCell>
        {formatTime(reservation.startTime)} - {formatTime(reservation.endTime)}
      </TableCell>
      <TableCell>{serviceName}</TableCell>
      <TableCell>{clientName}</TableCell>
      <TableCell>{employeeName}</TableCell>
      <TableCell>{roomName}</TableCell>
      <TableCell>
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
            reservation.status
          )}`}
        >
          {t(`reservations.statuses.${reservation.status.toLowerCase()}`)}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(reservation)}
            aria-label={t("common.edit")}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(reservation)}
            aria-label={t("common.delete")}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
})

export function ReservationList({
  reservations,
  services,
  clients,
  employees,
  rooms,
  onEdit,
  onDelete,
}: ReservationListProps) {
  const t = useTranslations()

  // Memoize lookup maps for O(1) access instead of O(n) find() calls
  const serviceMap = useMemo(
    () => new Map(services.map((s) => [s.id, s.name])),
    [services]
  )
  const clientMap = useMemo(
    () => new Map(clients.map((c) => [c.id, `${c.firstName} ${c.lastName}`])),
    [clients]
  )
  const employeeMap = useMemo(
    () => new Map(employees.map((e) => [e.id, `${e.firstName} ${e.lastName}`])),
    [employees]
  )
  const roomMap = useMemo(
    () => new Map(rooms.map((r) => [r.id, r.name])),
    [rooms]
  )

  // Stable callback references for row components
  const handleEdit = useCallback(
    (reservation: Reservation) => onEdit(reservation),
    [onEdit]
  )
  const handleDelete = useCallback(
    (reservation: Reservation) => onDelete(reservation),
    [onDelete]
  )

  if (reservations.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-500">
        {t("reservations.noReservations")}
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("reservations.date")}</TableHead>
          <TableHead>{t("reservations.time")}</TableHead>
          <TableHead>{t("reservations.service")}</TableHead>
          <TableHead>{t("reservations.client")}</TableHead>
          <TableHead>{t("reservations.employee")}</TableHead>
          <TableHead>{t("reservations.room")}</TableHead>
          <TableHead>{t("reservations.status")}</TableHead>
          <TableHead className="w-[100px]">{t("common.actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reservations.map((reservation) => (
          <ReservationRow
            key={reservation.id}
            reservation={reservation}
            serviceName={serviceMap.get(reservation.serviceId) || reservation.serviceId}
            clientName={clientMap.get(reservation.clientId) || reservation.clientId}
            employeeName={employeeMap.get(reservation.employeeId) || reservation.employeeId}
            roomName={roomMap.get(reservation.roomId) || reservation.roomId}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </TableBody>
    </Table>
  )
}
