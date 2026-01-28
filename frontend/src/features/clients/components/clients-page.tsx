"use client"

import { useTranslations } from "next-intl"
import { useState, useTransition, useMemo } from "react"
import { toast } from "sonner"
import { Button } from "@/package/ui/button"
import { Input } from "@/package/ui/input"
import { Plus, Search } from "lucide-react"
import { ClientList } from "./client-list"
import { ClientForm } from "./client-form"
import { DeleteClientDialog } from "./delete-client-dialog"
import type { Client, CreateClientInput } from "../types"
import {
  createClient,
  updateClient,
  deleteClient,
} from "../api"

interface ClientsPageProps {
  initialClients: Client[]
}

export function ClientsPage({ initialClients }: ClientsPageProps) {
  const t = useTranslations()
  const [isPending, startTransition] = useTransition()

  const [clients, setClients] = useState<Client[]>(initialClients)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  // Filter clients based on search query
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) {
      return clients
    }
    const query = searchQuery.toLowerCase()
    return clients.filter(
      (client) =>
        client.firstName.toLowerCase().includes(query) ||
        client.lastName.toLowerCase().includes(query) ||
        client.email.toLowerCase().includes(query) ||
        (client.phone && client.phone.includes(query))
    )
  }, [clients, searchQuery])

  const handleAdd = () => {
    setSelectedClient(null)
    setFormOpen(true)
  }

  const handleEdit = (client: Client) => {
    setSelectedClient(client)
    setFormOpen(true)
  }

  const handleDeleteClick = (client: Client) => {
    setSelectedClient(client)
    setDeleteDialogOpen(true)
  }

  const handleFormSubmit = async (data: CreateClientInput) => {
    startTransition(async () => {
      if (selectedClient) {
        // Update existing client
        const result = await updateClient(selectedClient.id, data)
        if (result.error) {
          toast.error(result.error.message)
          return
        }
        if (result.data) {
          setClients((prev) =>
            prev.map((c) => (c.id === selectedClient.id ? result.data! : c))
          )
          toast.success(t("common.success"))
        }
      } else {
        // Create new client
        const result = await createClient(data)
        if (result.error) {
          toast.error(result.error.message)
          return
        }
        if (result.data) {
          setClients((prev) => [...prev, result.data!])
          toast.success(t("common.success"))
        }
      }
      setFormOpen(false)
      setSelectedClient(null)
    })
  }

  const handleDeleteConfirm = async () => {
    if (!selectedClient) return

    startTransition(async () => {
      const result = await deleteClient(selectedClient.id)
      if (result.error) {
        toast.error(result.error.message)
        return
      }
      setClients((prev) => prev.filter((c) => c.id !== selectedClient.id))
      toast.success(t("common.success"))
      setDeleteDialogOpen(false)
      setSelectedClient(null)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("nav.clients")}</h1>
          <p className="text-neutral-500">{t("clients.description")}</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          {t("clients.addClient")}
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
        <Input
          type="text"
          placeholder={t("clients.searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="rounded-lg border border-neutral-200">
        <ClientList
          clients={filteredClients}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
        />
      </div>

      <ClientForm
        open={formOpen}
        onOpenChange={setFormOpen}
        client={selectedClient}
        onSubmit={handleFormSubmit}
        isLoading={isPending}
      />

      <DeleteClientDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        client={selectedClient}
        onConfirm={handleDeleteConfirm}
        isLoading={isPending}
      />
    </div>
  )
}
