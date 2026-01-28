import { DocsLayout } from "@/features/docs"

interface PublicLayoutProps {
  children: React.ReactNode
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return <DocsLayout>{children}</DocsLayout>
}
