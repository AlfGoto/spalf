import type { paths } from "@/shared/types/api"

// Extract types from OpenAPI generated types
export type Client =
  paths["/api/clients"]["get"]["responses"]["200"]["content"]["application/json"][number]

export type CreateClientInput = NonNullable<
  paths["/api/clients"]["post"]["requestBody"]
>["content"]["application/json"]

export type UpdateClientInput = NonNullable<
  paths["/api/clients/{id}"]["put"]["requestBody"]
>["content"]["application/json"]

export type ApiError =
  paths["/api/clients"]["get"]["responses"]["500"]["content"]["application/json"]
