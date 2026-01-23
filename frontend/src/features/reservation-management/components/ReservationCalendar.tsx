"use client";

import { useMemo } from "react";
import { Button } from "@/package/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/package/ui/select";
import type {
  Reservation,
  Employee,
  Room,
  Service,
  Client,
} from "@/shared/types";
import { cn } from "@/package/lib/utils";

interface ReservationCalendarProps {
  reservations: Reservation[];
  employees: Employee[];
  rooms: Room[];
  services: Service[];
  clients: Client[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onReservationClick: (reservation: Reservation) => void;
  onTimeSlotClick: (date: string, time: string) => void;
  viewType: "day" | "week";
  onViewTypeChange: (type: "day" | "week") => void;
  filterEmployeeId?: string;
  filterRoomId?: string;
  onFilterEmployeeChange: (employeeId: string | undefined) => void;
  onFilterRoomChange: (roomId: string | undefined) => void;
}

// Generate time slots from 8:00 to 20:00 (configurable)
const HOURS_START = 8;
const HOURS_END = 20;
const SLOT_HEIGHT = 60; // pixels per hour

function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let hour = HOURS_START; hour < HOURS_END; hour++) {
    slots.push(`${hour.toString().padStart(2, "0")}:00`);
  }
  return slots;
}

function formatDateHeader(date: Date): string {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return `${days[date.getDay()]} ${date.getDate()}`;
}

function getWeekDates(date: Date): Date[] {
  const week: Date[] = [];
  const start = new Date(date);
  start.setDate(start.getDate() - start.getDay()); // Start from Sunday

  for (let i = 0; i < 7; i++) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    week.push(day);
  }
  return week;
}

function timeToPixels(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return (hours - HOURS_START) * SLOT_HEIGHT + (minutes / 60) * SLOT_HEIGHT;
}

function durationToPixels(startTime: string, endTime: string): number {
  const start = timeToPixels(startTime);
  const end = timeToPixels(endTime);
  return end - start;
}

function minutesToPixels(minutes: number): number {
  return (minutes / 60) * SLOT_HEIGHT;
}

function getStatusColor(status: string): string {
  switch (status) {
    case "CONFIRMED":
      return "bg-blue-100 border-blue-300 hover:bg-blue-200";
    case "PENDING":
      return "bg-yellow-100 border-yellow-300 hover:bg-yellow-200";
    case "COMPLETED":
      return "bg-green-100 border-green-300 hover:bg-green-200";
    case "CANCELLED":
      return "bg-red-100 border-red-300 hover:bg-red-200 opacity-50";
    default:
      return "bg-gray-100 border-gray-300 hover:bg-gray-200";
  }
}

export function ReservationCalendar({
  reservations,
  employees,
  rooms,
  services,
  clients,
  currentDate,
  onDateChange,
  onReservationClick,
  onTimeSlotClick,
  viewType,
  onViewTypeChange,
  filterEmployeeId,
  filterRoomId,
  onFilterEmployeeChange,
  onFilterRoomChange,
}: ReservationCalendarProps) {
  const timeSlots = useMemo(() => generateTimeSlots(), []);

  const weekDates = useMemo(() => getWeekDates(currentDate), [currentDate]);

  const displayDates = useMemo(
    () => (viewType === "week" ? weekDates : [currentDate]),
    [viewType, weekDates, currentDate],
  );

  // Create lookup maps for quick access
  const employeeMap = useMemo(
    () => new Map(employees.map((e) => [e.employeeId, e])),
    [employees],
  );
  const roomMap = useMemo(
    () => new Map(rooms.map((r) => [r.roomId, r])),
    [rooms],
  );
  const serviceMap = useMemo(
    () => new Map(services.map((s) => [s.serviceId, s])),
    [services],
  );
  const clientMap = useMemo(
    () => new Map(clients.map((c) => [c.clientId, c])),
    [clients],
  );

  // Group reservations by date
  const reservationsByDate = useMemo(() => {
    const map = new Map<string, Reservation[]>();
    for (const res of reservations) {
      const existing = map.get(res.date) || [];
      existing.push(res);
      map.set(res.date, existing);
    }
    return map;
  }, [reservations]);

  const navigatePrev = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - (viewType === "week" ? 7 : 1));
    onDateChange(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + (viewType === "week" ? 7 : 1));
    onDateChange(newDate);
  };

  const navigateToday = () => {
    onDateChange(new Date());
  };

  const formatMonthYear = (date: Date): string => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={navigatePrev}>
            &larr;
          </Button>
          <Button variant="outline" size="sm" onClick={navigateToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={navigateNext}>
            &rarr;
          </Button>
          <span className="font-medium ml-2">
            {formatMonthYear(currentDate)}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* View type selector */}
          <div className="flex gap-1">
            <Button
              variant={viewType === "day" ? "default" : "outline"}
              size="sm"
              onClick={() => onViewTypeChange("day")}
            >
              Day
            </Button>
            <Button
              variant={viewType === "week" ? "default" : "outline"}
              size="sm"
              onClick={() => onViewTypeChange("week")}
            >
              Week
            </Button>
          </div>

          {/* Filters */}
          <Select
            value={filterEmployeeId || "all"}
            onValueChange={(v) =>
              onFilterEmployeeChange(v === "all" ? undefined : v)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Employees" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Employees</SelectItem>
              {employees.map((emp) => (
                <SelectItem key={emp.employeeId} value={emp.employeeId}>
                  {emp.firstName} {emp.lastName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filterRoomId || "all"}
            onValueChange={(v) =>
              onFilterRoomChange(v === "all" ? undefined : v)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Rooms" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rooms</SelectItem>
              {rooms.map((room) => (
                <SelectItem key={room.roomId} value={room.roomId}>
                  {room.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto border rounded-lg bg-white">
        <div className="flex min-w-[800px]">
          {/* Time column */}
          <div className="flex-shrink-0 w-16 border-r bg-gray-50">
            <div className="h-12 border-b" /> {/* Header spacer */}
            <div className="relative">
              {timeSlots.map((time) => (
                <div
                  key={time}
                  className="h-[60px] border-b text-xs text-gray-500 pr-2 text-right"
                >
                  {time}
                </div>
              ))}
            </div>
          </div>

          {/* Day columns */}
          {displayDates.map((date) => {
            const dateStr = date.toISOString().split("T")[0];
            const isToday = dateStr === new Date().toISOString().split("T")[0];
            const dayReservations = reservationsByDate.get(dateStr) || [];

            return (
              <div
                key={dateStr}
                className={cn(
                  "flex-1 min-w-[120px] border-r last:border-r-0",
                  isToday && "bg-blue-50/30",
                )}
              >
                {/* Day header */}
                <div
                  className={cn(
                    "h-12 border-b flex items-center justify-center font-medium text-sm",
                    isToday && "bg-blue-100 text-blue-700",
                  )}
                >
                  {formatDateHeader(date)}
                </div>

                {/* Time slots */}
                <div className="relative">
                  {timeSlots.map((time) => (
                    <div
                      key={time}
                      className="h-[60px] border-b border-gray-100 cursor-pointer hover:bg-gray-50"
                      onClick={() => onTimeSlotClick(dateStr, time)}
                    />
                  ))}

                  {/* Reservations */}
                  {dayReservations
                    .filter((res) => res.status !== "CANCELLED")
                    .map((reservation) => {
                      const top = timeToPixels(reservation.startTime);
                      const height = durationToPixels(
                        reservation.startTime,
                        reservation.endTime,
                      );
                      const service = serviceMap.get(reservation.serviceId);
                      const client = clientMap.get(reservation.clientId);
                      const employee = employeeMap.get(
                        reservation.employeeId || "",
                      );
                      const room = roomMap.get(reservation.roomId || "");

                      // Calculate prep/recovery time blocks with boundary clipping
                      const prepTime = service?.preparationTime || 0;
                      const recoveryTime = service?.recoveryTime || 0;

                      // Clip prep time if it would extend before calendar start
                      const prepTop = top - minutesToPixels(prepTime);
                      const clippedPrepTop = Math.max(0, prepTop);
                      const prepHeight = top - clippedPrepTop;

                      // Clip recovery time if it would extend past calendar end
                      const maxCalendarHeight =
                        (HOURS_END - HOURS_START) * SLOT_HEIGHT;
                      const recoveryTop = top + height;
                      const recoveryHeight = Math.min(
                        minutesToPixels(recoveryTime),
                        maxCalendarHeight - recoveryTop,
                      );

                      return (
                        <div key={reservation.reservationId}>
                          {/* Preparation time block */}
                          {prepTime > 0 && prepHeight > 0 && (
                            <div
                              className="absolute left-1 right-1 rounded-t border border-b-0 text-xs overflow-hidden bg-gray-100 border-gray-300"
                              style={{
                                top: `${clippedPrepTop}px`,
                                height: `${prepHeight}px`,
                                backgroundImage:
                                  "repeating-linear-gradient(135deg, transparent, transparent 3px, rgba(0,0,0,0.05) 3px, rgba(0,0,0,0.05) 6px)",
                              }}
                              title={`Preparation: ${prepTime} min`}
                            >
                              {prepHeight >= 16 && (
                                <div className="text-[10px] text-gray-500 px-1 truncate">
                                  Prep
                                </div>
                              )}
                            </div>
                          )}

                          {/* Main reservation block */}
                          <div
                            className={cn(
                              "absolute left-1 right-1 border px-1 py-0.5 text-xs cursor-pointer overflow-hidden",
                              getStatusColor(reservation.status),
                              prepTime > 0 ? "rounded-none" : "rounded-t",
                              recoveryTime > 0 ? "rounded-none" : "rounded-b",
                              prepTime === 0 && recoveryTime === 0 && "rounded",
                            )}
                            style={{
                              top: `${top}px`,
                              height: `${Math.max(height, 20)}px`,
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onReservationClick(reservation);
                            }}
                          >
                            <div className="font-medium truncate">
                              {service?.name || "Service"}
                            </div>
                            {height > 30 && (
                              <div className="text-gray-600 truncate">
                                {client
                                  ? `${client.firstName} ${client.lastName}`
                                  : "Client"}
                              </div>
                            )}
                            {height > 50 && employee && (
                              <div className="text-gray-500 truncate">
                                {employee.firstName}
                              </div>
                            )}
                            {height > 70 && room && (
                              <div className="text-gray-500 truncate">
                                {room.name}
                              </div>
                            )}
                          </div>

                          {/* Recovery time block */}
                          {recoveryTime > 0 && recoveryHeight > 0 && (
                            <div
                              className="absolute left-1 right-1 rounded-b border border-t-0 text-xs overflow-hidden bg-gray-100 border-gray-300"
                              style={{
                                top: `${recoveryTop}px`,
                                height: `${recoveryHeight}px`,
                                backgroundImage:
                                  "repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(0,0,0,0.05) 3px, rgba(0,0,0,0.05) 6px)",
                              }}
                              title={`Recovery: ${recoveryTime} min`}
                            >
                              {recoveryHeight >= 16 && (
                                <div className="text-[10px] text-gray-500 px-1 truncate">
                                  Recovery
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-xs text-gray-600 flex-wrap">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300" />
          <span>Confirmed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300" />
          <span>Pending</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-100 border border-green-300" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-100 border border-red-300 opacity-50" />
          <span>Cancelled</span>
        </div>
        <div className="flex items-center gap-1">
          <div
            className="w-3 h-3 rounded bg-gray-100 border border-gray-300"
            style={{
              backgroundImage:
                "repeating-linear-gradient(135deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)",
            }}
          />
          <span>Prep/Recovery</span>
        </div>
      </div>
    </div>
  );
}
