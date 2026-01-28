import type { paths } from "@/shared/types/api"

// Extract types from OpenAPI generated types
export type Reservation =
  paths["/api/reservations"]["get"]["responses"]["200"]["content"]["application/json"][number]

export type CreateReservationInput = NonNullable<
  paths["/api/reservations"]["post"]["requestBody"]
>["content"]["application/json"]

export type UpdateReservationInput = NonNullable<
  paths["/api/reservations/{id}"]["put"]["requestBody"]
>["content"]["application/json"]

export type ApiError =
  paths["/api/reservations"]["get"]["responses"]["500"]["content"]["application/json"]

// Re-export reservation status enum for convenience
export const ReservationStatus = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const

export type ReservationStatus = Reservation["status"]

// Helper to format time for display (HH:MM)
export function formatTime(time: string): string {
  return time
}

// Helper to format date for display
export function formatDate(date: string): string {
  const d = new Date(date + "T00:00:00")
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

// Helper to get status color class
export function getStatusColor(status: ReservationStatus): string {
  switch (status) {
    case ReservationStatus.PENDING:
      return "text-yellow-600 bg-yellow-50"
    case ReservationStatus.CONFIRMED:
      return "text-blue-600 bg-blue-50"
    case ReservationStatus.COMPLETED:
      return "text-green-600 bg-green-50"
    case ReservationStatus.CANCELLED:
      return "text-red-600 bg-red-50"
    default:
      return "text-neutral-600 bg-neutral-50"
  }
}
