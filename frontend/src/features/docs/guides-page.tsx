"use client"

import { useTranslations, useLocale } from "next-intl"
import Link from "next/link"
import { ArrowLeft, CheckCircle2 } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/package/ui/card"

export function GuidesPage() {
  const t = useTranslations("docs.guides")
  const tDocs = useTranslations("docs")
  const locale = useLocale()

  const guides = [
    {
      id: "getting-started",
      title: t("gettingStarted.title"),
      description: t("gettingStarted.description"),
      steps: [
        t("gettingStarted.step1"),
        t("gettingStarted.step2"),
        t("gettingStarted.step3"),
        t("gettingStarted.step4"),
      ],
    },
    {
      id: "webhook-setup",
      title: t("webhookSetup.title"),
      description: t("webhookSetup.description"),
      steps: [
        t("webhookSetup.step1"),
        t("webhookSetup.step2"),
        t("webhookSetup.step3"),
        t("webhookSetup.step4"),
      ],
    },
    {
      id: "reservation-sync",
      title: t("reservationSync.title"),
      description: t("reservationSync.description"),
      steps: [
        t("reservationSync.step1"),
        t("reservationSync.step2"),
        t("reservationSync.step3"),
        t("reservationSync.step4"),
      ],
    },
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

      {/* Getting Started Guide */}
      <GuideSection
        id={guides[0].id}
        title={guides[0].title}
        description={guides[0].description}
        steps={guides[0].steps}
      >
        <div className="mt-6 space-y-4">
          <h4 className="font-medium">Example: Authenticate with Cognito</h4>
          <CodeBlock language="javascript">
{`import { CognitoIdentityProviderClient, InitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({ region: "eu-central-1" });

const command = new InitiateAuthCommand({
  AuthFlow: "USER_PASSWORD_AUTH",
  ClientId: process.env.COGNITO_CLIENT_ID,
  AuthParameters: {
    USERNAME: "your-username",
    PASSWORD: "your-password",
  },
});

const response = await client.send(command);
const accessToken = response.AuthenticationResult?.AccessToken;`}
          </CodeBlock>

          <h4 className="font-medium mt-6">Example: Make an API Call</h4>
          <CodeBlock language="javascript">
{`const response = await fetch("https://your-api-url/integration/reservations", {
  headers: {
    Authorization: \`Bearer \${accessToken}\`,
  },
});

const reservations = await response.json();`}
          </CodeBlock>
        </div>
      </GuideSection>

      {/* Webhook Setup Guide */}
      <GuideSection
        id={guides[1].id}
        title={guides[1].title}
        description={guides[1].description}
        steps={guides[1].steps}
      >
        <div className="mt-6 space-y-4">
          <h4 className="font-medium">Step 1: Create Your Webhook Endpoint</h4>
          <CodeBlock language="javascript">
{`// Express.js example
app.post("/webhook", express.json(), (req, res) => {
  const signature = req.headers["x-spalf-signature"];
  const event = req.headers["x-spalf-event"];
  const payload = JSON.stringify(req.body);

  // Verify the signature
  if (!verifySignature(payload, signature, YOUR_WEBHOOK_SECRET)) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  // Process the webhook
  console.log("Received event:", event, req.body);

  res.json({ received: true });
});`}
          </CodeBlock>

          <h4 className="font-medium mt-6">Step 2: Create the Webhook Configuration</h4>
          <CodeBlock language="javascript">
{`const response = await fetch("https://your-api-url/integration/webhooks", {
  method: "POST",
  headers: {
    Authorization: \`Bearer \${accessToken}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    name: "My Integration",
    url: "https://your-server.com/webhook",
    events: ["reservation.created", "reservation.updated", "reservation.cancelled"],
    isActive: true,
  }),
});

const config = await response.json();
// Store config.secret securely - you'll need it to verify signatures`}
          </CodeBlock>

          <h4 className="font-medium mt-6">Step 3: Verify Signatures</h4>
          <CodeBlock language="javascript">
{`import crypto from "crypto";

function verifySignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(expectedSignature, "hex")
  );
}`}
          </CodeBlock>
        </div>
      </GuideSection>

      {/* Reservation Sync Guide */}
      <GuideSection
        id={guides[2].id}
        title={guides[2].title}
        description={guides[2].description}
        steps={guides[2].steps}
      >
        <div className="mt-6 space-y-4">
          <h4 className="font-medium">Example: Process Reservation Webhooks</h4>
          <CodeBlock language="javascript">
{`app.post("/webhook", async (req, res) => {
  const event = req.headers["x-spalf-event"];
  const { data } = req.body;

  switch (event) {
    case "reservation.created":
      await database.reservations.create({
        externalId: data.id,
        serviceId: data.serviceId,
        clientId: data.clientId,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        status: data.status,
      });
      break;

    case "reservation.updated":
      await database.reservations.update({
        externalId: data.id,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        status: data.status,
      });
      break;

    case "reservation.cancelled":
      await database.reservations.updateStatus({
        externalId: data.id,
        status: "CANCELLED",
      });
      break;
  }

  res.json({ received: true });
});`}
          </CodeBlock>

          <h4 className="font-medium mt-6">Example: Fetch Reservation Details</h4>
          <CodeBlock language="javascript">
{`// When you need more details than the webhook provides
async function fetchReservationDetails(reservationId) {
  const response = await fetch(
    \`https://your-api-url/integration/reservations/\${reservationId}\`,
    {
      headers: {
        Authorization: \`Bearer \${accessToken}\`,
      },
    }
  );

  return response.json();
}`}
          </CodeBlock>
        </div>
      </GuideSection>
    </div>
  )
}

function GuideSection({
  id,
  title,
  description,
  steps,
  children,
}: {
  id: string
  title: string
  description: string
  steps: string[]
  children?: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-20">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="space-y-3">
            {steps.map((step, index) => (
              <li key={index} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span className="text-gray-700">{step}</span>
              </li>
            ))}
          </ol>
          {children}
        </CardContent>
      </Card>
    </section>
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
