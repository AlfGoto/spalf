import { ClosuresPage, listClosures } from "@/features/closures"

export default async function Page() {
  const { data: closures, error } = await listClosures()

  if (error) {
    console.error("Failed to fetch closures:", error)
  }

  return <ClosuresPage initialClosures={closures || []} />
}
