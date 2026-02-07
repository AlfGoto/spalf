import { Entity } from "dynamodb-toolbox/entity";
import { item } from "dynamodb-toolbox/schema/item";
import { string } from "dynamodb-toolbox/schema/string";
import { boolean } from "dynamodb-toolbox/schema/boolean";
import { list } from "dynamodb-toolbox/schema/list";
import { SpalfTable } from "../table";

/**
 * Integration Entity
 *
 * Represents an external system integration with a spa.
 * Used for webhook authentication and API access control.
 *
 * PK: SPA#<spaId>#INTEGRATION#<integrationId>
 * SK: METADATA
 *
 * GSI1PK: SPA#<spaId>
 * GSI1SK: INTEGRATION#<integrationId>
 */

const integrationSchema = item({
  // Key attributes
  spaId: string().key(),
  integrationId: string().key(),

  // Integration info
  name: string().required(),
  description: string().optional(),

  // The secret token used for webhook verification (hashed)
  secretHash: string().required(),

  // Webhook configuration
  webhookUrl: string().optional(),
  webhookEvents: list(string()).default([]),

  // Permissions - which operations this integration can perform
  permissions: list(string()).default([]),

  // Status
  isActive: boolean().default(true),

  // For GSI queries
  GSI1PK: string().optional(),
  GSI1SK: string().optional(),

  // Timestamps
  createdAt: string().default(() => new Date().toISOString()),
  updatedAt: string()
    .required("always")
    .putDefault(() => new Date().toISOString())
    .updateDefault(() => new Date().toISOString()),
});

export const IntegrationEntity = new Entity({
  name: "Integration",
  table: SpalfTable,
  schema: integrationSchema,
  timestamps: false,
  computeKey: ({ spaId, integrationId }) => ({
    PK: `SPA#${spaId}#INTEGRATION#${integrationId}`,
    SK: "METADATA",
  }),
});

// Permission types for integrations
export type IntegrationPermission =
  | "reservations:read"
  | "reservations:write"
  | "clients:read"
  | "clients:write"
  | "services:read"
  | "employees:read"
  | "rooms:read";

// Webhook event types
export type WebhookEventType =
  | "reservation.created"
  | "reservation.updated"
  | "reservation.cancelled"
  | "reservation.completed"
  | "client.created"
  | "client.updated";

export interface IntegrationItem {
  spaId: string;
  integrationId: string;
  name: string;
  description?: string;
  secretHash: string;
  webhookUrl?: string;
  webhookEvents: string[];
  permissions: string[];
  isActive: boolean;
  GSI1PK?: string;
  GSI1SK?: string;
  createdAt: string;
  updatedAt: string;
}
