import type { EventBridgeEvent, Context } from "aws-lambda";
import { sendWebhook } from "./handlers/send-webhook";

/**
 * Trigger Lambda - Outbound Webhook Handler
 *
 * This Lambda is triggered by EventBridge events and sends
 * webhooks to external systems that are subscribed to specific events.
 */

export interface TriggerEvent {
  eventType: string;
  spaId: string;
  data: unknown;
  timestamp: string;
}

export async function handler(
  event: EventBridgeEvent<string, TriggerEvent>,
  _context: Context
): Promise<{ success: boolean; message: string }> {
  console.log("[Trigger] Received event:", JSON.stringify(event, null, 2));

  const { detail } = event;

  if (!detail || !detail.eventType || !detail.spaId) {
    console.error("[Trigger] Invalid event structure");
    return { success: false, message: "Invalid event structure" };
  }

  try {
    const result = await sendWebhook({
      eventType: detail.eventType,
      spaId: detail.spaId,
      data: detail.data,
      timestamp: detail.timestamp || new Date().toISOString(),
    });

    console.log(`[Trigger] Webhook sent: ${result.sent} of ${result.total} integrations`);

    return {
      success: true,
      message: `Sent ${result.sent} webhooks for event ${detail.eventType}`,
    };
  } catch (error) {
    console.error("[Trigger] Error sending webhooks:", error);
    return {
      success: false,
      message: `Failed to send webhooks: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
