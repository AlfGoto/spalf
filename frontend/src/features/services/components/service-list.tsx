"use client"

import { useTranslations } from "next-intl"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/package/ui/table"
import { Button } from "@/package/ui/button"
import { Pencil, Trash2 } from "lucide-react"
import type { Service } from "../types"
import { formatPrice, formatDuration } from "../types"

interface ServiceListProps {
  services: Service[]
  onEdit: (service: Service) => void
  onDelete: (service: Service) => void
}

export function ServiceList({ services, onEdit, onDelete }: ServiceListProps) {
  const t = useTranslations()

  if (services.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-500">
        {t("services.noServices")}
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("services.name")}</TableHead>
          <TableHead>{t("services.price")}</TableHead>
          <TableHead>{t("services.duration")}</TableHead>
          <TableHead>{t("services.canReschedule")}</TableHead>
          <TableHead className="w-[100px]">{t("common.actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {services.map((service) => (
          <TableRow key={service.id}>
            <TableCell>
              <div>
                <span className="font-medium">{service.name}</span>
                {service.description && (
                  <p className="text-sm text-neutral-500 truncate max-w-xs">
                    {service.description}
                  </p>
                )}
              </div>
            </TableCell>
            <TableCell>${formatPrice(service.price)}</TableCell>
            <TableCell>{formatDuration(service.duration)}</TableCell>
            <TableCell>
              {service.canReschedule ? t("common.yes") : t("common.no")}
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(service)}
                  aria-label={t("common.edit")}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(service)}
                  aria-label={t("common.delete")}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
