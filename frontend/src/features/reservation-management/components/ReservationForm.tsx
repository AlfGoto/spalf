"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/package/ui/button";
import { Input } from "@/package/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/package/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/package/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/package/ui/dialog";
import type {
  Reservation,
  CreateReservationInput,
  UpdateReservationInput,
  Service,
  Employee,
  Room,
  Client,
} from "@/shared/types";

const reservationFormSchema = z.object({
  serviceId: z.string().min(1, "Service is required"),
  clientId: z.string().min(1, "Client is required"),
  employeeId: z.string().min(1, "Employee is required"),
  roomId: z.string().min(1, "Room is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date is required (YYYY-MM-DD)"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Start time is required (HH:mm)"),
  notes: z.string().optional(),
});

type ReservationFormValues = z.infer<typeof reservationFormSchema>;

interface ReservationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation?: Reservation | null;
  onSubmit: (
    data: CreateReservationInput | UpdateReservationInput,
    isUpdate: boolean
  ) => Promise<void>;
  isLoading?: boolean;
  services: Service[];
  employees: Employee[];
  rooms: Room[];
  clients: Client[];
  defaultDate?: string;
  defaultTime?: string;
}

// Generate time slots in 15-minute intervals
function generateTimeSlots(): string[] {
  const slots: string[] = [];
  for (let hour = 8; hour < 20; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      slots.push(
        `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
      );
    }
  }
  return slots;
}

export function ReservationForm({
  open,
  onOpenChange,
  reservation,
  onSubmit,
  isLoading,
  services,
  employees,
  rooms,
  clients,
  defaultDate,
  defaultTime,
}: ReservationFormProps) {
  const isEditing = !!reservation;
  const timeSlots = useMemo(() => generateTimeSlots(), []);

  const form = useForm<ReservationFormValues>({
    resolver: zodResolver(reservationFormSchema),
    defaultValues: {
      serviceId: reservation?.serviceId ?? "",
      clientId: reservation?.clientId ?? "",
      employeeId: reservation?.employeeId ?? "",
      roomId: reservation?.roomId ?? "",
      date: reservation?.date ?? defaultDate ?? new Date().toISOString().split("T")[0],
      startTime: reservation?.startTime ?? defaultTime ?? "09:00",
      notes: reservation?.notes ?? "",
    },
  });

  // Reset form when reservation/defaults change
  useEffect(() => {
    form.reset({
      serviceId: reservation?.serviceId ?? "",
      clientId: reservation?.clientId ?? "",
      employeeId: reservation?.employeeId ?? "",
      roomId: reservation?.roomId ?? "",
      date: reservation?.date ?? defaultDate ?? new Date().toISOString().split("T")[0],
      startTime: reservation?.startTime ?? defaultTime ?? "09:00",
      notes: reservation?.notes ?? "",
    });
  }, [reservation, defaultDate, defaultTime, form]);

  // Filter employees and rooms based on selected service
  const selectedServiceId = form.watch("serviceId");
  const selectedService = services.find((s) => s.serviceId === selectedServiceId);

  const availableEmployees = useMemo(() => {
    if (!selectedService || selectedService.employeeIds.length === 0) {
      return employees;
    }
    return employees.filter((e) =>
      selectedService.employeeIds.includes(e.employeeId)
    );
  }, [selectedService, employees]);

  const availableRooms = useMemo(() => {
    if (!selectedService || selectedService.roomIds.length === 0) {
      return rooms;
    }
    return rooms.filter((r) => selectedService.roomIds.includes(r.roomId));
  }, [selectedService, rooms]);

  const handleSubmit = async (values: ReservationFormValues) => {
    if (isEditing) {
      // For update, only send changed fields
      const updates: UpdateReservationInput = {
        ...(values.employeeId !== reservation?.employeeId && {
          employeeId: values.employeeId,
        }),
        ...(values.roomId !== reservation?.roomId && { roomId: values.roomId }),
        ...(values.date !== reservation?.date && { date: values.date }),
        ...(values.startTime !== reservation?.startTime && {
          startTime: values.startTime,
        }),
        ...(values.notes !== reservation?.notes && { notes: values.notes }),
      };
      await onSubmit(updates, true);
    } else {
      await onSubmit(
        {
          ...values,
          notes: values.notes || undefined,
        },
        false
      );
    }
    form.reset();
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      form.reset();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Reservation" : "New Reservation"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the reservation details."
              : "Create a new reservation. Select a service first to see available employees and rooms."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Service Selection */}
            <FormField
              control={form.control}
              name="serviceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isEditing}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a service" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.serviceId} value={service.serviceId}>
                          {service.name} ({service.duration} min) - $
                          {service.price.toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedService && (
                    <FormDescription>
                      Duration: {selectedService.duration} min
                      {selectedService.preparationTime > 0 &&
                        ` + ${selectedService.preparationTime} min prep`}
                      {selectedService.recoveryTime > 0 &&
                        ` + ${selectedService.recoveryTime} min recovery`}
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Client Selection */}
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isEditing}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client.clientId} value={client.clientId}>
                          {client.firstName} {client.lastName}
                          {client.email && ` (${client.email})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeSlots.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Employee Selection */}
            <FormField
              control={form.control}
              name="employeeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Employee</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an employee" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableEmployees.map((employee) => (
                        <SelectItem
                          key={employee.employeeId}
                          value={employee.employeeId}
                        >
                          {employee.firstName} {employee.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedService &&
                    selectedService.employeeIds.length > 0 &&
                    availableEmployees.length === 0 && (
                      <FormDescription className="text-orange-600">
                        No employees available for this service
                      </FormDescription>
                    )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Room Selection */}
            <FormField
              control={form.control}
              name="roomId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a room" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availableRooms.map((room) => (
                        <SelectItem key={room.roomId} value={room.roomId}>
                          {room.name} (max {room.maxCapacity} people)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedService &&
                    selectedService.roomIds.length > 0 &&
                    availableRooms.length === 0 && (
                      <FormDescription className="text-orange-600">
                        No rooms available for this service
                      </FormDescription>
                    )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Any special requests or notes..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                    : "Create Reservation"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
