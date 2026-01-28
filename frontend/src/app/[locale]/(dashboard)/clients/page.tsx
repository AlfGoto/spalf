import { ClientsPage, listClients } from "@/features/clients"

export default async function Page() {
  const { data: clients, error } = await listClients()

  if (error) {
    console.error("Failed to fetch clients:", error)
  }

  return <ClientsPage initialClients={clients || []} />
}
