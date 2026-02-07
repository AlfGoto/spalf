import { Entity } from "dynamodb-toolbox/entity";
import { item } from "dynamodb-toolbox/schema/item";
import { string } from "dynamodb-toolbox/schema/string";
import { number } from "dynamodb-toolbox/schema/number";
import { SpalfTable } from "../table";

/**
 * Spa Entity
 *
 * PK: SPA#<spaId>
 * SK: METADATA
 *
 * GSI1PK: SPAS
 * GSI1SK: SPA#<spaId>
 */

const timeSlotGranularityValues = [10, 15, 20, 30, 60] as const;
export type TimeSlotGranularity = (typeof timeSlotGranularityValues)[number];

const spaSchema = item({
  // Key attribute
  spaId: string().key(),

  // Attributes
  name: string().required(),
  timeSlotGranularity: number().enum(...timeSlotGranularityValues).default(15),
  address: string().optional(),
  phone: string().optional(),
  email: string().optional(),
  timezone: string().default("Europe/Paris"),

  // GSI1 for listing all spas
  GSI1PK: string().default("SPAS"),
  GSI1SK: string().optional(),

  // Timestamps
  createdAt: string().default(() => new Date().toISOString()),
  updatedAt: string().required("always").putDefault(() => new Date().toISOString()).updateDefault(() => new Date().toISOString()),
});

export const SpaEntity = new Entity({
  name: "Spa",
  table: SpalfTable,
  schema: spaSchema,
  timestamps: false,
  computeKey: ({ spaId }) => ({
    PK: `SPA#${spaId}`,
    SK: "METADATA",
  }),
});

// Manual type definition for SpaItem
export interface SpaItem {
  spaId: string;
  name: string;
  timeSlotGranularity: TimeSlotGranularity;
  address?: string;
  phone?: string;
  email?: string;
  timezone: string;
  GSI1PK: string;
  GSI1SK?: string;
  createdAt: string;
  updatedAt: string;
}
