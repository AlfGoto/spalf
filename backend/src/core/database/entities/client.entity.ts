import { Entity } from "dynamodb-toolbox/entity";
import { item } from "dynamodb-toolbox/schema/item";
import { string } from "dynamodb-toolbox/schema/string";
import { SpalfTable } from "../table";

/**
 * Client Entity
 *
 * PK: SPA#<spaId>#CLIENT#<clientId>
 * SK: METADATA
 *
 * GSI1PK: SPA#<spaId>
 * GSI1SK: CLIENT#<clientId>
 */

const clientSchema = item({
  // Key attributes
  clientId: string().key(),
  spaId: string().key(),

  // Attributes
  firstName: string().required(),
  lastName: string().required(),
  email: string().required(),
  phone: string().optional(),

  // Notes
  allergies: string().optional(),
  preferences: string().optional(),
  notes: string().optional(),

  // GSI Keys
  GSI1PK: string().optional(),
  GSI1SK: string().optional(),

  // Timestamps
  createdAt: string().default(() => new Date().toISOString()),
  updatedAt: string().required("always").putDefault(() => new Date().toISOString()).updateDefault(() => new Date().toISOString()),
});

export const ClientEntity = new Entity({
  name: "Client",
  table: SpalfTable,
  schema: clientSchema,
  timestamps: false,
  computeKey: ({ spaId, clientId }) => ({
    PK: `SPA#${spaId}#CLIENT#${clientId}`,
    SK: "METADATA",
  }),
});

export interface ClientItem {
  clientId: string;
  spaId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  allergies?: string;
  preferences?: string;
  notes?: string;
  GSI1PK?: string;
  GSI1SK?: string;
  createdAt: string;
  updatedAt: string;
}
