"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import type { Room, CreateRoomInput } from "@/shared/types";

const roomFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  minCapacity: z.coerce.number().min(1, "Minimum capacity must be at least 1").default(1),
  maxCapacity: z.coerce.number().min(1, "Maximum capacity must be at least 1"),
  maxConcurrentServices: z.coerce.number().min(1, "Must allow at least 1 service").default(1),
}).refine((data) => data.maxCapacity >= data.minCapacity, {
  message: "Maximum capacity must be greater than or equal to minimum capacity",
  path: ["maxCapacity"],
});

type RoomFormValues = z.infer<typeof roomFormSchema>;

interface RoomFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  room?: Room | null;
  onSubmit: (data: CreateRoomInput) => Promise<void>;
  isLoading?: boolean;
}

export function RoomForm({
  open,
  onOpenChange,
  room,
  onSubmit,
  isLoading,
}: RoomFormProps) {
  const isEditing = !!room;

  const form = useForm<RoomFormValues>({
    resolver: zodResolver(roomFormSchema),
    defaultValues: {
      name: room?.name ?? "",
      description: room?.description ?? "",
      minCapacity: room?.minCapacity ?? 1,
      maxCapacity: room?.maxCapacity ?? 1,
      maxConcurrentServices: room?.maxConcurrentServices ?? 1,
    },
  });

  const resetForm = () => {
    form.reset({
      name: room?.name ?? "",
      description: room?.description ?? "",
      minCapacity: room?.minCapacity ?? 1,
      maxCapacity: room?.maxCapacity ?? 1,
      maxConcurrentServices: room?.maxConcurrentServices ?? 1,
    });
  };

  const handleSubmit = async (values: RoomFormValues) => {
    await onSubmit({
      ...values,
      description: values.description || undefined,
    });
    form.reset();
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm();
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Room" : "Add Room"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the room's information."
              : "Add a new room to your spa."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Massage Room 1" {...field} />
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
                    <Input placeholder="Private room with ambient lighting" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="minCapacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Min Capacity</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxCapacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Capacity</FormLabel>
                    <FormControl>
                      <Input type="number" min={1} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="maxConcurrentServices"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Concurrent Services</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} />
                  </FormControl>
                  <FormDescription>
                    How many services can run simultaneously in this room.
                  </FormDescription>
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
                {isLoading ? "Saving..." : isEditing ? "Save Changes" : "Add Room"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
