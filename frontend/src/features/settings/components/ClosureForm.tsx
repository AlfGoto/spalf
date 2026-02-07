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
import type { CreateClosureInput } from "@/shared/types";

const closureFormSchema = z
  .object({
    date: z.string().min(1, "Date is required"),
    reason: z.string().optional(),
    isAllDay: z.boolean().default(true),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!data.isAllDay) {
        if (!data.startTime || !data.endTime) {
          return false;
        }
        if (data.startTime >= data.endTime) {
          return false;
        }
      }
      return true;
    },
    {
      message: "For partial closures, start time must be before end time",
      path: ["startTime"],
    },
  );

type ClosureFormValues = z.infer<typeof closureFormSchema>;

interface ClosureFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateClosureInput) => Promise<void>;
  isLoading?: boolean;
}

export function ClosureForm({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: ClosureFormProps) {
  const form = useForm<ClosureFormValues>({
    resolver: zodResolver(closureFormSchema),
    defaultValues: {
      date: "",
      reason: "",
      isAllDay: true,
      startTime: "",
      endTime: "",
    },
  });

  const isAllDay = form.watch("isAllDay");

  const handleSubmit = async (values: ClosureFormValues) => {
    await onSubmit({
      date: values.date,
      reason: values.reason || undefined,
      isAllDay: values.isAllDay,
      startTime: values.isAllDay ? undefined : values.startTime,
      endTime: values.isAllDay ? undefined : values.endTime,
    });
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Closure</DialogTitle>
          <DialogDescription>
            Schedule a date when the spa will be closed.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
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
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Holiday, Maintenance"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isAllDay"
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
                  <FormLabel className="!mt-0">All day closure</FormLabel>
                </FormItem>
              )}
            />

            {!isAllDay && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <FormDescription>
              {isAllDay
                ? "The spa will be closed for the entire day."
                : "The spa will be closed during the specified hours."}
            </FormDescription>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Adding..." : "Add Closure"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
