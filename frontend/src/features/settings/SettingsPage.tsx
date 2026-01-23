"use client";

import { useEffect, useState } from "react";
import { Button } from "@/package/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/package/ui/card";
import { Input } from "@/package/ui/input";
import { Label } from "@/package/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/package/ui/select";
import { useClosures } from "./hooks/useClosures";
import { useIntegrations } from "./hooks/useIntegrations";
import { ClosureForm } from "./components/ClosureForm";
import { ClosureList } from "./components/ClosureList";
import { IntegrationForm } from "./components/IntegrationForm";
import { IntegrationList } from "./components/IntegrationList";
import { SecretDialog } from "./components/SecretDialog";
import { DeleteConfirmDialog } from "@/features/employee-management";
import type {
  Closure,
  CreateClosureInput,
  Integration,
  CreateIntegrationInput,
  UpdateIntegrationInput,
  IntegrationCreatedResponse,
  RegenerateSecretResponse,
} from "@/shared/types";

export function SettingsPage() {
  // Closures state
  const {
    closures,
    isLoading: closuresLoading,
    error: closuresError,
    fetchClosures,
    createClosure,
    deleteClosure,
    clearError: clearClosuresError,
  } = useClosures();

  const [isClosureFormOpen, setIsClosureFormOpen] = useState(false);
  const [isClosureDeleteDialogOpen, setIsClosureDeleteDialogOpen] =
    useState(false);
  const [selectedClosure, setSelectedClosure] = useState<Closure | null>(null);

  // Integrations state
  const {
    integrations,
    isLoading: integrationsLoading,
    error: integrationsError,
    fetchIntegrations,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    regenerateSecret,
    clearError: clearIntegrationsError,
  } = useIntegrations();

  const [isIntegrationFormOpen, setIsIntegrationFormOpen] = useState(false);
  const [isIntegrationDeleteDialogOpen, setIsIntegrationDeleteDialogOpen] =
    useState(false);
  const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false);
  const [isSecretDialogOpen, setIsSecretDialogOpen] = useState(false);
  const [selectedIntegration, setSelectedIntegration] =
    useState<Integration | null>(null);
  const [secretData, setSecretData] = useState<{
    integrationId: string;
    secretToken: string;
    authorizationHeader: string;
    title: string;
  } | null>(null);

  useEffect(() => {
    fetchClosures();
    fetchIntegrations();
  }, [fetchClosures, fetchIntegrations]);

  // Closure handlers
  const handleAddClosure = () => {
    setIsClosureFormOpen(true);
  };

  const handleDeleteClosure = (closure: Closure) => {
    setSelectedClosure(closure);
    setIsClosureDeleteDialogOpen(true);
  };

  const handleClosureFormSubmit = async (data: CreateClosureInput) => {
    const result = await createClosure(data);
    if (result) {
      setIsClosureFormOpen(false);
    }
  };

  const handleConfirmClosureDelete = async () => {
    if (selectedClosure) {
      const success = await deleteClosure(selectedClosure.closureId);
      if (success) {
        setIsClosureDeleteDialogOpen(false);
        setSelectedClosure(null);
      }
    }
  };

  // Integration handlers
  const handleAddIntegration = () => {
    setSelectedIntegration(null);
    setIsIntegrationFormOpen(true);
  };

  const handleEditIntegration = (integration: Integration) => {
    setSelectedIntegration(integration);
    setIsIntegrationFormOpen(true);
  };

  const handleDeleteIntegration = (integration: Integration) => {
    setSelectedIntegration(integration);
    setIsIntegrationDeleteDialogOpen(true);
  };

  const handleRegenerateSecretClick = (integration: Integration) => {
    setSelectedIntegration(integration);
    setIsRegenerateDialogOpen(true);
  };

  const handleIntegrationFormSubmit = async (
    data: CreateIntegrationInput | UpdateIntegrationInput,
  ) => {
    if (selectedIntegration) {
      // Update existing integration
      const result = await updateIntegration(
        selectedIntegration.integrationId,
        data,
      );
      if (result) {
        setIsIntegrationFormOpen(false);
        setSelectedIntegration(null);
      }
    } else {
      // Create new integration
      const result = await createIntegration(data as CreateIntegrationInput);
      if (result) {
        setIsIntegrationFormOpen(false);
        // Show secret dialog with the new credentials
        setSecretData({
          integrationId: result.integrationId,
          secretToken: result.secretToken,
          authorizationHeader: result.authorizationHeader,
          title: "Integration Created",
        });
        setIsSecretDialogOpen(true);
      }
    }
  };

  const handleConfirmIntegrationDelete = async () => {
    if (selectedIntegration) {
      const success = await deleteIntegration(
        selectedIntegration.integrationId,
      );
      if (success) {
        setIsIntegrationDeleteDialogOpen(false);
        setSelectedIntegration(null);
      }
    }
  };

  const handleConfirmRegenerateSecret = async () => {
    if (selectedIntegration) {
      const result = await regenerateSecret(selectedIntegration.integrationId);
      if (result) {
        setIsRegenerateDialogOpen(false);
        // Show secret dialog with the new credentials
        setSecretData({
          integrationId: result.integrationId,
          secretToken: result.secretToken,
          authorizationHeader: result.authorizationHeader,
          title: "Secret Regenerated",
        });
        setIsSecretDialogOpen(true);
        setSelectedIntegration(null);
      }
    }
  };

  const error = closuresError || integrationsError;
  const clearError = () => {
    clearClosuresError();
    clearIntegrationsError();
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure your spa settings and preferences.
        </p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between max-w-2xl">
          <p className="text-sm text-red-600">{error}</p>
          <Button variant="ghost" size="sm" onClick={clearError}>
            Dismiss
          </Button>
        </div>
      )}

      <div className="space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
            <CardDescription>Basic configuration for your spa.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="spaName">Spa Name</Label>
              <Input id="spaName" placeholder="Your Spa Name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeSlot">Time Slot Granularity</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select time slot" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 minutes</SelectItem>
                  <SelectItem value="15">15 minutes</SelectItem>
                  <SelectItem value="20">20 minutes</SelectItem>
                  <SelectItem value="30">30 minutes</SelectItem>
                  <SelectItem value="60">60 minutes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Exceptional Closures</CardTitle>
            <CardDescription>
              Manage dates when your spa is closed. Reservations cannot be made
              on these dates.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {closuresLoading && closures.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                <p>Loading closures...</p>
              </div>
            ) : (
              <ClosureList
                closures={closures}
                onDelete={handleDeleteClosure}
                isLoading={closuresLoading}
              />
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleAddClosure}
            >
              Add Closure Date
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>External Integrations</CardTitle>
            <CardDescription>
              Manage API access for external systems. Each integration receives
              a unique token for authentication.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {integrationsLoading && integrations.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                <p>Loading integrations...</p>
              </div>
            ) : (
              <IntegrationList
                integrations={integrations}
                onEdit={handleEditIntegration}
                onDelete={handleDeleteIntegration}
                onRegenerateSecret={handleRegenerateSecretClick}
                isLoading={integrationsLoading}
              />
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={handleAddIntegration}
            >
              Add Integration
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Closure dialogs */}
      <ClosureForm
        open={isClosureFormOpen}
        onOpenChange={setIsClosureFormOpen}
        onSubmit={handleClosureFormSubmit}
        isLoading={closuresLoading}
      />

      <DeleteConfirmDialog
        open={isClosureDeleteDialogOpen}
        onOpenChange={setIsClosureDeleteDialogOpen}
        title="Delete Closure"
        description={`Are you sure you want to delete the closure on ${selectedClosure?.date}? This will allow reservations to be made on this date again.`}
        onConfirm={handleConfirmClosureDelete}
        isLoading={closuresLoading}
      />

      {/* Integration dialogs */}
      <IntegrationForm
        open={isIntegrationFormOpen}
        onOpenChange={setIsIntegrationFormOpen}
        onSubmit={handleIntegrationFormSubmit}
        integration={selectedIntegration}
        isLoading={integrationsLoading}
      />

      <DeleteConfirmDialog
        open={isIntegrationDeleteDialogOpen}
        onOpenChange={setIsIntegrationDeleteDialogOpen}
        title="Delete Integration"
        description={`Are you sure you want to delete the integration "${selectedIntegration?.name}"? This will immediately revoke all access for this integration.`}
        onConfirm={handleConfirmIntegrationDelete}
        isLoading={integrationsLoading}
      />

      <DeleteConfirmDialog
        open={isRegenerateDialogOpen}
        onOpenChange={setIsRegenerateDialogOpen}
        title="Regenerate Secret"
        description={`Are you sure you want to regenerate the secret for "${selectedIntegration?.name}"? The old secret will immediately stop working.`}
        onConfirm={handleConfirmRegenerateSecret}
        isLoading={integrationsLoading}
      />

      {secretData && (
        <SecretDialog
          open={isSecretDialogOpen}
          onOpenChange={setIsSecretDialogOpen}
          title={secretData.title}
          integrationId={secretData.integrationId}
          secretToken={secretData.secretToken}
          authorizationHeader={secretData.authorizationHeader}
        />
      )}
    </div>
  );
}
