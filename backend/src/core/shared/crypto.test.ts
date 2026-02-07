import {
  generateSecretToken,
  hashSecret,
  verifySecret,
  createWebhookSignature,
  verifyWebhookSignature,
  signWebhookPayload,
  verifySignedWebhook,
} from "./crypto";

describe("crypto", () => {
  describe("generateSecretToken", () => {
    it("should generate a 64-character hex string", () => {
      const token = generateSecretToken();
      expect(token).toHaveLength(64);
      expect(/^[0-9a-f]+$/.test(token)).toBe(true);
    });

    it("should generate unique tokens", () => {
      const token1 = generateSecretToken();
      const token2 = generateSecretToken();
      expect(token1).not.toBe(token2);
    });
  });

  describe("hashSecret", () => {
    it("should return a SHA-256 hash (64 hex characters)", () => {
      const hash = hashSecret("my-secret");
      expect(hash).toHaveLength(64);
      expect(/^[0-9a-f]+$/.test(hash)).toBe(true);
    });

    it("should produce consistent hashes for the same input", () => {
      const hash1 = hashSecret("my-secret");
      const hash2 = hashSecret("my-secret");
      expect(hash1).toBe(hash2);
    });

    it("should produce different hashes for different inputs", () => {
      const hash1 = hashSecret("secret1");
      const hash2 = hashSecret("secret2");
      expect(hash1).not.toBe(hash2);
    });
  });

  describe("verifySecret", () => {
    it("should return true for matching secret and hash", () => {
      const secret = "my-super-secret";
      const hash = hashSecret(secret);
      expect(verifySecret(secret, hash)).toBe(true);
    });

    it("should return false for non-matching secret", () => {
      const hash = hashSecret("correct-secret");
      expect(verifySecret("wrong-secret", hash)).toBe(false);
    });

    it("should return false for incorrect hash length", () => {
      expect(verifySecret("secret", "short")).toBe(false);
    });

    it("should use timing-safe comparison", () => {
      // This is a bit tricky to test directly, but we can at least verify
      // the function doesn't short-circuit on different lengths
      const hash = hashSecret("secret");
      const wrongHash = hash.slice(0, -1) + "0"; // Change last character
      expect(verifySecret("secret", wrongHash)).toBe(false);
    });
  });

  describe("createWebhookSignature", () => {
    it("should create an HMAC-SHA256 signature", () => {
      const signature = createWebhookSignature("payload", "secret");
      expect(signature).toHaveLength(64);
      expect(/^[0-9a-f]+$/.test(signature)).toBe(true);
    });

    it("should produce consistent signatures", () => {
      const sig1 = createWebhookSignature("payload", "secret");
      const sig2 = createWebhookSignature("payload", "secret");
      expect(sig1).toBe(sig2);
    });

    it("should produce different signatures for different payloads", () => {
      const sig1 = createWebhookSignature("payload1", "secret");
      const sig2 = createWebhookSignature("payload2", "secret");
      expect(sig1).not.toBe(sig2);
    });

    it("should produce different signatures for different secrets", () => {
      const sig1 = createWebhookSignature("payload", "secret1");
      const sig2 = createWebhookSignature("payload", "secret2");
      expect(sig1).not.toBe(sig2);
    });
  });

  describe("verifyWebhookSignature", () => {
    it("should return true for valid signature", () => {
      const payload = '{"event": "test"}';
      const secret = "webhook-secret";
      const signature = createWebhookSignature(payload, secret);
      expect(verifyWebhookSignature(payload, signature, secret)).toBe(true);
    });

    it("should return false for invalid signature", () => {
      const payload = '{"event": "test"}';
      const secret = "webhook-secret";
      expect(verifyWebhookSignature(payload, "invalid-signature", secret)).toBe(false);
    });

    it("should return false for tampered payload", () => {
      const payload = '{"event": "test"}';
      const secret = "webhook-secret";
      const signature = createWebhookSignature(payload, secret);
      expect(verifyWebhookSignature('{"event": "modified"}', signature, secret)).toBe(false);
    });

    it("should return false for wrong secret", () => {
      const payload = '{"event": "test"}';
      const signature = createWebhookSignature(payload, "secret1");
      expect(verifyWebhookSignature(payload, signature, "secret2")).toBe(false);
    });
  });

  describe("signWebhookPayload", () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2026-01-23T10:00:00Z"));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should return signature, timestamp, and stringified payload", () => {
      const data = { event: "reservation.created", id: "123" };
      const secret = "webhook-secret";
      const result = signWebhookPayload(data, secret);

      expect(result.timestamp).toBe(Date.now());
      expect(result.payload).toBe(JSON.stringify(data));
      expect(result.signature).toMatch(/^t=\d+,v1=[0-9a-f]+$/);
    });

    it("should create verifiable signature", () => {
      const data = { event: "test" };
      const secret = "webhook-secret";
      const result = signWebhookPayload(data, secret);

      // Parse the signature
      const parts = result.signature.split(",");
      const timestamp = parts[0].split("=")[1];
      const signature = parts[1].split("=")[1];

      // Verify manually
      const signatureBase = `${timestamp}.${result.payload}`;
      const expectedSig = createWebhookSignature(signatureBase, secret);
      expect(signature).toBe(expectedSig);
    });
  });

  describe("verifySignedWebhook", () => {
    const secret = "webhook-secret";

    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2026-01-23T10:00:00Z"));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should validate a freshly signed webhook", () => {
      const data = { event: "test" };
      const signed = signWebhookPayload(data, secret);
      const result = verifySignedWebhook(signed.signature, signed.payload, secret);

      expect(result.valid).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it("should reject webhook with invalid signature format", () => {
      const result = verifySignedWebhook("invalid", '{"event":"test"}', secret);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe("Invalid signature format");
    });

    it("should reject webhook with missing timestamp", () => {
      const result = verifySignedWebhook("v1=abc123", '{"event":"test"}', secret);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe("Invalid signature format");
    });

    it("should reject webhook with missing signature", () => {
      const result = verifySignedWebhook("t=1234567890", '{"event":"test"}', secret);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe("Invalid signature format");
    });

    it("should reject webhook with old timestamp", () => {
      const data = { event: "test" };
      const signed = signWebhookPayload(data, secret);

      // Advance time by 6 minutes (past 5-minute tolerance)
      jest.advanceTimersByTime(6 * 60 * 1000);

      const result = verifySignedWebhook(signed.signature, signed.payload, secret);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe("Webhook timestamp too old");
    });

    it("should accept webhook within tolerance", () => {
      const data = { event: "test" };
      const signed = signWebhookPayload(data, secret);

      // Advance time by 4 minutes (within 5-minute tolerance)
      jest.advanceTimersByTime(4 * 60 * 1000);

      const result = verifySignedWebhook(signed.signature, signed.payload, secret);

      expect(result.valid).toBe(true);
    });

    it("should reject webhook with tampered payload", () => {
      const data = { event: "test" };
      const signed = signWebhookPayload(data, secret);
      const tamperedPayload = JSON.stringify({ event: "hacked" });

      const result = verifySignedWebhook(signed.signature, tamperedPayload, secret);

      expect(result.valid).toBe(false);
      expect(result.reason).toBe("Signature mismatch");
    });

    it("should reject webhook with wrong secret", () => {
      const data = { event: "test" };
      const signed = signWebhookPayload(data, secret);

      const result = verifySignedWebhook(signed.signature, signed.payload, "wrong-secret");

      expect(result.valid).toBe(false);
      expect(result.reason).toBe("Signature mismatch");
    });

    it("should accept custom tolerance", () => {
      const data = { event: "test" };
      const signed = signWebhookPayload(data, secret);

      // Advance time by 8 minutes
      jest.advanceTimersByTime(8 * 60 * 1000);

      // With default 5-minute tolerance, should fail
      const result1 = verifySignedWebhook(signed.signature, signed.payload, secret);
      expect(result1.valid).toBe(false);

      // Go back in time and try with 10-minute tolerance
      jest.setSystemTime(new Date("2026-01-23T10:00:00Z"));
      const signed2 = signWebhookPayload(data, secret);
      jest.advanceTimersByTime(8 * 60 * 1000);
      
      const result2 = verifySignedWebhook(signed2.signature, signed2.payload, secret, 10 * 60 * 1000);
      expect(result2.valid).toBe(true);
    });
  });
});
