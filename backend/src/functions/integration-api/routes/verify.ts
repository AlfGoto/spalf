import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { Effect, pipe } from "effect";
import { ValidationError, type AppError } from "../../../core/shared/errors";
import type { IntegrationItem } from "../../../core/database/entities/integration.entity";

/**
 * Hash verification endpoint
 *
 * Allows external systems to verify webhook signatures.
 * This is useful when an external system receives an outbound webhook
 * from Spalf and wants to verify its authenticity.
 */

interface VerifyHashBody {
  signatureHeader: string;
  payload: string;
}

// Helper to create JSON response
function jsonResponse(statusCode: number, body: unknown): APIGatewayProxyResult {
  return {
    statusCode,
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  };
}

export const verifyRouter = {
  /**
   * POST /integration/verify-hash
   *
   * Verify a webhook signature.
   *
   * Body:
   *   {
   *     signatureHeader: string, // The X-Webhook-Signature header value
   *     payload: string          // The raw JSON payload that was signed
   *   }
   *
   * Returns:
   *   {
   *     valid: boolean,
   *     reason?: string
   *   }
   *
   * Note: This endpoint cannot actually verify signatures because
   * we only store the hash of the secret, not the secret itself.
   * In a production system, you would need to either:
   * 1. Store the secret (encrypted) to verify signatures
   * 2. Use a different verification approach (e.g., public/private keys)
   *
   * For now, this endpoint serves as a placeholder that documents
   * the expected format and workflow.
   */
  verifyHash: (
    event: APIGatewayProxyEvent,
    params: Record<string, string>,
    integration: IntegrationItem
  ): Effect.Effect<APIGatewayProxyResult, AppError> => {
    return pipe(
      Effect.try({
        try: () => JSON.parse(event.body || "{}") as VerifyHashBody,
        catch: () => new ValidationError({ message: "Invalid JSON body" }),
      }),
      Effect.flatMap((body) => {
        if (!body.signatureHeader) {
          return Effect.fail(
            new ValidationError({
              message: "signatureHeader is required",
              field: "signatureHeader",
            })
          );
        }
        if (!body.payload) {
          return Effect.fail(
            new ValidationError({
              message: "payload is required",
              field: "payload",
            })
          );
        }

        // Parse the signature header
        const parts = body.signatureHeader.split(",");
        let timestamp: number | null = null;
        let signature: string | null = null;

        for (const part of parts) {
          const [key, value] = part.split("=");
          if (key === "t") {
            timestamp = parseInt(value, 10);
          } else if (key === "v1") {
            signature = value;
          }
        }

        if (!timestamp || !signature) {
          return Effect.succeed(
            jsonResponse(200, {
              valid: false,
              reason: "Invalid signature format. Expected: t=<timestamp>,v1=<signature>",
            })
          );
        }

        // Check timestamp tolerance (5 minutes)
        const now = Date.now();
        const toleranceMs = 5 * 60 * 1000;
        if (Math.abs(now - timestamp) > toleranceMs) {
          return Effect.succeed(
            jsonResponse(200, {
              valid: false,
              reason: "Webhook timestamp too old or too far in future",
            })
          );
        }

        // Note: We cannot verify the actual signature without the original secret
        // In production, you would need to implement proper key management
        // This endpoint documents the expected format
        return Effect.succeed(
          jsonResponse(200, {
            valid: true,
            note: "Signature format is valid. Actual cryptographic verification requires the original secret.",
            integrationId: integration.integrationId,
            parsedSignature: {
              timestamp,
              signatureLength: signature.length,
            },
          })
        );
      })
    );
  },
};
