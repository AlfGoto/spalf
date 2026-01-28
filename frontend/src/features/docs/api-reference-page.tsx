"use client"

import { useTranslations, useLocale } from "next-intl"
import Link from "next/link"
import { ArrowLeft, ExternalLink } from "lucide-react"

export function ApiReferencePage() {
  const t = useTranslations("docs.apiReference")
  const tDocs = useTranslations("docs")
  const locale = useLocale()

  return (
    <div className="max-w-4xl mx-auto space-y-12">
      {/* Back link */}
      <Link
        href={`/${locale}/docs`}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-black"
      >
        <ArrowLeft className="h-4 w-4" />
        {tDocs("backToHome")}
      </Link>

      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-gray-600">{t("subtitle")}</p>
        <a
          href="/integration/ui"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-black mt-2"
        >
          {tDocs("tryItOut")}
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Authentication */}
      <Section id="authentication" title={t("authentication")}>
        <p className="text-gray-600 mb-4">{t("authenticationDescription")}</p>
        <CodeBlock language="bash">
{`curl -X GET "https://api.spalf.com/integration/reservations" \\
  -H "Authorization: Bearer <your-token>"`}
        </CodeBlock>
      </Section>

      {/* Base URL */}
      <Section id="base-url" title={t("baseUrl")}>
        <CodeBlock language="text">
          https://&lt;your-api-gateway-url&gt;/integration
        </CodeBlock>
        <p className="text-sm text-gray-500 mt-2">
          The actual URL is provided in your integration credentials.
        </p>
      </Section>

      {/* Reservations */}
      <Section id="reservations" title={t("reservations.title")}>
        <p className="text-gray-600 mb-6">{t("reservations.description")}</p>

        <Endpoint
          method="GET"
          path="/integration/reservations"
          description={t("reservations.list")}
          parameters={[
            { name: "startDate", type: "string", required: false, description: "Start date (YYYY-MM-DD)" },
            { name: "endDate", type: "string", required: false, description: "End date (YYYY-MM-DD)" },
            { name: "status", type: "string", required: false, description: "PENDING | CONFIRMED | COMPLETED | CANCELLED" },
          ]}
          response={`[
  {
    "id": "uuid",
    "spaId": "uuid",
    "serviceId": "uuid",
    "clientId": "uuid",
    "employeeId": "uuid",
    "roomId": "uuid",
    "date": "2024-01-15",
    "startTime": "10:00",
    "endTime": "11:00",
    "status": "CONFIRMED",
    "notes": "string | null",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]`}
          t={t}
        />

        <Endpoint
          method="GET"
          path="/integration/reservations/{id}"
          description={t("reservations.get")}
          parameters={[
            { name: "id", type: "string", required: true, description: "Reservation UUID" },
          ]}
          response={`{
  "id": "uuid",
  "spaId": "uuid",
  "serviceId": "uuid",
  "clientId": "uuid",
  "employeeId": "uuid",
  "roomId": "uuid",
  "date": "2024-01-15",
  "startTime": "10:00",
  "endTime": "11:00",
  "status": "CONFIRMED",
  "notes": "string | null",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}`}
          t={t}
        />

        <Endpoint
          method="POST"
          path="/integration/reservations"
          description={t("reservations.create")}
          request={`{
  "serviceId": "uuid",
  "clientId": "uuid",
  "employeeId": "uuid",
  "roomId": "uuid",
  "date": "2024-01-15",
  "startTime": "10:00",
  "endTime": "11:00",
  "status": "PENDING",
  "notes": "string | null"
}`}
          response={`{
  "id": "uuid",
  "spaId": "uuid",
  ...
}`}
          t={t}
        />

        <Endpoint
          method="PUT"
          path="/integration/reservations/{id}"
          description={t("reservations.update")}
          parameters={[
            { name: "id", type: "string", required: true, description: "Reservation UUID" },
          ]}
          request={`{
  "date": "2024-01-16",
  "startTime": "14:00",
  "endTime": "15:00",
  "status": "CONFIRMED"
}`}
          response={`{
  "id": "uuid",
  "spaId": "uuid",
  ...
}`}
          t={t}
        />
      </Section>

      {/* Webhook Management */}
      <Section id="webhooks" title={t("webhooks.title")}>
        <p className="text-gray-600 mb-6">{t("webhooks.description")}</p>

        <Endpoint
          method="GET"
          path="/integration/webhooks/events"
          description={t("webhooks.listEvents")}
          response={`[
  { "event": "reservation.created", "description": "..." },
  { "event": "reservation.updated", "description": "..." },
  { "event": "reservation.cancelled", "description": "..." },
  { "event": "client.created", "description": "..." },
  { "event": "client.updated", "description": "..." }
]`}
          t={t}
        />

        <Endpoint
          method="GET"
          path="/integration/webhooks"
          description={t("webhooks.list")}
          response={`[
  {
    "id": "uuid",
    "spaId": "uuid",
    "name": "My Webhook",
    "url": "https://example.com/webhook",
    "events": ["reservation.created", "reservation.updated"],
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  }
]`}
          t={t}
        />

        <Endpoint
          method="GET"
          path="/integration/webhooks/{id}"
          description={t("webhooks.get")}
          parameters={[
            { name: "id", type: "string", required: true, description: "Webhook config UUID" },
          ]}
          response={`{
  "id": "uuid",
  "spaId": "uuid",
  "name": "My Webhook",
  "url": "https://example.com/webhook",
  "secret": "your-secret-key",
  "events": ["reservation.created", "reservation.updated"],
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}`}
          t={t}
        />

        <Endpoint
          method="POST"
          path="/integration/webhooks"
          description={t("webhooks.create")}
          request={`{
  "name": "My Webhook",
  "url": "https://example.com/webhook",
  "events": ["reservation.created", "reservation.updated"],
  "isActive": true
}`}
          response={`{
  "id": "uuid",
  "secret": "generated-secret",
  ...
}`}
          t={t}
        />

        <Endpoint
          method="PUT"
          path="/integration/webhooks/{id}"
          description={t("webhooks.update")}
          parameters={[
            { name: "id", type: "string", required: true, description: "Webhook config UUID" },
          ]}
          request={`{
  "name": "Updated Webhook",
  "events": ["reservation.created"],
  "isActive": false
}`}
          t={t}
        />

        <Endpoint
          method="DELETE"
          path="/integration/webhooks/{id}"
          description={t("webhooks.delete")}
          parameters={[
            { name: "id", type: "string", required: true, description: "Webhook config UUID" },
          ]}
          t={t}
        />

        <Endpoint
          method="POST"
          path="/integration/webhooks/{id}/regenerate-secret"
          description={t("webhooks.regenerateSecret")}
          parameters={[
            { name: "id", type: "string", required: true, description: "Webhook config UUID" },
          ]}
          response={`{
  "id": "uuid",
  "secret": "new-generated-secret",
  ...
}`}
          t={t}
        />
      </Section>

      {/* Security */}
      <Section id="security" title={t("security.title")}>
        <p className="text-gray-600 mb-6">{t("security.description")}</p>

        <Endpoint
          method="POST"
          path="/integration/verify-hash"
          description={t("security.verifyHash")}
          request={`{
  "webhookConfigId": "uuid",
  "payload": "{ ... }",
  "signature": "hex-signature"
}`}
          response={`{
  "valid": true
}`}
          t={t}
        />

        <Endpoint
          method="POST"
          path="/integration/webhook"
          description={t("security.receiveWebhook")}
          request={`{
  "event": "external.event.type",
  "timestamp": "2024-01-01T00:00:00Z",
  "data": { ... }
}`}
          response={`{
  "received": true,
  "message": "Webhook event 'external.event.type' received successfully"
}`}
          t={t}
        />
      </Section>
    </div>
  )
}

function Section({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <h2 className="text-2xl font-bold mb-4 pb-2 border-b border-gray-200">{title}</h2>
      {children}
    </section>
  )
}

function Endpoint({
  method,
  path,
  description,
  parameters,
  request,
  response,
  t,
}: {
  method: "GET" | "POST" | "PUT" | "DELETE"
  path: string
  description: string
  parameters?: { name: string; type: string; required: boolean; description: string }[]
  request?: string
  response?: string
  t: any
}) {
  const methodColors = {
    GET: "bg-green-100 text-green-800",
    POST: "bg-blue-100 text-blue-800",
    PUT: "bg-yellow-100 text-yellow-800",
    DELETE: "bg-red-100 text-red-800",
  }

  return (
    <div className="border border-gray-200 rounded-lg mb-6 overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <span className={`px-2 py-1 text-xs font-mono font-bold rounded ${methodColors[method]}`}>
            {method}
          </span>
          <code className="text-sm font-mono">{path}</code>
        </div>
        <p className="text-sm text-gray-600 mt-2">{description}</p>
      </div>

      <div className="p-4 space-y-4">
        {parameters && parameters.length > 0 && (
          <div>
            <h4 className="text-sm font-medium mb-2">{t("parameters")}</h4>
            <div className="space-y-2">
              {parameters.map((param) => (
                <div key={param.name} className="text-sm">
                  <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                    {param.name}
                  </code>
                  <span className="text-gray-500 mx-2">{param.type}</span>
                  <span className={`text-xs ${param.required ? "text-red-600" : "text-gray-400"}`}>
                    ({param.required ? t("required") : t("optional")})
                  </span>
                  <span className="text-gray-600 ml-2">{param.description}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {request && (
          <div>
            <h4 className="text-sm font-medium mb-2">{t("request")}</h4>
            <CodeBlock language="json">{request}</CodeBlock>
          </div>
        )}

        {response && (
          <div>
            <h4 className="text-sm font-medium mb-2">{t("response")}</h4>
            <CodeBlock language="json">{response}</CodeBlock>
          </div>
        )}
      </div>
    </div>
  )
}

function CodeBlock({
  children,
  language,
}: {
  children: string
  language: string
}) {
  return (
    <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
      <code>{children}</code>
    </pre>
  )
}
