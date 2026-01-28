"use client"

import { useTranslations } from "next-intl"
import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/package/ui/button"
import { Plus } from "lucide-react"
import { ProductList } from "./product-list"
import { ProductForm } from "./product-form"
import { DeleteProductDialog } from "./delete-product-dialog"
import type { Product, CreateProductInput } from "../types"
import { createProduct, updateProduct, deleteProduct } from "../api"

interface ProductsPageProps {
  initialProducts: Product[]
}

export function ProductsPage({ initialProducts }: ProductsPageProps) {
  const t = useTranslations()
  const [isPending, startTransition] = useTransition()

  const [products, setProducts] = useState<Product[]>(initialProducts)
  const [formOpen, setFormOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const handleAdd = () => {
    setSelectedProduct(null)
    setFormOpen(true)
  }

  const handleEdit = (product: Product) => {
    setSelectedProduct(product)
    setFormOpen(true)
  }

  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product)
    setDeleteDialogOpen(true)
  }

  const handleFormSubmit = async (data: CreateProductInput) => {
    startTransition(async () => {
      if (selectedProduct) {
        const result = await updateProduct(selectedProduct.id, data)
        if (result.error) {
          toast.error(result.error.message)
          return
        }
        if (result.data) {
          setProducts((prev) =>
            prev.map((p) => (p.id === selectedProduct.id ? result.data! : p))
          )
          toast.success(t("common.success"))
        }
      } else {
        const result = await createProduct(data)
        if (result.error) {
          toast.error(result.error.message)
          return
        }
        if (result.data) {
          setProducts((prev) => [...prev, result.data!])
          toast.success(t("common.success"))
        }
      }
      setFormOpen(false)
      setSelectedProduct(null)
    })
  }

  const handleDeleteConfirm = async () => {
    if (!selectedProduct) return

    startTransition(async () => {
      const result = await deleteProduct(selectedProduct.id)
      if (result.error) {
        toast.error(result.error.message)
        return
      }
      setProducts((prev) => prev.filter((p) => p.id !== selectedProduct.id))
      toast.success(t("common.success"))
      setDeleteDialogOpen(false)
      setSelectedProduct(null)
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{t("nav.products")}</h1>
          <p className="text-neutral-500">{t("products.description")}</p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          {t("products.addProduct")}
        </Button>
      </div>

      <div className="rounded-lg border border-neutral-200">
        <ProductList products={products} onEdit={handleEdit} onDelete={handleDeleteClick} />
      </div>

      <ProductForm
        open={formOpen}
        onOpenChange={setFormOpen}
        product={selectedProduct}
        onSubmit={handleFormSubmit}
        isLoading={isPending}
      />

      <DeleteProductDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        product={selectedProduct}
        onConfirm={handleDeleteConfirm}
        isLoading={isPending}
      />
    </div>
  )
}
