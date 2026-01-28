"use client"

import { useTranslations, useLocale } from "next-intl"
import Link from "next/link"
import { ArrowLeft, Webhook, Shield, FileCode } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/package/ui/card"

export function WebhooksPage() {
  const t = useTranslations("docs.webhooks")
  const tDocs = useTranslations("docs")
  const locale = useLocale()

  const events = [
    { name: "reservation.created", description: t("eventTypes.reservationCreated") },
    { name: "reservation.updated", description: t("eventTypes.reservationUpdated") },
    { name: "reservation.cancelled", description: t("eventTypes.reservationCancelled") },
    { name: "client.created", description: t("eventTypes.clientCreated") },
    { name: "client.updated", description: t("eventTypes.clientUpdated") },
  ]

  const headers = [
    { name: "X-Spalf-Signature", description: "HMAC-SHA256 signature of the payload" },
    { name: "X-Spalf-Event", description: "The event type (e.g., reservation.created)" },
    { name: "X-Spalf-Timestamp", description: "ISO 8601 timestamp of when the webhook was sent" },
    { name: "Content-Type", description: "application/json" },
  ]

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
      </div>

      {/* Overview */}
      <Section icon={Webhook} title={t("overview")}>
        <p className="text-gray-600">{t("overviewDescription")}</p>
      </Section>

      {/* Available Events */}
      <Section id="events" icon={FileCode} title={t("events")}>
        <p className="text-gray-600 mb-4">{t("eventsDescription")}</p>
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.name}
              className="flex items-start gap-4 p-3 border border-gray-200 rounded-lg"
            >
              <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono flex-shrink-0">
                {event.name}
              </code>
              <span className="text-gray-600 text-sm">{event.description}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Payload Format */}
      <Section title={t("payloadFormat")}>
        <p className="text-gray-600 mb-4">{t("payloadDescription")}</p>
        <CodeBlock language="json">
{`{
  "event": "reservation.created",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "spaId": "550e8400-e29b-41d4-a716-446655440000",
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "serviceId": "770e8400-e29b-41d4-a716-446655440002",
    "clientId": "880e8400-e29b-41d4-a716-446655440003",
    "employeeId": "990e8400-e29b-41d4-a716-446655440004",
    "roomId": "aa0e8400-e29b-41d4-a716-446655440005",
    "date": "2024-01-20",
    "startTime": "14:00",
    "endTime": "15:00",
    "status": "CONFIRMED",
    "notes": null
  }
}`}
        </CodeBlock>
      </Section>

      {/* Headers */}
      <Section title={t("headers")}>
        <p className="text-gray-600 mb-4">{t("headersDescription")}</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 pr-4 font-medium">Header</th>
                <th className="text-left py-2 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              {headers.map((header) => (
                <tr key={header.name} className="border-b border-gray-100">
                  <td className="py-2 pr-4">
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-sm">
                      {header.name}
                    </code>
                  </td>
                  <td className="py-2 text-gray-600">{header.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Security */}
      <Section id="security" icon={Shield} title={t("security")}>
        <p className="text-gray-600 mb-4">{t("securityDescription")}</p>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">{t("signatureHeader")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm mb-4">{t("signatureDescription")}</p>
            <CodeBlock language="text">
              X-Spalf-Signature: 5d41402abc4b2a76b9719d911017c592
            </CodeBlock>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("verifyingSignatures")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 text-sm mb-4">{t("verifyingDescription")}</p>
            <CodeBlock language="javascript">
{`import crypto from "crypto";

function verifyWebhookSignature(payload, signature, secret) {
  // Calculate the expected signature
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  // Use constant-time comparison to prevent timing attacks
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expectedSignature, "hex")
    );
  } catch {
    return false;
  }
}

// Usage in Express.js
app.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
  const signature = req.headers["x-spalf-signature"];
  const payload = req.body.toString();

  if (!verifyWebhookSignature(payload, signature, process.env.WEBHOOK_SECRET)) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  const data = JSON.parse(payload);
  // Process the webhook...

  res.json({ received: true });
});`}
            </CodeBlock>
          </CardContent>
        </Card>
      </Section>

      {/* Best Practices */}
      <Section title="Best Practices">
        <div className="space-y-4">
          <BestPractice
            title="Always verify signatures"
            description="Never process a webhook without first verifying its signature. This ensures the request came from Spalf and hasn't been tampered with."
          />
          <BestPractice
            title="Respond quickly"
            description="Return a 2xx response as soon as possible. Do heavy processing asynchronously to avoid timeouts. Spalf will retry failed deliveries up to 3 times."
          />
          <BestPractice
            title="Handle duplicates"
            description="Webhooks may occasionally be delivered more than once. Use the event ID or implement idempotency to handle duplicate deliveries gracefully."
          />
          <BestPractice
            title="Store the secret securely"
            description="Keep your webhook secret in environment variables or a secrets manager. Never commit it to version control or expose it in client-side code."
          />
          <BestPractice
            title="Use HTTPS"
            description="Always use HTTPS for your webhook endpoint to ensure the payload is encrypted in transit."
          />
        </div>
      </Section>
    </div>
  )
}

function Section({
  id,
  icon: Icon,
  title,
  children,
}: {
  id?: string
  icon?: React.ComponentType<{ className?: string }>
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <div className="flex items-center gap-3 mb-4 pb-2 border-b border-gray-200">
        {Icon && <Icon className="h-5 w-5 text-gray-600" />}
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function BestPractice({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="p-4 border border-gray-200 rounded-lg">
      <h4 className="font-medium mb-1">{title}</h4>
      <p className="text-sm text-gray-600">{description}</p>
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
