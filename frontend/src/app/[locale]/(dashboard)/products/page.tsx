import { ProductsPage, listProducts } from "@/features/products"

export default async function Page() {
  const { data: products, error } = await listProducts()

  if (error) {
    console.error("Failed to fetch products:", error)
  }

  return <ProductsPage initialProducts={products || []} />
}
