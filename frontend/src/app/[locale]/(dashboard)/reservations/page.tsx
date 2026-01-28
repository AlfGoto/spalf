import { ReservationsPage, listReservations } from "@/features/reservations"
import { listServices } from "@/features/services"
import { listClients } from "@/features/clients"
import { listEmployees } from "@/features/employees"
import { listRooms } from "@/features/rooms"

export default async function Page() {
  // Fetch all required data in parallel
  const [
    reservationsResult,
    servicesResult,
    clientsResult,
    employeesResult,
    roomsResult,
  ] = await Promise.all([
    listReservations(),
    listServices(),
    listClients(),
    listEmployees(),
    listRooms(),
  ])

  // Log any errors
  if (reservationsResult.error) {
    console.error("Failed to fetch reservations:", reservationsResult.error)
  }
  if (servicesResult.error) {
    console.error("Failed to fetch services:", servicesResult.error)
  }
  if (clientsResult.error) {
    console.error("Failed to fetch clients:", clientsResult.error)
  }
  if (employeesResult.error) {
    console.error("Failed to fetch employees:", employeesResult.error)
  }
  if (roomsResult.error) {
    console.error("Failed to fetch rooms:", roomsResult.error)
  }

  return (
    <ReservationsPage
      initialReservations={reservationsResult.data || []}
      services={servicesResult.data || []}
      clients={clientsResult.data || []}
      employees={employeesResult.data || []}
      rooms={roomsResult.data || []}
    />
  )
}
