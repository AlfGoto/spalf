import { Entity } from "dynamodb-toolbox/entity";
import { item } from "dynamodb-toolbox/schema/item";
import { string } from "dynamodb-toolbox/schema/string";
import { number } from "dynamodb-toolbox/schema/number";
import { list } from "dynamodb-toolbox/schema/list";
import { SpalfTable } from "../table";

/**
 * Room Entity
 *
 * PK: SPA#<spaId>#ROOM#<roomId>
 * SK: METADATA
 *
 * GSI1PK: SPA#<spaId>
 * GSI1SK: ROOM#<roomId>
 */

const roomSchema = item({
  // Key attributes
  roomId: string().key(),
  spaId: string().key(),

  // Attributes
  name: string().required(),
  minCapacity: number().default(1),
  maxCapacity: number().required(),
  maxConcurrentServices: number().default(1),
  description: string().optional(),

  // Services that can be performed in this room
  serviceIds: list(string()).default([]),

  // GSI Keys
  GSI1PK: string().optional(),
  GSI1SK: string().optional(),

  // Timestamps
  createdAt: string().default(() => new Date().toISOString()),
  updatedAt: string().required("always").putDefault(() => new Date().toISOString()).updateDefault(() => new Date().toISOString()),
});

export const RoomEntity = new Entity({
  name: "Room",
  table: SpalfTable,
  schema: roomSchema,
  timestamps: false,
  computeKey: ({ spaId, roomId }) => ({
    PK: `SPA#${spaId}#ROOM#${roomId}`,
    SK: "METADATA",
  }),
});

export interface RoomItem {
  roomId: string;
  spaId: string;
  name: string;
  minCapacity: number;
  maxCapacity: number;
  maxConcurrentServices: number;
  description?: string;
  serviceIds: string[];
  GSI1PK?: string;
  GSI1SK?: string;
  createdAt: string;
  updatedAt: string;
}
