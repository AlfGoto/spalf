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
import type { Room } from "../types"

interface RoomListProps {
  rooms: Room[]
  onEdit: (room: Room) => void
  onDelete: (room: Room) => void
}

export function RoomList({ rooms, onEdit, onDelete }: RoomListProps) {
  const t = useTranslations()

  if (rooms.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-500">
        {t("rooms.noRooms")}
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("rooms.name")}</TableHead>
          <TableHead>{t("rooms.minCapacity")}</TableHead>
          <TableHead>{t("rooms.maxCapacity")}</TableHead>
          <TableHead>{t("rooms.maxConcurrentServices")}</TableHead>
          <TableHead className="w-[100px]">{t("common.actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rooms.map((room) => (
          <TableRow key={room.id}>
            <TableCell className="font-medium">{room.name}</TableCell>
            <TableCell>{room.minCapacity}</TableCell>
            <TableCell>{room.maxCapacity}</TableCell>
            <TableCell>{room.maxConcurrentServices}</TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(room)}
                  aria-label={t("common.edit")}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(room)}
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
