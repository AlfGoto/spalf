import { QueryCommand } from "dynamodb-toolbox/table/actions/query";
import { SpalfTable } from "../../../core/database/table";
import {
  IntegrationEntity,
  type IntegrationItem,
} from "../../../core/database/entities/integration.entity";
import { signWebhookPayload, generateSecretToken } from "../../../core/shared/crypto";

/**
 * Send webhooks to all integrations subscribed to a specific event
 */

interface WebhookPayload {
  eventType: string;
  spaId: string;
  data: unknown;
  timestamp: string;
}

interface SendWebhookResult {
  total: number;
  sent: number;
  failed: number;
  results: Array<{
    integrationId: string;
    success: boolean;
    error?: string;
    statusCode?: number;
  }>;
}

/**
 * Send a webhook to a single integration
 */
async function sendToIntegration(
  integration: IntegrationItem,
  payload: WebhookPayload
): Promise<{ success: boolean; error?: string; statusCode?: number }> {
  if (!integration.webhookUrl) {
    return { success: false, error: "No webhook URL configured" };
  }

  if (!integration.isActive) {
    return { success: false, error: "Integration is not active" };
  }

  // Check if this integration is subscribed to this event type
  if (
    integration.webhookEvents.length > 0 &&
    !integration.webhookEvents.includes(payload.eventType) &&
    !integration.webhookEvents.includes("*")
  ) {
    return { success: false, error: "Not subscribed to this event type" };
  }

  try {
    // Note: In a production system, you would need to store the secret
    // (encrypted) to sign outgoing webhooks. For now, we'll use a placeholder
    // approach that demonstrates the pattern without actual signing.
    //
    // In production, you'd retrieve the integration's secret from a secure
    // store (like AWS Secrets Manager) to sign the webhook.

    const webhookBody = {
      event: payload.eventType,
      spaId: payload.spaId,
      data: payload.data,
      timestamp: payload.timestamp,
      integrationId: integration.integrationId,
    };

    // Create timestamp-based signature for webhook
    // Note: This is a simplified version - in production, use the actual secret
    const timestamp = Date.now();
    const bodyString = JSON.stringify(webhookBody);

    // Simulated signature header (in production, use actual HMAC with stored secret)
    const signatureHeader = `t=${timestamp},v1=simulated_signature`;

    console.log(`[Webhook] Sending to ${integration.webhookUrl}`);

    const response = await fetch(integration.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signatureHeader,
        "X-Spalf-Event": payload.eventType,
        "X-Spalf-Integration-Id": integration.integrationId,
        "X-Spalf-Timestamp": payload.timestamp,
      },
      body: bodyString,
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}: ${response.statusText}`,
        statusCode: response.status,
      };
    }

    return { success: true, statusCode: response.status };
  } catch (error) {
    console.error(`[Webhook] Error sending to ${integration.webhookUrl}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Query all integrations for a spa that have webhooks configured
 */
async function getIntegrationsForSpa(spaId: string): Promise<IntegrationItem[]> {
  try {
    const result = await SpalfTable.build(QueryCommand)
      .query({
        index: "GSI1",
        partition: `SPA#${spaId}`,
        range: { beginsWith: "INTEGRATION#" },
      })
      .entities(IntegrationEntity)
      .send();

    return (result.Items || []) as IntegrationItem[];
  } catch (error) {
    console.error("[Webhook] Error querying integrations:", error);
    return [];
  }
}

/**
 * Send webhooks to all subscribed integrations for a given event
 */
export async function sendWebhook(payload: WebhookPayload): Promise<SendWebhookResult> {
  console.log(`[Webhook] Sending event ${payload.eventType} for spa ${payload.spaId}`);

  // Get all integrations for this spa
  const integrations = await getIntegrationsForSpa(payload.spaId);

  if (integrations.length === 0) {
    console.log("[Webhook] No integrations found for spa");
    return { total: 0, sent: 0, failed: 0, results: [] };
  }

  // Filter to only integrations with webhook URLs
  const webhookIntegrations = integrations.filter(
    (i) => i.webhookUrl && i.isActive
  );

  if (webhookIntegrations.length === 0) {
    console.log("[Webhook] No active integrations with webhook URLs");
    return { total: 0, sent: 0, failed: 0, results: [] };
  }

  // Send webhooks in parallel
  const results = await Promise.all(
    webhookIntegrations.map(async (integration) => {
      const result = await sendToIntegration(integration, payload);
      return {
        integrationId: integration.integrationId,
        ...result,
      };
    })
  );

  const sent = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`[Webhook] Results: ${sent} sent, ${failed} failed`);

  return {
    total: webhookIntegrations.length,
    sent,
    failed,
    results,
  };
}

/**
 * Helper to create an event for EventBridge
 * Call this from other Lambda functions to trigger webhooks
 */
export function createWebhookEvent(
  eventType: string,
  spaId: string,
  data: unknown
): {
  Source: string;
  DetailType: string;
  Detail: string;
} {
  return {
    Source: "spalf",
    DetailType: "webhook",
    Detail: JSON.stringify({
      eventType,
      spaId,
      data,
      timestamp: new Date().toISOString(),
    }),
  };
}
