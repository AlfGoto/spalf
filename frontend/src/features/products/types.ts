import type { paths } from "@/shared/types/api"

// Extract types from OpenAPI generated types
export type Product =
  paths["/api/products"]["get"]["responses"]["200"]["content"]["application/json"][number]

export type CreateProductInput = NonNullable<
  paths["/api/products"]["post"]["requestBody"]
>["content"]["application/json"]

export type UpdateProductInput = NonNullable<
  paths["/api/products/{id}"]["put"]["requestBody"]
>["content"]["application/json"]

export type ApiError =
  paths["/api/products"]["get"]["responses"]["500"]["content"]["application/json"]

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
