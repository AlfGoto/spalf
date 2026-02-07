"use client";

import { useEffect, useState } from "react";
import { Button } from "@/package/ui/button";
import { useServices } from "./hooks/useServices";
import { ServiceTable } from "./components/ServiceTable";
import { ServiceForm } from "./components/ServiceForm";
import { DeleteConfirmDialog } from "@/features/employee-management";
import type { Service, CreateServiceInput } from "@/shared/types";

export function ServicesPage() {
  const {
    services,
    isLoading,
    error,
    fetchServices,
    createService,
    updateService,
    deleteService,
    clearError,
  } = useServices();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleAddService = () => {
    setSelectedService(null);
    setIsFormOpen(true);
  };

  const handleEditService = (service: Service) => {
    setSelectedService(service);
    setIsFormOpen(true);
  };

  const handleDeleteService = (service: Service) => {
    setSelectedService(service);
    setIsDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (data: CreateServiceInput) => {
    if (selectedService) {
      const result = await updateService(selectedService.serviceId, data);
      if (result) {
        setIsFormOpen(false);
        setSelectedService(null);
      }
    } else {
      const result = await createService(data);
      if (result) {
        setIsFormOpen(false);
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedService) {
      const success = await deleteService(selectedService.serviceId);
      if (success) {
        setIsDeleteDialogOpen(false);
        setSelectedService(null);
      }
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Services</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage the services and treatments your spa offers.
          </p>
        </div>
        <Button onClick={handleAddService}>Add Service</Button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-sm text-red-600">{error}</p>
          <Button variant="ghost" size="sm" onClick={clearError}>
            Dismiss
          </Button>
        </div>
      )}

      {isLoading && services.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center text-gray-500">
          <p>Loading services...</p>
        </div>
      ) : (
        <ServiceTable
          services={services}
          onEdit={handleEditService}
          onDelete={handleDeleteService}
        />
      )}

      <ServiceForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        service={selectedService}
        allServices={services}
        onSubmit={handleFormSubmit}
        isLoading={isLoading}
      />

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Service"
        description={`Are you sure you want to delete "${selectedService?.name}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        isLoading={isLoading}
      />
    </div>
  );
}
