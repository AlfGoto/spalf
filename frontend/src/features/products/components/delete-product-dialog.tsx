"use client"

import { useTranslations } from "next-intl"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/package/ui/dialog"
import { Button } from "@/package/ui/button"
import type { Product } from "../types"

interface DeleteProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: Product | null
  onConfirm: () => Promise<void>
  isLoading?: boolean
}

export function DeleteProductDialog({
  open,
  onOpenChange,
  product,
  onConfirm,
  isLoading,
}: DeleteProductDialogProps) {
  const t = useTranslations()

  if (!product) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("products.deleteProduct")}</DialogTitle>
          <DialogDescription>
            {t("products.deleteConfirmation", {
              name: product.name,
            })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? t("common.loading") : t("common.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
