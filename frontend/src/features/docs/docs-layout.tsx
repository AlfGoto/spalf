"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations, useLocale } from "next-intl"
import { Book, FileCode, Webhook, Home, ExternalLink } from "lucide-react"

interface DocsLayoutProps {
  children: React.ReactNode
}

export function DocsLayout({ children }: DocsLayoutProps) {
  const t = useTranslations("docs")
  const locale = useLocale()
  const pathname = usePathname()

  const navItems = [
    {
      href: `/${locale}/docs`,
      label: "Home",
      icon: Home,
      exact: true,
    },
    {
      href: `/${locale}/docs/api-reference`,
      label: t("sections.apiReference"),
      icon: FileCode,
    },
    {
      href: `/${locale}/docs/guides`,
      label: t("sections.guides"),
      icon: Book,
    },
    {
      href: `/${locale}/docs/webhooks`,
      label: t("sections.webhooks"),
      icon: Webhook,
    },
  ]

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <Link href={`/${locale}/docs`} className="flex items-center gap-2">
                <span className="text-xl font-bold">Spalf</span>
                <span className="text-sm text-gray-500">Docs</span>
              </Link>
              <nav className="hidden md:flex items-center gap-6">
                {navItems.slice(1).map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? "text-black"
                        : "text-gray-500 hover:text-black"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/integration/ui"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-500 hover:text-black flex items-center gap-1"
              >
                Swagger UI
                <ExternalLink className="h-3 w-3" />
              </a>
              <Link
                href={`/${locale}/login`}
                className="text-sm font-medium bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile nav */}
      <nav className="md:hidden border-b border-gray-200 bg-gray-50 px-4 py-3 flex items-center gap-4 overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 text-sm whitespace-nowrap px-3 py-1.5 rounded-md ${
                isActive(item.href, item.exact)
                  ? "bg-black text-white"
                  : "text-gray-600 hover:bg-gray-200"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.exact ? "Home" : item.label}
            </Link>
          )
        })}
      </nav>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              Spalf Spa Management Software
            </p>
            <div className="flex items-center gap-6">
              <Link
                href={`/${locale}/docs/api-reference`}
                className="text-sm text-gray-500 hover:text-black"
              >
                API Reference
              </Link>
              <Link
                href={`/${locale}/docs/guides`}
                className="text-sm text-gray-500 hover:text-black"
              >
                Guides
              </Link>
              <Link
                href={`/${locale}/docs/webhooks`}
                className="text-sm text-gray-500 hover:text-black"
              >
                Webhooks
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
