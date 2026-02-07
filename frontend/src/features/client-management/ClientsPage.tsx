"use client";

import { useEffect, useState } from "react";
import { Button } from "@/package/ui/button";
import { useClients } from "./hooks/useClients";
import { ClientTable } from "./components/ClientTable";
import { ClientForm } from "./components/ClientForm";
import { DeleteConfirmDialog } from "@/features/employee-management";
import type { Client, CreateClientInput } from "@/shared/types";

export function ClientsPage() {
  const {
    clients,
    isLoading,
    error,
    fetchClients,
    createClient,
    updateClient,
    deleteClient,
    clearError,
  } = useClients();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleAddClient = () => {
    setSelectedClient(null);
    setIsFormOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setIsFormOpen(true);
  };

  const handleDeleteClient = (client: Client) => {
    setSelectedClient(client);
    setIsDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (data: CreateClientInput) => {
    if (selectedClient) {
      const result = await updateClient(selectedClient.clientId, data);
      if (result) {
        setIsFormOpen(false);
        setSelectedClient(null);
      }
    } else {
      const result = await createClient(data);
      if (result) {
        setIsFormOpen(false);
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedClient) {
      const success = await deleteClient(selectedClient.clientId);
      if (success) {
        setIsDeleteDialogOpen(false);
        setSelectedClient(null);
      }
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your clients and their preferences.
          </p>
        </div>
        <Button onClick={handleAddClient}>Add Client</Button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-sm text-red-600">{error}</p>
          <Button variant="ghost" size="sm" onClick={clearError}>
            Dismiss
          </Button>
        </div>
      )}

      {isLoading && clients.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center text-gray-500">
          <p>Loading clients...</p>
        </div>
      ) : (
        <ClientTable
          clients={clients}
          onEdit={handleEditClient}
          onDelete={handleDeleteClient}
        />
      )}

      <ClientForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        client={selectedClient}
        onSubmit={handleFormSubmit}
        isLoading={isLoading}
      />

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Client"
        description={`Are you sure you want to delete ${selectedClient?.firstName} ${selectedClient?.lastName}? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        isLoading={isLoading}
      />
    </div>
  );
}
