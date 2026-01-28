import type { paths } from "@/shared/types/api"

// Extract types from OpenAPI generated types
export type Employee =
  paths["/api/employees"]["get"]["responses"]["200"]["content"]["application/json"][number]

export type CreateEmployeeInput = NonNullable<
  paths["/api/employees"]["post"]["requestBody"]
>["content"]["application/json"]

export type UpdateEmployeeInput = NonNullable<
  paths["/api/employees/{id}"]["put"]["requestBody"]
>["content"]["application/json"]

export type ApiError =
  paths["/api/employees"]["get"]["responses"]["500"]["content"]["application/json"]

// Re-export employment type enum for convenience
export const EmploymentType = {
  FULLTIME: "FULLTIME",
  FREELANCE: "FREELANCE",
} as const

export type EmploymentType = Employee["employmentType"]
