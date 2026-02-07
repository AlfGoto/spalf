"use client";

import { Button } from "@/package/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/package/ui/dialog";
import type { Reservation, Service, Employee, Room, Client } from "@/shared/types";

interface ReservationDetailsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservation: Reservation | null;
  service?: Service;
  employee?: Employee;
  room?: Room;
  client?: Client;
  onEdit: () => void;
  onCancel: () => void;
  onComplete: () => void;
  isLoading?: boolean;
}

function getStatusBadge(status: string) {
  const styles: Record<string, string> = {
    CONFIRMED: "bg-blue-100 text-blue-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    COMPLETED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || "bg-gray-100 text-gray-700"}`}
    >
      {status}
    </span>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function ReservationDetails({
  open,
  onOpenChange,
  reservation,
  service,
  employee,
  room,
  client,
  onEdit,
  onCancel,
  onComplete,
  isLoading,
}: ReservationDetailsProps) {
  if (!reservation) return null;

  const canEdit = reservation.status === "CONFIRMED" || reservation.status === "PENDING";
  const canCancel = reservation.status === "CONFIRMED" || reservation.status === "PENDING";
  const canComplete = reservation.status === "CONFIRMED";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Reservation Details
            {getStatusBadge(reservation.status)}
          </DialogTitle>
          <DialogDescription>
            {formatDate(reservation.date)} at {reservation.startTime} -{" "}
            {reservation.endTime}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Service */}
          <div>
            <h4 className="text-sm font-medium text-gray-500">Service</h4>
            <p className="mt-1">
              {service?.name || "Unknown Service"}
              {service && (
                <span className="text-gray-500 ml-2">
                  ({service.duration} min, ${service.price.toFixed(2)})
                </span>
              )}
            </p>
          </div>

          {/* Client */}
          <div>
            <h4 className="text-sm font-medium text-gray-500">Client</h4>
            <p className="mt-1">
              {client
                ? `${client.firstName} ${client.lastName}`
                : "Unknown Client"}
            </p>
            {client?.email && (
              <p className="text-sm text-gray-500">{client.email}</p>
            )}
            {client?.phone && (
              <p className="text-sm text-gray-500">{client.phone}</p>
            )}
          </div>

          {/* Employee */}
          <div>
            <h4 className="text-sm font-medium text-gray-500">Employee</h4>
            <p className="mt-1">
              {employee
                ? `${employee.firstName} ${employee.lastName}`
                : "Unknown Employee"}
            </p>
          </div>

          {/* Room */}
          <div>
            <h4 className="text-sm font-medium text-gray-500">Room</h4>
            <p className="mt-1">{room?.name || "Unknown Room"}</p>
          </div>

          {/* Notes */}
          {reservation.notes && (
            <div>
              <h4 className="text-sm font-medium text-gray-500">Notes</h4>
              <p className="mt-1 text-sm">{reservation.notes}</p>
            </div>
          )}

          {/* Cancellation info */}
          {reservation.status === "CANCELLED" && (
            <div className="bg-red-50 p-3 rounded-lg">
              <h4 className="text-sm font-medium text-red-700">Cancelled</h4>
              {reservation.cancellationReason && (
                <p className="mt-1 text-sm text-red-600">
                  Reason: {reservation.cancellationReason}
                </p>
              )}
            </div>
          )}

          {/* Timestamps */}
          <div className="pt-4 border-t text-xs text-gray-500">
            <p>Created: {new Date(reservation.createdAt).toLocaleString()}</p>
            <p>Updated: {new Date(reservation.updatedAt).toLocaleString()}</p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {canCancel && (
            <Button
              type="button"
              variant="destructive"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel Reservation
            </Button>
          )}
          {canComplete && (
            <Button
              type="button"
              variant="outline"
              onClick={onComplete}
              disabled={isLoading}
            >
              Mark Complete
            </Button>
          )}
          {canEdit && (
            <Button type="button" onClick={onEdit} disabled={isLoading}>
              Edit
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
