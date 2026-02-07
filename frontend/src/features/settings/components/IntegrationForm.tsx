"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/package/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/package/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/package/ui/form";
import { Input } from "@/package/ui/input";
import { Checkbox } from "@/package/ui/checkbox";
import type {
  Integration,
  CreateIntegrationInput,
  UpdateIntegrationInput,
  IntegrationPermission,
  WebhookEventType,
} from "@/shared/types";

const PERMISSIONS: { value: IntegrationPermission; label: string }[] = [
  { value: "reservations:read", label: "Read Reservations" },
  { value: "reservations:write", label: "Create/Update Reservations" },
  { value: "clients:read", label: "Read Clients" },
  { value: "clients:write", label: "Create/Update Clients" },
  { value: "services:read", label: "Read Services" },
  { value: "employees:read", label: "Read Employees" },
  { value: "rooms:read", label: "Read Rooms" },
];

const WEBHOOK_EVENTS: { value: WebhookEventType; label: string }[] = [
  { value: "reservation.created", label: "Reservation Created" },
  { value: "reservation.updated", label: "Reservation Updated" },
  { value: "reservation.cancelled", label: "Reservation Cancelled" },
  { value: "reservation.completed", label: "Reservation Completed" },
  { value: "client.created", label: "Client Created" },
  { value: "client.updated", label: "Client Updated" },
];

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  webhookUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
  webhookEvents: z.array(z.string()),
  permissions: z.array(z.string()),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface IntegrationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    data: CreateIntegrationInput | UpdateIntegrationInput,
  ) => Promise<void>;
  integration?: Integration | null;
  isLoading?: boolean;
}

export function IntegrationForm({
  open,
  onOpenChange,
  onSubmit,
  integration,
  isLoading,
}: IntegrationFormProps) {
  const isEditMode = !!integration;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: integration?.name ?? "",
      description: integration?.description ?? "",
      webhookUrl: integration?.webhookUrl ?? "",
      webhookEvents: integration?.webhookEvents ?? [],
      permissions: integration?.permissions ?? [],
      isActive: integration?.isActive ?? true,
    },
  });

  const handleSubmit = async (values: FormValues) => {
    const data: CreateIntegrationInput | UpdateIntegrationInput = {
      name: values.name,
      description: values.description || undefined,
      webhookUrl: values.webhookUrl || undefined,
      webhookEvents: values.webhookEvents as WebhookEventType[],
      permissions: values.permissions as IntegrationPermission[],
    };

    if (isEditMode) {
      (data as UpdateIntegrationInput).isActive = values.isActive;
    }

    await onSubmit(data);
  };

  // Reset form when integration changes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      form.reset({
        name: "",
        description: "",
        webhookUrl: "",
        webhookEvents: [],
        permissions: [],
        isActive: true,
      });
    } else if (integration) {
      form.reset({
        name: integration.name,
        description: integration.description ?? "",
        webhookUrl: integration.webhookUrl ?? "",
        webhookEvents: integration.webhookEvents,
        permissions: integration.permissions,
        isActive: integration.isActive,
      });
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Integration" : "Create Integration"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the integration settings."
              : "Create a new integration for external systems to connect."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Integration" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Optional description..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="webhookUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Webhook URL</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/webhook"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    URL to receive webhook notifications.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="webhookEvents"
              render={() => (
                <FormItem>
                  <FormLabel>Webhook Events</FormLabel>
                  <FormDescription>
                    Select which events trigger webhooks.
                  </FormDescription>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {WEBHOOK_EVENTS.map((event) => (
                      <FormField
                        key={event.value}
                        control={form.control}
                        name="webhookEvents"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(event.value)}
                                onCheckedChange={(checked) => {
                                  const current = field.value || [];
                                  if (checked) {
                                    field.onChange([...current, event.value]);
                                  } else {
                                    field.onChange(
                                      current.filter((v) => v !== event.value),
                                    );
                                  }
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal cursor-pointer">
                              {event.label}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="permissions"
              render={() => (
                <FormItem>
                  <FormLabel>API Permissions</FormLabel>
                  <FormDescription>
                    Select which API operations this integration can perform.
                  </FormDescription>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {PERMISSIONS.map((permission) => (
                      <FormField
                        key={permission.value}
                        control={form.control}
                        name="permissions"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(
                                  permission.value,
                                )}
                                onCheckedChange={(checked) => {
                                  const current = field.value || [];
                                  if (checked) {
                                    field.onChange([
                                      ...current,
                                      permission.value,
                                    ]);
                                  } else {
                                    field.onChange(
                                      current.filter(
                                        (v) => v !== permission.value,
                                      ),
                                    );
                                  }
                                }}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal cursor-pointer">
                              {permission.label}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isEditMode && (
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      Active
                    </FormLabel>
                    <FormDescription className="!mt-0 ml-2">
                      Inactive integrations cannot access the API.
                    </FormDescription>
                  </FormItem>
                )}
              />
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? isEditMode
                    ? "Saving..."
                    : "Creating..."
                  : isEditMode
                    ? "Save Changes"
                    : "Create Integration"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
