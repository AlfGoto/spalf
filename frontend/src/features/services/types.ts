import type { paths } from "@/shared/types/api"

// Extract types from OpenAPI generated types
export type Service =
  paths["/api/services"]["get"]["responses"]["200"]["content"]["application/json"][number]

export type CreateServiceInput = NonNullable<
  paths["/api/services"]["post"]["requestBody"]
>["content"]["application/json"]

export type UpdateServiceInput = NonNullable<
  paths["/api/services/{id}"]["put"]["requestBody"]
>["content"]["application/json"]

export type ApiError =
  paths["/api/services"]["get"]["responses"]["500"]["content"]["application/json"]

// Helper to format price from cents to display string
export function formatPrice(cents: number): string {
  return (cents / 100).toFixed(2)
}

// Helper to parse price from display string to cents
export function parsePriceToCents(price: string): number {
  const parsed = parseFloat(price)
  if (isNaN(parsed)) return 0
  return Math.round(parsed * 100)
}

// Helper to format duration in minutes to a readable string
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}min`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  if (remainingMinutes === 0) {
    return `${hours}h`
  }
  return `${hours}h ${remainingMinutes}min`
}
