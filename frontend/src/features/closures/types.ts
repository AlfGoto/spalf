import type { paths } from "@/shared/types/api"

// Extract types from OpenAPI generated types
export type Closure =
  paths["/api/closures"]["get"]["responses"]["200"]["content"]["application/json"][number]

export type CreateClosureInput = NonNullable<
  paths["/api/closures"]["post"]["requestBody"]
>["content"]["application/json"]

export type ApiError =
  paths["/api/closures"]["get"]["responses"]["500"]["content"]["application/json"]
