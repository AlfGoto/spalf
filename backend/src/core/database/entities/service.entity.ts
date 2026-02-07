import { Entity } from "dynamodb-toolbox/entity";
import { item } from "dynamodb-toolbox/schema/item";
import { string } from "dynamodb-toolbox/schema/string";
import { number } from "dynamodb-toolbox/schema/number";
import { boolean } from "dynamodb-toolbox/schema/boolean";
import { list } from "dynamodb-toolbox/schema/list";
import { map } from "dynamodb-toolbox/schema/map";
import { SpalfTable } from "../table";

/**
 * Service (Prestation) Entity
 *
 * PK: SPA#<spaId>#SERVICE#<serviceId>
 * SK: METADATA
 *
 * GSI1PK: SPA#<spaId>
 * GSI1SK: SERVICE#<serviceId>
 */

const productRequirementSchema = map({
  productId: string(),
  quantity: number().default(1),
});

const serviceSchema = item({
  // Key attributes
  serviceId: string().key(),
  spaId: string().key(),

  // Attributes
  name: string().required(),
  description: string().optional(),
  price: number().required(),
  duration: number().required(), // in minutes
  preparationTime: number().default(0), // in minutes
  recoveryTime: number().default(0), // in minutes

  // Cancellation and rescheduling
  cancellationDeadlineHours: number().default(24), // hours before service
  canBeRescheduled: boolean().default(true),

  // Associations
  productIds: list(productRequirementSchema).default([]),

  // Room requirements
  roomIds: list(string()).default([]), // Empty = any room

  // Employee requirements
  employeeIds: list(string()).default([]), // Empty = any employee

  // Composition: other services included in this one
  composedServiceIds: list(string()).default([]),

  // Is this a composed service?
  isComposed: boolean().default(false),

  // GSI Keys
  GSI1PK: string().optional(),
  GSI1SK: string().optional(),

  // Timestamps
  createdAt: string().default(() => new Date().toISOString()),
  updatedAt: string().required("always").putDefault(() => new Date().toISOString()).updateDefault(() => new Date().toISOString()),
});

export const ServiceEntity = new Entity({
  name: "Service",
  table: SpalfTable,
  schema: serviceSchema,
  timestamps: false,
  computeKey: ({ spaId, serviceId }) => ({
    PK: `SPA#${spaId}#SERVICE#${serviceId}`,
    SK: "METADATA",
  }),
});

export interface ProductRequirement {
  productId: string;
  quantity: number;
}

export interface ServiceItem {
  serviceId: string;
  spaId: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  preparationTime: number;
  recoveryTime: number;
  cancellationDeadlineHours: number;
  canBeRescheduled: boolean;
  productIds: ProductRequirement[];
  roomIds: string[];
  employeeIds: string[];
  composedServiceIds: string[];
  isComposed: boolean;
  GSI1PK?: string;
  GSI1SK?: string;
  createdAt: string;
  updatedAt: string;
}
