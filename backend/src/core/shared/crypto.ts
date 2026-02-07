import { createHmac, createHash, randomBytes } from "crypto";

/**
 * Cryptographic utilities for webhook security
 */

const HASH_ALGORITHM = "sha256";
const HMAC_ALGORITHM = "sha256";

/**
 * Generate a random secret token for integrations
 * Returns a 32-byte hex string (64 characters)
 */
export function generateSecretToken(): string {
  return randomBytes(32).toString("hex");
}

/**
 * Hash a secret token for storage
 * We only store hashes, never the actual token
 */
export function hashSecret(secret: string): string {
  return createHash(HASH_ALGORITHM).update(secret).digest("hex");
}

/**
 * Verify a secret against its hash
 */
export function verifySecret(secret: string, hash: string): boolean {
  const computedHash = hashSecret(secret);
  // Use timing-safe comparison to prevent timing attacks
  if (computedHash.length !== hash.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < computedHash.length; i++) {
    result |= computedHash.charCodeAt(i) ^ hash.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Create an HMAC signature for webhook payloads
 * This allows external systems to verify that webhooks are authentic
 */
export function createWebhookSignature(payload: string, secret: string): string {
  return createHmac(HMAC_ALGORITHM, secret).update(payload).digest("hex");
}

/**
 * Verify an incoming webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = createWebhookSignature(payload, secret);
  
  // Use timing-safe comparison
  if (expectedSignature.length !== signature.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < expectedSignature.length; i++) {
    result |= expectedSignature.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Create a signed webhook payload
 * Returns the signature to include in headers
 */
export interface SignedWebhook {
  signature: string;
  timestamp: number;
  payload: string;
}

export function signWebhookPayload(data: unknown, secret: string): SignedWebhook {
  const timestamp = Date.now();
  const payload = JSON.stringify(data);
  const signatureBase = `${timestamp}.${payload}`;
  const signature = createWebhookSignature(signatureBase, secret);

  return {
    signature: `t=${timestamp},v1=${signature}`,
    timestamp,
    payload,
  };
}

/**
 * Verify a signed webhook payload
 * Checks both the signature and that the timestamp is recent (within 5 minutes)
 */
export function verifySignedWebhook(
  signatureHeader: string,
  payload: string,
  secret: string,
  toleranceMs: number = 5 * 60 * 1000 // 5 minutes
): { valid: boolean; reason?: string } {
  // Parse the signature header
  const parts = signatureHeader.split(",");
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
    return { valid: false, reason: "Invalid signature format" };
  }

  // Check timestamp tolerance
  const now = Date.now();
  if (Math.abs(now - timestamp) > toleranceMs) {
    return { valid: false, reason: "Webhook timestamp too old" };
  }

  // Verify signature
  const signatureBase = `${timestamp}.${payload}`;
  const expectedSignature = createWebhookSignature(signatureBase, secret);

  if (!verifyWebhookSignature(signatureBase, signature, secret)) {
    return { valid: false, reason: "Signature mismatch" };
  }

  return { valid: true };
}
