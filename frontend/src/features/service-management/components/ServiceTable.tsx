"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/package/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/package/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/package/ui/dropdown-menu";
import type { Service } from "@/shared/types";
import { formatPrice } from "@/shared/utils";

interface ServiceTableProps {
  services: Service[];
  onEdit: (service: Service) => void;
  onDelete: (service: Service) => void;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}min`;
}

export function ServiceTable({
  services,
  onEdit,
  onDelete,
}: ServiceTableProps) {
  if (services.length === 0) {
    return (
      <div className="bg-white rounded-lg border p-8 text-center text-gray-500">
        <p>No services yet. Add your first service to get started.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Prep / Recovery</TableHead>
            <TableHead>Cancellation</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map((service) => (
            <TableRow key={service.serviceId}>
              <TableCell>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{service.name}</span>
                    {service.isComposed && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        Package
                      </span>
                    )}
                  </div>
                  {service.description && (
                    <div className="text-sm text-gray-500 truncate max-w-[200px]">
                      {service.description}
                    </div>
                  )}
                  {service.isComposed &&
                    service.composedServiceIds.length > 0 && (
                      <div className="text-xs text-gray-400 mt-0.5">
                        Includes {service.composedServiceIds.length} service(s)
                      </div>
                    )}
                </div>
              </TableCell>
              <TableCell>{formatDuration(service.duration)}</TableCell>
              <TableCell>{formatPrice(service.price)}</TableCell>
              <TableCell className="text-gray-500">
                {service.preparationTime > 0 || service.recoveryTime > 0
                  ? `${service.preparationTime}min / ${service.recoveryTime}min`
                  : "-"}
              </TableCell>
              <TableCell>
                <span className="text-gray-500">
                  {service.cancellationDeadlineHours}h before
                </span>
                {!service.canBeRescheduled && (
                  <span className="ml-2 text-xs text-red-500">
                    (no reschedule)
                  </span>
                )}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(service)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(service)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
