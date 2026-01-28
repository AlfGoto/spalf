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
import type { Product, CreateProductInput } from "../types"
import { formatPrice, parsePriceToCents } from "../types"

interface ProductFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product?: Product | null
  onSubmit: (data: CreateProductInput) => Promise<void>
  isLoading?: boolean
}

export function ProductForm({
  open,
  onOpenChange,
  product,
  onSubmit,
  isLoading,
}: ProductFormProps) {
  const t = useTranslations()
  const isEditing = !!product

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    quantity: "",
    isInfinite: true,
  })

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        price: formatPrice(product.price),
        quantity:
          product.quantity === null || product.quantity === undefined
            ? ""
            : product.quantity.toString(),
        isInfinite:
          product.quantity === null || product.quantity === undefined,
      })
    } else {
      setFormData({
        name: "",
        price: "",
        quantity: "",
        isInfinite: true,
      })
    }
  }, [product, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit({
      name: formData.name,
      price: parsePriceToCents(formData.price),
      quantity: formData.isInfinite
        ? null
        : parseInt(formData.quantity, 10) || 0,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t("products.editProduct") : t("products.addProduct")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("products.name")}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">{t("products.price")}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
                  $
                </span>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  className="pl-7"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, price: e.target.value }))
                  }
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t("products.quantity")}</Label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isInfinite}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        isInfinite: e.target.checked,
                        quantity: e.target.checked ? "" : prev.quantity,
                      }))
                    }
                    className="h-4 w-4 rounded border-neutral-300"
                  />
                  <span className="text-sm">{t("products.infiniteStock")}</span>
                </label>
              </div>
              {!formData.isInfinite && (
                <Input
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      quantity: e.target.value,
                    }))
                  }
                  placeholder={t("products.quantityPlaceholder")}
                  required={!formData.isInfinite}
                />
              )}
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
