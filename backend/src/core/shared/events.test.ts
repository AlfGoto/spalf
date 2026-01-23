// Mock the EventBridge client - must be before import
const mockSend = jest.fn();

jest.mock("@aws-sdk/client-eventbridge", () => {
  return {
    EventBridgeClient: jest.fn().mockImplementation(() => ({
      send: mockSend,
    })),
    PutEventsCommand: jest.fn().mockImplementation((params) => params),
  };
});

import { emitWebhookEvent, emitReservationEvent, emitClientEvent } from "./events";

describe("events", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSend.mockResolvedValue({});
  });

  describe("emitWebhookEvent", () => {
    it("should emit an event to EventBridge", async () => {
      await emitWebhookEvent({
        eventType: "test.event",
        spaId: "spa-123",
        data: { foo: "bar" },
      });

      expect(mockSend).toHaveBeenCalledTimes(1);
      const command = mockSend.mock.calls[0][0];
      expect(command.Entries).toHaveLength(1);
      
      const entry = command.Entries[0];
      expect(entry.Source).toBe("spalf");
      expect(entry.DetailType).toBe("webhook");
      expect(entry.EventBusName).toBe("spalf-webhooks");
      
      const detail = JSON.parse(entry.Detail);
      expect(detail.eventType).toBe("test.event");
      expect(detail.spaId).toBe("spa-123");
      expect(detail.data).toEqual({ foo: "bar" });
      expect(detail.timestamp).toBeDefined();
    });

    it("should use provided timestamp when given", async () => {
      const timestamp = "2026-01-23T10:00:00Z";
      await emitWebhookEvent({
        eventType: "test.event",
        spaId: "spa-123",
        data: {},
        timestamp,
      });

      const command = mockSend.mock.calls[0][0];
      const detail = JSON.parse(command.Entries[0].Detail);
      expect(detail.timestamp).toBe(timestamp);
    });

    it("should not throw on EventBridge error", async () => {
      mockSend.mockRejectedValue(new Error("EventBridge error"));

      // Should not throw
      await expect(
        emitWebhookEvent({
          eventType: "test.event",
          spaId: "spa-123",
          data: {},
        })
      ).resolves.toBeUndefined();
    });

    it("should log errors to console", async () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      mockSend.mockRejectedValue(new Error("EventBridge error"));

      await emitWebhookEvent({
        eventType: "test.event",
        spaId: "spa-123",
        data: {},
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        "[Events] Failed to emit webhook event:",
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe("emitReservationEvent", () => {
    it("should emit reservation.created event", async () => {
      const reservation = { reservationId: "res-123", clientId: "client-456" };
      await emitReservationEvent("created", "spa-123", reservation);

      expect(mockSend).toHaveBeenCalledTimes(1);
      const command = mockSend.mock.calls[0][0];
      const detail = JSON.parse(command.Entries[0].Detail);
      
      expect(detail.eventType).toBe("reservation.created");
      expect(detail.spaId).toBe("spa-123");
      expect(detail.data).toEqual(reservation);
    });

    it("should emit reservation.updated event", async () => {
      await emitReservationEvent("updated", "spa-123", { id: "res-123" });

      const command = mockSend.mock.calls[0][0];
      const detail = JSON.parse(command.Entries[0].Detail);
      expect(detail.eventType).toBe("reservation.updated");
    });

    it("should emit reservation.cancelled event", async () => {
      await emitReservationEvent("cancelled", "spa-123", { id: "res-123" });

      const command = mockSend.mock.calls[0][0];
      const detail = JSON.parse(command.Entries[0].Detail);
      expect(detail.eventType).toBe("reservation.cancelled");
    });

    it("should emit reservation.completed event", async () => {
      await emitReservationEvent("completed", "spa-123", { id: "res-123" });

      const command = mockSend.mock.calls[0][0];
      const detail = JSON.parse(command.Entries[0].Detail);
      expect(detail.eventType).toBe("reservation.completed");
    });
  });

  describe("emitClientEvent", () => {
    it("should emit client.created event", async () => {
      const client = { clientId: "client-123", firstName: "John" };
      await emitClientEvent("created", "spa-123", client);

      expect(mockSend).toHaveBeenCalledTimes(1);
      const command = mockSend.mock.calls[0][0];
      const detail = JSON.parse(command.Entries[0].Detail);
      
      expect(detail.eventType).toBe("client.created");
      expect(detail.spaId).toBe("spa-123");
      expect(detail.data).toEqual(client);
    });

    it("should emit client.updated event", async () => {
      await emitClientEvent("updated", "spa-123", { id: "client-123" });

      const command = mockSend.mock.calls[0][0];
      const detail = JSON.parse(command.Entries[0].Detail);
      expect(detail.eventType).toBe("client.updated");
    });
  });
});
