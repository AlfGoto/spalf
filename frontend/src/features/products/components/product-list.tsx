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
import type { Product } from "../types"
import { formatPrice } from "../types"

interface ProductListProps {
  products: Product[]
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
}

export function ProductList({ products, onEdit, onDelete }: ProductListProps) {
  const t = useTranslations()

  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-neutral-500">
        {t("products.noProducts")}
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("products.name")}</TableHead>
          <TableHead>{t("products.price")}</TableHead>
          <TableHead>{t("products.quantity")}</TableHead>
          <TableHead className="w-[100px]">{t("common.actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {products.map((product) => (
          <TableRow key={product.id}>
            <TableCell className="font-medium">{product.name}</TableCell>
            <TableCell>${formatPrice(product.price)}</TableCell>
            <TableCell>
              {product.quantity === null || product.quantity === undefined
                ? t("products.infinite")
                : product.quantity}
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(product)}
                  aria-label={t("common.edit")}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(product)}
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
