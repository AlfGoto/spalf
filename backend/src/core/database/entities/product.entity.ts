import { Entity } from "dynamodb-toolbox/entity";
import { item } from "dynamodb-toolbox/schema/item";
import { string } from "dynamodb-toolbox/schema/string";
import { number } from "dynamodb-toolbox/schema/number";
import { boolean } from "dynamodb-toolbox/schema/boolean";
import { SpalfTable } from "../table";

/**
 * Product Entity
 *
 * PK: SPA#<spaId>#PRODUCT#<productId>
 * SK: METADATA
 *
 * GSI1PK: SPA#<spaId>
 * GSI1SK: PRODUCT#<productId>
 */

const productSchema = item({
  // Key attributes
  productId: string().key(),
  spaId: string().key(),

  // Attributes
  name: string().required(),
  description: string().optional(),
  price: number().required(),
  quantity: number().optional(), // undefined = infinite
  isInfinite: boolean().default(false),

  // GSI Keys
  GSI1PK: string().optional(),
  GSI1SK: string().optional(),

  // Timestamps
  createdAt: string().default(() => new Date().toISOString()),
  updatedAt: string().required("always").putDefault(() => new Date().toISOString()).updateDefault(() => new Date().toISOString()),
});

export const ProductEntity = new Entity({
  name: "Product",
  table: SpalfTable,
  schema: productSchema,
  timestamps: false,
  computeKey: ({ spaId, productId }) => ({
    PK: `SPA#${spaId}#PRODUCT#${productId}`,
    SK: "METADATA",
  }),
});

export interface ProductItem {
  productId: string;
  spaId: string;
  name: string;
  description?: string;
  price: number;
  quantity?: number;
  isInfinite: boolean;
  GSI1PK?: string;
  GSI1SK?: string;
  createdAt: string;
  updatedAt: string;
}
