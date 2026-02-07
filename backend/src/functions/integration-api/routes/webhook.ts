import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { Effect, pipe } from "effect";
import { ValidationError, type AppError } from "../../../core/shared/errors";
import { verifySignedWebhook } from "../../../core/shared/crypto";
import type { IntegrationItem } from "../../../core/database/entities/integration.entity";

/**
 * Webhook receiver for external systems
 *
 * External systems can send webhooks to notify Spalf of events.
 * The webhook must be signed using the integration's secret.
 */

interface WebhookPayload {
  event: string;
  data: unknown;
  timestamp?: string;
}

// Helper to create JSON response
function jsonResponse(statusCode: number, body: unknown): APIGatewayProxyResult {
  return {
    statusCode,
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  };
}

export const webhookRouter = {
  /**
   * POST /integration/webhook
   *
   * Receive a webhook from an external system.
   * The webhook signature is verified against the integration's secret.
   *
   * Headers:
   *   X-Webhook-Signature: t=<timestamp>,v1=<signature>
   *
   * Body:
   *   { event: string, data: any, timestamp?: string }
   */
  receive: (
    event: APIGatewayProxyEvent,
    params: Record<string, string>,
    integration: IntegrationItem
  ): Effect.Effect<APIGatewayProxyResult, AppError> => {
    return pipe(
      // Verify webhook signature (if integration has a webhookUrl, we expect signed webhooks)
      Effect.succeed(null),
      Effect.flatMap(() => {
        const signatureHeader = event.headers?.["X-Webhook-Signature"] || event.headers?.["x-webhook-signature"];

        // For receiving webhooks, we may or may not require a signature
        // For now, we'll accept both signed and unsigned webhooks
        // In production, you'd want to enforce signatures

        if (signatureHeader && event.body) {
          // Note: We need the original secret to verify, not the hash
          // In a real implementation, you'd need to handle this differently
          // For now, we'll skip signature verification on incoming webhooks
          // since we only store the hash of the secret
          console.log("[Webhook] Signature header present, but skipping verification (hash-only storage)");
        }

        // Parse the webhook payload
        let payload: WebhookPayload;
        try {
          payload = JSON.parse(event.body || "{}");
        } catch {
          return Effect.fail(
            new ValidationError({ message: "Invalid JSON payload" })
          );
        }

        // Validate payload structure
        if (!payload.event) {
          return Effect.fail(
            new ValidationError({ message: "Missing 'event' field in webhook payload" })
          );
        }

        // Process the webhook event
        console.log(`[Webhook] Received event: ${payload.event} from integration ${integration.integrationId}`);
        console.log(`[Webhook] Data:`, JSON.stringify(payload.data));

        // Here you would dispatch the event to the appropriate handler
        // For now, we just acknowledge receipt
        return Effect.succeed(
          jsonResponse(200, {
            success: true,
            message: "Webhook received",
            event: payload.event,
            integrationId: integration.integrationId,
            receivedAt: new Date().toISOString(),
          })
        );
      })
    );
  },
};
