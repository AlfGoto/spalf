"use client";

import { useEffect, useState } from "react";
import { Button } from "@/package/ui/button";
import { useProducts } from "./hooks/useProducts";
import { ProductTable } from "./components/ProductTable";
import { ProductForm } from "./components/ProductForm";
import { DeleteConfirmDialog } from "@/features/employee-management";
import type { Product, CreateProductInput } from "@/shared/types";

export function ProductsPage() {
  const {
    products,
    isLoading,
    error,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    clearError,
  } = useProducts();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsFormOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsFormOpen(true);
  };

  const handleDeleteProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (data: CreateProductInput) => {
    if (selectedProduct) {
      const result = await updateProduct(selectedProduct.productId, data);
      if (result) {
        setIsFormOpen(false);
        setSelectedProduct(null);
      }
    } else {
      const result = await createProduct(data);
      if (result) {
        setIsFormOpen(false);
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (selectedProduct) {
      const success = await deleteProduct(selectedProduct.productId);
      if (success) {
        setIsDeleteDialogOpen(false);
        setSelectedProduct(null);
      }
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage products and inventory for your spa services.
          </p>
        </div>
        <Button onClick={handleAddProduct}>Add Product</Button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <p className="text-sm text-red-600">{error}</p>
          <Button variant="ghost" size="sm" onClick={clearError}>
            Dismiss
          </Button>
        </div>
      )}

      {isLoading && products.length === 0 ? (
        <div className="bg-white rounded-lg border p-8 text-center text-gray-500">
          <p>Loading products...</p>
        </div>
      ) : (
        <ProductTable
          products={products}
          onEdit={handleEditProduct}
          onDelete={handleDeleteProduct}
        />
      )}

      <ProductForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        product={selectedProduct}
        onSubmit={handleFormSubmit}
        isLoading={isLoading}
      />

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Delete Product"
        description={`Are you sure you want to delete "${selectedProduct?.name}"? This action cannot be undone.`}
        onConfirm={handleConfirmDelete}
        isLoading={isLoading}
      />
    </div>
  );
}
