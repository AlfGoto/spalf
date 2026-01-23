"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/package/ui/button";
import { Input } from "@/package/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/package/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/package/ui/dialog";
import type { Service, CreateServiceInput } from "@/shared/types";
import { formatPrice } from "@/shared/utils";

const serviceFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be 0 or greater"),
  duration: z.coerce.number().min(5, "Duration must be at least 5 minutes"),
  preparationTime: z.coerce.number().min(0).default(0),
  recoveryTime: z.coerce.number().min(0).default(0),
  cancellationDeadlineHours: z.coerce.number().min(0).default(24),
  canBeRescheduled: z.boolean().default(true),
  isComposed: z.boolean().default(false),
});

type ServiceFormValues = z.infer<typeof serviceFormSchema>;

interface ServiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: Service | null;
  allServices?: Service[];
  onSubmit: (data: CreateServiceInput) => Promise<void>;
  isLoading?: boolean;
}

export function ServiceForm({
  open,
  onOpenChange,
  service,
  allServices = [],
  onSubmit,
  isLoading,
}: ServiceFormProps) {
  const isEditing = !!service;
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: service?.name ?? "",
      description: service?.description ?? "",
      price: service?.price ?? 0,
      duration: service?.duration ?? 60,
      preparationTime: service?.preparationTime ?? 0,
      recoveryTime: service?.recoveryTime ?? 0,
      cancellationDeadlineHours: service?.cancellationDeadlineHours ?? 24,
      canBeRescheduled: service?.canBeRescheduled ?? true,
      isComposed: service?.isComposed ?? false,
    },
  });

  const isComposed = form.watch("isComposed");

  // Reset selected services when dialog opens/closes or service changes
  useEffect(() => {
    if (open && service) {
      setSelectedServiceIds(service.composedServiceIds || []);
    } else if (!open) {
      setSelectedServiceIds([]);
    }
  }, [open, service]);

  // Available services for composition (exclude current service and already composed services)
  const availableServices = useMemo(() => {
    return allServices.filter((s) => {
      // Exclude the current service being edited
      if (service && s.serviceId === service.serviceId) return false;
      // Don't allow composed services to be added to other composed services (prevent deep nesting)
      if (s.isComposed) return false;
      return true;
    });
  }, [allServices, service]);

  // Calculate totals from selected services
  const compositionTotals = useMemo(() => {
    if (!isComposed || selectedServiceIds.length === 0) {
      return null;
    }
    const selectedServices = allServices.filter((s) =>
      selectedServiceIds.includes(s.serviceId),
    );
    const totalDuration = selectedServices.reduce(
      (sum, s) => sum + s.duration,
      0,
    );
    const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
    return { totalDuration, totalPrice };
  }, [isComposed, selectedServiceIds, allServices]);

  const resetForm = () => {
    form.reset({
      name: service?.name ?? "",
      description: service?.description ?? "",
      price: service?.price ?? 0,
      duration: service?.duration ?? 60,
      preparationTime: service?.preparationTime ?? 0,
      recoveryTime: service?.recoveryTime ?? 0,
      cancellationDeadlineHours: service?.cancellationDeadlineHours ?? 24,
      canBeRescheduled: service?.canBeRescheduled ?? true,
      isComposed: service?.isComposed ?? false,
    });
    setSelectedServiceIds(service?.composedServiceIds || []);
  };

  const handleSubmit = async (values: ServiceFormValues) => {
    await onSubmit({
      name: values.name,
      description: values.description || undefined,
      price: values.price,
      duration: values.duration,
      preparationTime: values.preparationTime,
      recoveryTime: values.recoveryTime,
      cancellationDeadlineHours: values.cancellationDeadlineHours,
      canBeRescheduled: values.canBeRescheduled,
      isComposed: values.isComposed,
      composedServiceIds: values.isComposed ? selectedServiceIds : [],
    });
    form.reset();
    setSelectedServiceIds([]);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  const toggleServiceSelection = (serviceId: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId],
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Service" : "Add Service"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the service's information."
              : "Add a new service to your spa offerings."}
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
                    <Input placeholder="Swedish Massage" {...field} />
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
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="A relaxing full-body massage..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price ($)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step={0.01} {...field} />
                    </FormControl>
                    {isComposed && compositionTotals && (
                      <FormDescription>
                        Sum of services:{" "}
                        {formatPrice(compositionTotals.totalPrice)}
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (min)</FormLabel>
                    <FormControl>
                      <Input type="number" min={5} step={5} {...field} />
                    </FormControl>
                    {isComposed && compositionTotals && (
                      <FormDescription>
                        Sum: {compositionTotals.totalDuration} min
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="preparationTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prep Time (min)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step={5} {...field} />
                    </FormControl>
                    <FormDescription>Time before service</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recoveryTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Recovery (min)</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} step={5} {...field} />
                    </FormControl>
                    <FormDescription>Time after service</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="cancellationDeadlineHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cancellation Deadline (hours)</FormLabel>
                  <FormControl>
                    <Input type="number" min={0} {...field} />
                  </FormControl>
                  <FormDescription>
                    How many hours before the appointment clients can cancel
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="canBeRescheduled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2">
                  <FormControl>
                    <input
                      type="checkbox"
                      checked={field.value}
                      onChange={field.onChange}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                  </FormControl>
                  <FormLabel className="!mt-0">Allow rescheduling</FormLabel>
                </FormItem>
              )}
            />

            {/* Service Composition Section */}
            <div className="border-t pt-4">
              <FormField
                control={form.control}
                name="isComposed"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2 mb-3">
                    <FormControl>
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                    </FormControl>
                    <FormLabel className="!mt-0 font-medium">
                      Composed Service (Package)
                    </FormLabel>
                  </FormItem>
                )}
              />

              {isComposed && (
                <div className="space-y-2">
                  <FormDescription>
                    Select services to include in this package. The price and
                    duration can be customized independently.
                  </FormDescription>

                  {availableServices.length === 0 ? (
                    <p className="text-sm text-gray-500 py-2">
                      No services available for composition. Create basic
                      services first.
                    </p>
                  ) : (
                    <div className="max-h-40 overflow-y-auto border rounded-lg divide-y">
                      {availableServices.map((s) => (
                        <label
                          key={s.serviceId}
                          className="flex items-center gap-3 p-2 hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedServiceIds.includes(s.serviceId)}
                            onChange={() => toggleServiceSelection(s.serviceId)}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {s.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {s.duration} min · {formatPrice(s.price)}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  )}

                  {selectedServiceIds.length > 0 && (
                    <p className="text-sm text-gray-600">
                      {selectedServiceIds.length} service(s) selected
                    </p>
                  )}
                </div>
              )}
            </div>

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
                  ? "Saving..."
                  : isEditing
                    ? "Save Changes"
                    : "Add Service"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
