"use client"

import Link from "next/link"
import { useTranslations, useLocale } from "next-intl"
import { FileCode, Book, Webhook, ArrowRight } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription } from "@/package/ui/card"

export function DocsLandingPage() {
  const t = useTranslations("docs")
  const locale = useLocale()

  const sections = [
    {
      href: `/${locale}/docs/api-reference`,
      title: t("sections.apiReference"),
      description: t("sections.apiReferenceDescription"),
      icon: FileCode,
    },
    {
      href: `/${locale}/docs/guides`,
      title: t("sections.guides"),
      description: t("sections.guidesDescription"),
      icon: Book,
    },
    {
      href: `/${locale}/docs/webhooks`,
      title: t("sections.webhooks"),
      description: t("sections.webhooksDescription"),
      icon: Webhook,
    },
  ]

  return (
    <div className="space-y-12">
      {/* Hero section */}
      <div className="text-center space-y-4 py-12">
        <h1 className="text-4xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          {t("subtitle")}
        </p>
        <div className="flex items-center justify-center gap-4 pt-4">
          <Link
            href={`/${locale}/docs/guides`}
            className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-md font-medium hover:bg-gray-800 transition-colors"
          >
            {t("getStarted")}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={`/${locale}/docs/api-reference`}
            className="inline-flex items-center gap-2 border border-gray-300 px-6 py-3 rounded-md font-medium hover:bg-gray-50 transition-colors"
          >
            {t("viewApiReference")}
          </Link>
        </div>
      </div>

      {/* Section cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {sections.map((section) => {
          const Icon = section.icon
          return (
            <Link key={section.href} href={section.href}>
              <Card className="h-full hover:border-gray-400 transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-gray-100 rounded-md">
                      <Icon className="h-5 w-5" />
                    </div>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                  </div>
                  <CardDescription className="text-sm text-gray-600">
                    {section.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Quick links */}
      <div className="border-t border-gray-200 pt-12">
        <h2 className="text-2xl font-bold mb-6">Quick Links</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <QuickLink
            title="Create a Reservation"
            description="Learn how to create reservations via the Integration API"
            href={`/${locale}/docs/api-reference#reservations`}
          />
          <QuickLink
            title="Set Up Webhooks"
            description="Configure webhooks to receive real-time notifications"
            href={`/${locale}/docs/webhooks`}
          />
          <QuickLink
            title="Authentication"
            description="Understand how to authenticate with the Integration API"
            href={`/${locale}/docs/api-reference#authentication`}
          />
          <QuickLink
            title="Webhook Events"
            description="See all available webhook events and their payloads"
            href={`/${locale}/docs/webhooks#events`}
          />
        </div>
      </div>
    </div>
  )
}

function QuickLink({
  title,
  description,
  href,
}: {
  title: string
  description: string
  href: string
}) {
  return (
    <Link
      href={href}
      className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:border-gray-400 transition-colors"
    >
      <div className="flex-1">
        <h3 className="font-medium">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <ArrowRight className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
    </Link>
  )
}
