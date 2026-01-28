import type { paths } from "@/shared/types/api"

// Extract types from OpenAPI generated types
export type Room =
  paths["/api/rooms"]["get"]["responses"]["200"]["content"]["application/json"][number]

export type CreateRoomInput = NonNullable<
  paths["/api/rooms"]["post"]["requestBody"]
>["content"]["application/json"]

export type UpdateRoomInput = NonNullable<
  paths["/api/rooms/{id}"]["put"]["requestBody"]
>["content"]["application/json"]

export type ApiError =
  paths["/api/rooms"]["get"]["responses"]["500"]["content"]["application/json"]
