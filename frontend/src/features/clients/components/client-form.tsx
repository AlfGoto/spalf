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
import { Textarea } from "@/package/ui/textarea"
import type { Client, CreateClientInput } from "../types"

interface ClientFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  client?: Client | null
  onSubmit: (data: CreateClientInput) => Promise<void>
  isLoading?: boolean
}

export function ClientForm({
  open,
  onOpenChange,
  client,
  onSubmit,
  isLoading,
}: ClientFormProps) {
  const t = useTranslations()
  const isEditing = !!client

  const [formData, setFormData] = useState<CreateClientInput>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    allergies: "",
    preferences: "",
    notes: "",
  })

  useEffect(() => {
    if (client) {
      setFormData({
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        phone: client.phone || "",
        allergies: client.allergies || "",
        preferences: client.preferences || "",
        notes: client.notes || "",
      })
    } else {
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        allergies: "",
        preferences: "",
        notes: "",
      })
    }
  }, [client, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit({
      ...formData,
      phone: formData.phone || undefined,
      allergies: formData.allergies || undefined,
      preferences: formData.preferences || undefined,
      notes: formData.notes || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("clients.editClient") : t("clients.addClient")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">{t("clients.firstName")}</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, firstName: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{t("clients.lastName")}</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, lastName: e.target.value }))
                  }
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t("clients.email")}</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">{t("clients.phone")}</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="allergies">{t("clients.allergies")}</Label>
              <Textarea
                id="allergies"
                value={formData.allergies || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, allergies: e.target.value }))
                }
                placeholder={t("clients.allergiesPlaceholder")}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferences">{t("clients.preferences")}</Label>
              <Textarea
                id="preferences"
                value={formData.preferences || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, preferences: e.target.value }))
                }
                placeholder={t("clients.preferencesPlaceholder")}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">{t("clients.notes")}</Label>
              <Textarea
                id="notes"
                value={formData.notes || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, notes: e.target.value }))
                }
                placeholder={t("clients.notesPlaceholder")}
                rows={2}
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
