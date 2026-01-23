import { Entity } from "dynamodb-toolbox/entity";
import { item } from "dynamodb-toolbox/schema/item";
import { string } from "dynamodb-toolbox/schema/string";
import { SpalfTable } from "../table";

/**
 * Reservation Entity
 *
 * PK: SPA#<spaId>#RESERVATION#<reservationId>
 * SK: METADATA
 *
 * GSI1PK: SPA#<spaId>
 * GSI1SK: RESERVATION#<date>#<startTime>#<reservationId>
 *
 * GSI2PK: DATE#<date>
 * GSI2SK: SPA#<spaId>#RESERVATION#<reservationId>
 */

const reservationStatusValues = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"] as const;
export type ReservationStatus = (typeof reservationStatusValues)[number];

const reservationSchema = item({
  // Key attributes
  reservationId: string().key(),
  spaId: string().key(),

  // Attributes
  serviceId: string().required(),
  clientId: string().required(),
  employeeId: string().optional(), // Can be auto-assigned
  roomId: string().optional(), // Can be auto-assigned

  // Timing
  date: string().required(), // YYYY-MM-DD
  startTime: string().required(), // HH:mm
  endTime: string().required(), // HH:mm

  // Status
  status: string().enum(...reservationStatusValues).default("PENDING"),

  // Notes
  notes: string().optional(),
  internalNotes: string().optional(),

  // Cancellation tracking
  cancelledAt: string().optional(),
  cancellationReason: string().optional(),

  // Integration tracking
  externalId: string().optional(), // External system's reference ID
  createdByIntegration: string().optional(),
  lastModifiedByIntegration: string().optional(),

  // GSI Keys
  GSI1PK: string().optional(),
  GSI1SK: string().optional(),
  GSI2PK: string().optional(),
  GSI2SK: string().optional(),

  // Timestamps
  createdAt: string().default(() => new Date().toISOString()),
  updatedAt: string().required("always").putDefault(() => new Date().toISOString()).updateDefault(() => new Date().toISOString()),
});

export const ReservationEntity = new Entity({
  name: "Reservation",
  table: SpalfTable,
  schema: reservationSchema,
  timestamps: false,
  computeKey: ({ spaId, reservationId }) => ({
    PK: `SPA#${spaId}#RESERVATION#${reservationId}`,
    SK: "METADATA",
  }),
});

export interface ReservationItem {
  reservationId: string;
  spaId: string;
  serviceId: string;
  clientId: string;
  employeeId?: string;
  roomId?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: ReservationStatus;
  notes?: string;
  internalNotes?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  externalId?: string;
  createdByIntegration?: string;
  lastModifiedByIntegration?: string;
  GSI1PK?: string;
  GSI1SK?: string;
  GSI2PK?: string;
  GSI2SK?: string;
  createdAt: string;
  updatedAt: string;
}
