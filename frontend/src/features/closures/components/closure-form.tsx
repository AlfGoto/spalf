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
import type { CreateClosureInput } from "../types"

interface ClosureFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: CreateClosureInput) => Promise<void>
  isLoading?: boolean
}

export function ClosureForm({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: ClosureFormProps) {
  const t = useTranslations()

  const [formData, setFormData] = useState<CreateClosureInput>({
    date: "",
    reason: "",
  })

  useEffect(() => {
    if (open) {
      // Reset form when opening
      setFormData({
        date: "",
        reason: "",
      })
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit({
      date: formData.date,
      reason: formData.reason || undefined,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("closures.addClosure")}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="date">{t("closures.date")}</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, date: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">{t("closures.reason")}</Label>
              <Textarea
                id="reason"
                value={formData.reason || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, reason: e.target.value }))
                }
                placeholder={t("closures.reasonPlaceholder")}
                rows={3}
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
