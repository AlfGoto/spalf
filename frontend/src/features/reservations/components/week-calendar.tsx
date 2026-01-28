"use client"

import { useMemo, useState, useCallback, type DragEvent } from "react"
import { useTranslations } from "next-intl"
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  isSameDay,
  parseISO,
} from "date-fns"
import { Button } from "@/package/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { Reservation } from "../types"
import { getStatusColor } from "../types"
import type { Service } from "@/features/services/types"
import type { Client } from "@/features/clients/types"

export interface ReservationDropData {
  reservation: Reservation
  newDate: string
  newStartTime: string
  newEndTime: string
}

interface WeekCalendarProps {
  reservations: Reservation[]
  services: Service[]
  clients: Client[]
  currentDate: Date
  onDateChange: (date: Date) => void
  onReservationClick?: (reservation: Reservation) => void
  onReservationDrop?: (data: ReservationDropData) => void
}

// Generate time slots from 8:00 to 20:00
const TIME_SLOTS = Array.from({ length: 13 }, (_, i) => {
  const hour = 8 + i
  return `${hour.toString().padStart(2, "0")}:00`
})

export function WeekCalendar({
  reservations,
  services,
  clients,
  currentDate,
  onDateChange,
  onReservationClick,
  onReservationDrop,
}: WeekCalendarProps) {
  const t = useTranslations()
  const [draggingReservationId, setDraggingReservationId] = useState<string | null>(null)
  const [dropTargetDay, setDropTargetDay] = useState<string | null>(null)

  // Memoize today to avoid creating new Date on every render
  const today = useMemo(() => new Date(), [])

  // Get days of the current week (Monday to Sunday)
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 })
    const end = endOfWeek(currentDate, { weekStartsOn: 1 })
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  // Memoize lookup maps for O(1) access instead of O(n) find() calls
  const serviceMap = useMemo(
    () => new Map(services.map((s) => [s.id, s.name])),
    [services]
  )
  const clientMap = useMemo(
    () => new Map(clients.map((c) => [c.id, `${c.firstName} ${c.lastName}`])),
    [clients]
  )

  // Get service name - O(1) lookup
  const getServiceName = useCallback(
    (id: string) => serviceMap.get(id) || "",
    [serviceMap]
  )

  // Get client name - O(1) lookup
  const getClientName = useCallback(
    (id: string) => clientMap.get(id) || "",
    [clientMap]
  )

  // Get reservations for a specific day
  const getReservationsForDay = (day: Date) => {
    return reservations.filter((r) => isSameDay(parseISO(r.date), day))
  }

  // Calculate position and height for a reservation
  const getReservationStyle = (reservation: Reservation) => {
    const startHour = parseInt(reservation.startTime.split(":")[0])
    const startMinute = parseInt(reservation.startTime.split(":")[1])
    const endHour = parseInt(reservation.endTime.split(":")[0])
    const endMinute = parseInt(reservation.endTime.split(":")[1])

    // Calculate position relative to 8:00
    const startOffset = (startHour - 8) * 60 + startMinute
    const endOffset = (endHour - 8) * 60 + endMinute
    const duration = endOffset - startOffset

    // Each hour slot is 60px tall
    const top = (startOffset / 60) * 60
    const height = Math.max((duration / 60) * 60, 30) // Minimum 30px height

    return { top, height }
  }

  // Calculate reservation duration in minutes
  const getReservationDuration = (reservation: Reservation): number => {
    const startHour = parseInt(reservation.startTime.split(":")[0])
    const startMinute = parseInt(reservation.startTime.split(":")[1])
    const endHour = parseInt(reservation.endTime.split(":")[0])
    const endMinute = parseInt(reservation.endTime.split(":")[1])
    return (endHour * 60 + endMinute) - (startHour * 60 + startMinute)
  }

  // Convert pixel position to time
  const pixelToTime = (pixelY: number): string => {
    // Snap to 15-minute intervals
    const totalMinutes = Math.round((pixelY / 60) * 60 / 15) * 15
    const hour = 8 + Math.floor(totalMinutes / 60)
    const minute = totalMinutes % 60
    // Clamp to calendar bounds (8:00 - 20:00)
    const clampedHour = Math.max(8, Math.min(hour, 20))
    return `${clampedHour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
  }

  // Add minutes to a time string
  const addMinutesToTime = (time: string, minutes: number): string => {
    const [hour, minute] = time.split(":").map(Number)
    const totalMinutes = hour * 60 + minute + minutes
    const newHour = Math.floor(totalMinutes / 60)
    const newMinute = totalMinutes % 60
    return `${newHour.toString().padStart(2, "0")}:${newMinute.toString().padStart(2, "0")}`
  }

  // Handle drag start
  const handleDragStart = useCallback((e: DragEvent<HTMLButtonElement>, reservation: Reservation) => {
    // Don't allow dragging cancelled reservations
    if (reservation.status === "CANCELLED") {
      e.preventDefault()
      return
    }
    setDraggingReservationId(reservation.id)
    e.dataTransfer.setData("application/json", JSON.stringify(reservation))
    e.dataTransfer.effectAllowed = "move"
  }, [])

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    setDraggingReservationId(null)
    setDropTargetDay(null)
  }, [])

  // Handle drag over on day column
  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>, dayIso: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDropTargetDay(dayIso)
  }, [])

  // Handle drag leave on day column
  const handleDragLeave = useCallback(() => {
    setDropTargetDay(null)
  }, [])

  // Handle drop on day column
  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>, day: Date) => {
    e.preventDefault()
    setDropTargetDay(null)
    setDraggingReservationId(null)

    if (!onReservationDrop) return

    try {
      const reservation = JSON.parse(e.dataTransfer.getData("application/json")) as Reservation

      // Get drop position relative to the day column
      const rect = e.currentTarget.getBoundingClientRect()
      const y = e.clientY - rect.top

      // Calculate new time from drop position
      const newStartTime = pixelToTime(y)
      const duration = getReservationDuration(reservation)
      const newEndTime = addMinutesToTime(newStartTime, duration)

      // Format date as YYYY-MM-DD
      const newDate = format(day, "yyyy-MM-dd")

      // Only trigger if something changed
      if (newDate !== reservation.date || newStartTime !== reservation.startTime) {
        onReservationDrop({
          reservation,
          newDate,
          newStartTime,
          newEndTime,
        })
      }
    } catch {
      // Invalid JSON or missing data
    }
  }, [onReservationDrop])

  const handlePrevWeek = () => {
    onDateChange(subWeeks(currentDate, 1))
  }

  const handleNextWeek = () => {
    onDateChange(addWeeks(currentDate, 1))
  }

  const handleToday = () => {
    onDateChange(new Date())
  }

  return (
    <div className="flex flex-col">
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={handleToday}>
            {t("reservations.today")}
          </Button>
        </div>
        <div className="text-right">
          <h2 className="text-lg font-medium">
            {format(weekDays[0], "MMM d")} - {format(weekDays[6], "MMM d, yyyy")}
          </h2>
          {onReservationDrop && (
            <p className="text-xs text-neutral-400">{t("reservations.dragToReschedule")}</p>
          )}
        </div>
      </div>

      {/* Calendar grid */}
      <div className="border border-neutral-200 rounded-lg overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-8 border-b border-neutral-200 bg-neutral-50">
          <div className="p-2 border-r border-neutral-200" />
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className={`p-2 text-center border-r border-neutral-200 last:border-r-0 ${
                isSameDay(day, today) ? "bg-neutral-100 font-medium" : ""
              }`}
            >
              <div className="text-sm text-neutral-500">
                {format(day, "EEE")}
              </div>
              <div className="text-lg">{format(day, "d")}</div>
            </div>
          ))}
        </div>

        {/* Time slots */}
        <div className="grid grid-cols-8">
          {/* Time column */}
          <div className="border-r border-neutral-200">
            {TIME_SLOTS.map((time) => (
              <div
                key={time}
                className="h-[60px] border-b border-neutral-100 text-xs text-neutral-500 pr-2 text-right pt-1"
              >
                {time}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day) => {
            const dayReservations = getReservationsForDay(day)
            const dayIso = day.toISOString()
            const isDropTarget = dropTargetDay === dayIso

            return (
              <div
                key={dayIso}
                className={`border-r border-neutral-200 last:border-r-0 relative transition-colors ${
                  isDropTarget ? "bg-blue-50" : ""
                }`}
                onDragOver={(e) => handleDragOver(e, dayIso)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, day)}
              >
                {/* Grid lines */}
                {TIME_SLOTS.map((time) => (
                  <div
                    key={time}
                    className="h-[60px] border-b border-neutral-100"
                  />
                ))}

                {/* Reservations */}
                {dayReservations.map((reservation) => {
                  const style = getReservationStyle(reservation)
                  const statusColor = getStatusColor(reservation.status)
                  const isDragging = draggingReservationId === reservation.id
                  const canDrag = reservation.status !== "CANCELLED" && !!onReservationDrop

                  return (
                    <button
                      key={reservation.id}
                      onClick={() => onReservationClick?.(reservation)}
                      draggable={canDrag}
                      onDragStart={(e) => handleDragStart(e, reservation)}
                      onDragEnd={handleDragEnd}
                      className={`absolute left-1 right-1 rounded px-1 py-0.5 text-xs overflow-hidden hover:opacity-80 transition-opacity ${statusColor} ${
                        canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"
                      } ${isDragging ? "opacity-50" : ""}`}
                      style={{
                        top: `${style.top}px`,
                        height: `${style.height}px`,
                      }}
                    >
                      <div className="font-medium truncate">
                        {reservation.startTime} - {getServiceName(reservation.serviceId)}
                      </div>
                      <div className="truncate opacity-75">
                        {getClientName(reservation.clientId)}
                      </div>
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
