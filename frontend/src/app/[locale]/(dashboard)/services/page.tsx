import { ServicesPage, listServices } from "@/features/services"

export default async function Page() {
  const { data: services, error } = await listServices()

  if (error) {
    console.error("Failed to fetch services:", error)
  }

  return <ServicesPage initialServices={services || []} />
}
