"use client"

import { useTranslations } from "next-intl"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/package/ui/button"
import { Plus } from "lucide-react"
import { RoomList } from "./room-list"
import { RoomForm } from "./room-form"
import { DeleteRoomDialog } from "./delete-room-dialog"
import type { Room, CreateRoomInput } from "../types"
import { createRoom, updateRoom, deleteRoom } from "../api"

interface RoomsPageProps {
  initialRooms: Room[]
}

export function RoomsPage({ initialRooms }: RoomsPageProps) {
  const t = useTranslations()
  const [isPending, startTransition] = useTransition()

  const [rooms, setRooms] = useState<Room[]>(initialRooms)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null)

  const handleAdd = () => {
    setSelectedRoom(null)
    setFormOpen(true)
  }

  const handleEdit = (room: Room) => {
    setSelectedRoom(room)
    setFormOpen(true)
  }

  const handleDeleteClick = (room: Room) => {
    setSelectedRoom(room)
    setDeleteDialogOpen(true)
  }

  const handleFormSubmit = async (data: CreateRoomInput) => {
    startTransition(async () => {
      if (selectedRoom) {
        const result = await updateRoom(selectedRoom.id, data)
        if (result.error) {
          toast.error(result.error.message)
          return
        }
        if (result.data) {
          setRooms((prev) =>
            prev.map((r) => (r.id === selectedRoom.id ? result.data! : r))
          )
          toast.success(t("common.success"))
        }
      } else {
        const result = await createRoom(data)
        if (result.error) {
          toast.error(result.error.message)
          return
        }
        if (result.data) {
          setRooms((prev) => [...prev, result.data!])
          toast.success(t("common.success"))
        }
      }
      setFormOpen(false)
      setSelectedRoom(null)
    })
  }

  const handleDeleteConfirm = async () => {
    if (!selectedRoom) return

    startTransition(async () => {
      const result = await deleteRoom(selectedRoom.id)
      if (result.error) {
        toast.error(result.error.message)
        return
      }
      setRooms((prev) => prev.filter((r) => r.id !== selectedRoom.id))
      toast.success(t("common.success"))
      setDeleteDialogOpen(false)
      setSelectedRoom(null)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("nav.rooms")}</h1>
          <p className="text-neutral-500">{t("rooms.description")}</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          {t("rooms.addRoom")}
        </Button>
      </div>

      <div className="rounded-lg border border-neutral-200">
        <RoomList rooms={rooms} onEdit={handleEdit} onDelete={handleDeleteClick} />
      </div>

      <RoomForm
        open={formOpen}
        onOpenChange={setFormOpen}
        room={selectedRoom}
        onSubmit={handleFormSubmit}
        isLoading={isPending}
      />

      <DeleteRoomDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        room={selectedRoom}
        onConfirm={handleDeleteConfirm}
        isLoading={isPending}
      />
    </div>
  )
}
