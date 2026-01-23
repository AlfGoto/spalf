import { EventBridgeClient, PutEventsCommand } from "@aws-sdk/client-eventbridge";

/**
 * EventBridge utilities for emitting webhook events
 */

const eventBridgeClient = new EventBridgeClient({});

const EVENT_BUS_NAME = process.env.WEBHOOK_EVENT_BUS || "spalf-webhooks";

export interface WebhookEventPayload {
  eventType: string;
  spaId: string;
  data: unknown;
  timestamp?: string;
}

/**
 * Emit a webhook event to EventBridge
 * This will trigger the trigger Lambda to send webhooks to subscribed integrations
 */
export async function emitWebhookEvent(payload: WebhookEventPayload): Promise<void> {
  const event = {
    Source: "spalf",
    DetailType: "webhook",
    Detail: JSON.stringify({
      eventType: payload.eventType,
      spaId: payload.spaId,
      data: payload.data,
      timestamp: payload.timestamp || new Date().toISOString(),
    }),
    EventBusName: EVENT_BUS_NAME,
  };

  try {
    await eventBridgeClient.send(
      new PutEventsCommand({
        Entries: [event],
      })
    );
    console.log(`[Events] Emitted ${payload.eventType} event for spa ${payload.spaId}`);
  } catch (error) {
    console.error("[Events] Failed to emit webhook event:", error);
    // Don't throw - webhook failures shouldn't break the main operation
  }
}

/**
 * Emit a reservation event
 */
export async function emitReservationEvent(
  type: "created" | "updated" | "cancelled" | "completed",
  spaId: string,
  reservation: unknown
): Promise<void> {
  await emitWebhookEvent({
    eventType: `reservation.${type}`,
    spaId,
    data: reservation,
  });
}

/**
 * Emit a client event
 */
export async function emitClientEvent(
  type: "created" | "updated",
  spaId: string,
  client: unknown
): Promise<void> {
  await emitWebhookEvent({
    eventType: `client.${type}`,
    spaId,
    data: client,
  });
}
