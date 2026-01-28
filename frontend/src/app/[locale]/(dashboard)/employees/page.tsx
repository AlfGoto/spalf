import { EmployeesPage, listEmployees } from "@/features/employees"

export default async function Page() {
  const { data: employees, error } = await listEmployees()

  if (error) {
    console.error("Failed to fetch employees:", error)
  }

  return <EmployeesPage initialEmployees={employees || []} />
}
