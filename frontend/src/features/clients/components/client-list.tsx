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
import type { Client } from "../types"

interface ClientListProps {
  clients: Client[]
  onEdit: (client: Client) => void
  onDelete: (client: Client) => void
}

export function ClientList({ clients, onEdit, onDelete }: ClientListProps) {
  const t = useTranslations()

  if (clients.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-500">
        {t("clients.noClients")}
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("clients.firstName")}</TableHead>
          <TableHead>{t("clients.lastName")}</TableHead>
          <TableHead>{t("clients.email")}</TableHead>
          <TableHead>{t("clients.phone")}</TableHead>
          <TableHead className="w-[100px]">{t("common.actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {clients.map((client) => (
          <TableRow key={client.id}>
            <TableCell className="font-medium">{client.firstName}</TableCell>
            <TableCell>{client.lastName}</TableCell>
            <TableCell>{client.email}</TableCell>
            <TableCell>{client.phone || "-"}</TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(client)}
                  aria-label={t("common.edit")}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(client)}
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
