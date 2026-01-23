/**
 * Shared type definitions.
 *
 * This directory contains:
 * - entities.ts: Domain entity types mirroring backend models
 * - api.d.ts: Generated types from openapi-typescript (when available)
 *
 * To generate API types from the backend OpenAPI schema:
 * npx openapi-typescript <api-schema-url> -o src/shared/types/api.d.ts
 */

// Re-export all entity types
export * from "./entities";

// Re-export API types when available
// export type { paths, components } from "./api";
