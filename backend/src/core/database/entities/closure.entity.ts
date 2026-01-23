import { Entity } from "dynamodb-toolbox/entity";
import { item } from "dynamodb-toolbox/schema/item";
import { string } from "dynamodb-toolbox/schema/string";
import { boolean } from "dynamodb-toolbox/schema/boolean";
import { SpalfTable } from "../table";

/**
 * Exceptional Closure Entity
 *
 * PK: SPA#<spaId>#CLOSURE#<closureId>
 * SK: METADATA
 *
 * GSI1PK: SPA#<spaId>
 * GSI1SK: CLOSURE#<date>
 *
 * GSI2PK: DATE#<date>
 * GSI2SK: SPA#<spaId>#CLOSURE
 */

const closureSchema = item({
  // Key attributes
  closureId: string().key(),
  spaId: string().key(),

  // Attributes
  date: string().required(), // YYYY-MM-DD
  reason: string().optional(),
  isAllDay: boolean().default(true),

  // If not all day, specify hours
  startTime: string().optional(), // HH:mm
  endTime: string().optional(), // HH:mm

  // GSI Keys
  GSI1PK: string().optional(),
  GSI1SK: string().optional(),
  GSI2PK: string().optional(),
  GSI2SK: string().optional(),

  // Timestamps
  createdAt: string().default(() => new Date().toISOString()),
  updatedAt: string().required("always").putDefault(() => new Date().toISOString()).updateDefault(() => new Date().toISOString()),
});

export const ClosureEntity = new Entity({
  name: "Closure",
  table: SpalfTable,
  schema: closureSchema,
  timestamps: false,
  computeKey: ({ spaId, closureId }) => ({
    PK: `SPA#${spaId}#CLOSURE#${closureId}`,
    SK: "METADATA",
  }),
});

export interface ClosureItem {
  closureId: string;
  spaId: string;
  date: string;
  reason?: string;
  isAllDay: boolean;
  startTime?: string;
  endTime?: string;
  GSI1PK?: string;
  GSI1SK?: string;
  GSI2PK?: string;
  GSI2SK?: string;
  createdAt: string;
  updatedAt: string;
}
