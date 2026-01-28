"use client"

import { useTranslations } from "next-intl"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/package/ui/dialog"
import { Button } from "@/package/ui/button"
import { Input } from "@/package/ui/input"
import { Label } from "@/package/ui/label"
import type { Room, CreateRoomInput } from "../types"

interface RoomFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  room?: Room | null
  onSubmit: (data: CreateRoomInput) => Promise<void>
  isLoading?: boolean
}

export function RoomForm({
  open,
  onOpenChange,
  room,
  onSubmit,
  isLoading,
}: RoomFormProps) {
  const t = useTranslations()
  const isEditing = !!room

  const [formData, setFormData] = useState<CreateRoomInput>({
    name: "",
    minCapacity: 1,
    maxCapacity: 1,
    maxConcurrentServices: 1,
  })

  useEffect(() => {
    if (room) {
      setFormData({
        name: room.name,
        minCapacity: room.minCapacity,
        maxCapacity: room.maxCapacity,
        maxConcurrentServices: room.maxConcurrentServices,
      })
    } else {
      setFormData({
        name: "",
        minCapacity: 1,
        maxCapacity: 1,
        maxConcurrentServices: 1,
      })
    }
  }, [room, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("rooms.editRoom") : t("rooms.addRoom")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("rooms.name")}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minCapacity">{t("rooms.minCapacity")}</Label>
                <Input
                  id="minCapacity"
                  type="number"
                  min={1}
                  value={formData.minCapacity}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      minCapacity: parseInt(e.target.value, 10) || 1,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxCapacity">{t("rooms.maxCapacity")}</Label>
                <Input
                  id="maxCapacity"
                  type="number"
                  min={1}
                  value={formData.maxCapacity}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      maxCapacity: parseInt(e.target.value, 10) || 1,
                    }))
                  }
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxConcurrentServices">
                {t("rooms.maxConcurrentServices")}
              </Label>
              <Input
                id="maxConcurrentServices"
                type="number"
                min={1}
                value={formData.maxConcurrentServices}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    maxConcurrentServices: parseInt(e.target.value, 10) || 1,
                  }))
                }
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t("common.loading") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
