import { createMockEvent, createMockContext, parseBody } from "./test-utils";
import type { RoomItem } from "../../../core/database/entities";

// Mock the DynamoDB operations at module level
jest.mock("dynamodb-toolbox/entity/actions/put", () => ({
  PutItemCommand: jest.fn(),
}));
jest.mock("dynamodb-toolbox/entity/actions/get", () => ({
  GetItemCommand: jest.fn(),
}));
jest.mock("dynamodb-toolbox/entity/actions/update", () => ({
  UpdateItemCommand: jest.fn(),
}));
jest.mock("dynamodb-toolbox/entity/actions/delete", () => ({
  DeleteItemCommand: jest.fn(),
}));
jest.mock("dynamodb-toolbox/table/actions/query", () => ({
  QueryCommand: jest.fn(),
}));

// Mock all entities
jest.mock("../../../core/database/entities", () => ({
  RoomEntity: {
    build: jest.fn(() => ({
      item: jest.fn(() => ({ send: jest.fn().mockResolvedValue({}) })),
      key: jest.fn(() => ({ send: jest.fn().mockResolvedValue({ Item: null }) })),
    })),
  },
  EmployeeEntity: {
    build: jest.fn(() => ({
      item: jest.fn(() => ({ send: jest.fn().mockResolvedValue({}) })),
      key: jest.fn(() => ({ send: jest.fn().mockResolvedValue({ Item: null }) })),
    })),
  },
}));

// Mock the SpalfTable
jest.mock("../../../core/database/table", () => ({
  SpalfTable: {
    build: jest.fn(() => ({
      query: jest.fn(() => ({
        entities: jest.fn(() => ({ send: jest.fn().mockResolvedValue({ Items: [] }) })),
      })),
    })),
  },
}));

// Mock ulid for consistent IDs
jest.mock("ulid", () => ({
  ulid: jest.fn(() => "test-room-id"),
}));

// Import after mocking
import { handler } from "../index";
import { RoomEntity } from "../../../core/database/entities";
import { SpalfTable } from "../../../core/database/table";

describe("Rooms API Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/rooms", () => {
    it("should return empty list when no rooms exist", async () => {
      (SpalfTable.build as jest.Mock).mockReturnValue({
        query: jest.fn().mockReturnValue({
          entities: jest.fn().mockReturnValue({
            send: jest.fn().mockResolvedValue({ Items: [] }),
          }),
        }),
      });

      const event = createMockEvent({
        httpMethod: "GET",
        path: "/api/rooms",
      });

      const result = await handler(event, createMockContext());

      expect(result.statusCode).toBe(200);
      const body = parseBody<{ data: RoomItem[] }>(result.body);
      expect(body.data).toEqual([]);
    });

    it("should return list of rooms", async () => {
      const mockRooms: Partial<RoomItem>[] = [
        {
          roomId: "room-1",
          spaId: "test-spa",
          name: "Massage Room A",
          minCapacity: 1,
          maxCapacity: 2,
          maxConcurrentServices: 1,
          serviceIds: [],
        },
        {
          roomId: "room-2",
          spaId: "test-spa",
          name: "Sauna",
          minCapacity: 2,
          maxCapacity: 8,
          maxConcurrentServices: 4,
          serviceIds: [],
        },
      ];

      (SpalfTable.build as jest.Mock).mockReturnValue({
        query: jest.fn().mockReturnValue({
          entities: jest.fn().mockReturnValue({
            send: jest.fn().mockResolvedValue({ Items: mockRooms }),
          }),
        }),
      });

      const event = createMockEvent({
        httpMethod: "GET",
        path: "/api/rooms",
      });

      const result = await handler(event, createMockContext());

      expect(result.statusCode).toBe(200);
      const body = parseBody<{ data: RoomItem[] }>(result.body);
      expect(body.data).toHaveLength(2);
      expect(body.data[0].name).toBe("Massage Room A");
      expect(body.data[1].name).toBe("Sauna");
    });
  });

  describe("POST /api/rooms", () => {
    it("should create a new room with required fields", async () => {
      (RoomEntity.build as jest.Mock).mockReturnValue({
        item: jest.fn().mockReturnValue({
          send: jest.fn().mockResolvedValue({}),
        }),
      });

      const newRoom = {
        name: "Treatment Room",
        maxCapacity: 2,
      };

      const event = createMockEvent({
        httpMethod: "POST",
        path: "/api/rooms",
        body: JSON.stringify(newRoom),
      });

      const result = await handler(event, createMockContext());

      expect(result.statusCode).toBe(201);
      const body = parseBody<{ data: RoomItem }>(result.body);
      expect(body.data.name).toBe("Treatment Room");
      expect(body.data.maxCapacity).toBe(2);
      expect(body.data.minCapacity).toBe(1); // Default value
      expect(body.data.maxConcurrentServices).toBe(1); // Default value
      expect(body.data.roomId).toBe("test-room-id");
    });

    it("should create a room with all optional fields", async () => {
      (RoomEntity.build as jest.Mock).mockReturnValue({
        item: jest.fn().mockReturnValue({
          send: jest.fn().mockResolvedValue({}),
        }),
      });

      const newRoom = {
        name: "VIP Suite",
        minCapacity: 2,
        maxCapacity: 4,
        maxConcurrentServices: 2,
        description: "Luxury treatment room",
        serviceIds: ["svc-1", "svc-2"],
      };

      const event = createMockEvent({
        httpMethod: "POST",
        path: "/api/rooms",
        body: JSON.stringify(newRoom),
      });

      const result = await handler(event, createMockContext());

      expect(result.statusCode).toBe(201);
      const body = parseBody<{ data: RoomItem }>(result.body);
      expect(body.data.name).toBe("VIP Suite");
      expect(body.data.minCapacity).toBe(2);
      expect(body.data.maxConcurrentServices).toBe(2);
      expect(body.data.description).toBe("Luxury treatment room");
    });

    it("should return 400 when name is missing", async () => {
      const event = createMockEvent({
        httpMethod: "POST",
        path: "/api/rooms",
        body: JSON.stringify({
          maxCapacity: 2,
        }),
      });

      const result = await handler(event, createMockContext());

      expect(result.statusCode).toBe(400);
      const body = parseBody<{ error: { code: string; message: string } }>(result.body);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.message).toContain("Name");
    });

    it("should return 400 when maxCapacity is missing", async () => {
      const event = createMockEvent({
        httpMethod: "POST",
        path: "/api/rooms",
        body: JSON.stringify({
          name: "Room A",
        }),
      });

      const result = await handler(event, createMockContext());

      expect(result.statusCode).toBe(400);
      const body = parseBody<{ error: { code: string; message: string } }>(result.body);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.message).toContain("capacity");
    });

    it("should return 400 when maxCapacity is less than 1", async () => {
      const event = createMockEvent({
        httpMethod: "POST",
        path: "/api/rooms",
        body: JSON.stringify({
          name: "Room A",
          maxCapacity: 0,
        }),
      });

      const result = await handler(event, createMockContext());

      expect(result.statusCode).toBe(400);
      const body = parseBody<{ error: { code: string; message: string } }>(result.body);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should return 400 when minCapacity exceeds maxCapacity", async () => {
      const event = createMockEvent({
        httpMethod: "POST",
        path: "/api/rooms",
        body: JSON.stringify({
          name: "Room A",
          minCapacity: 5,
          maxCapacity: 2,
        }),
      });

      const result = await handler(event, createMockContext());

      expect(result.statusCode).toBe(400);
      const body = parseBody<{ error: { code: string; message: string } }>(result.body);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.message).toContain("capacity");
    });
  });

  describe("GET /api/rooms/:id", () => {
    it("should return room by id", async () => {
      const mockRoom: Partial<RoomItem> = {
        roomId: "room-1",
        spaId: "test-spa",
        name: "Massage Room",
        minCapacity: 1,
        maxCapacity: 2,
        maxConcurrentServices: 1,
        serviceIds: [],
      };

      (RoomEntity.build as jest.Mock).mockReturnValue({
        key: jest.fn().mockReturnValue({
          send: jest.fn().mockResolvedValue({ Item: mockRoom }),
        }),
      });

      const event = createMockEvent({
        httpMethod: "GET",
        path: "/api/rooms/room-1",
      });

      const result = await handler(event, createMockContext());

      expect(result.statusCode).toBe(200);
      const body = parseBody<{ data: RoomItem }>(result.body);
      expect(body.data.roomId).toBe("room-1");
      expect(body.data.name).toBe("Massage Room");
    });

    it("should return 404 when room not found", async () => {
      (RoomEntity.build as jest.Mock).mockReturnValue({
        key: jest.fn().mockReturnValue({
          send: jest.fn().mockResolvedValue({ Item: null }),
        }),
      });

      const event = createMockEvent({
        httpMethod: "GET",
        path: "/api/rooms/nonexistent",
      });

      const result = await handler(event, createMockContext());

      expect(result.statusCode).toBe(404);
      const body = parseBody<{ error: { code: string } }>(result.body);
      expect(body.error.code).toBe("NOT_FOUND");
    });
  });

  describe("PUT /api/rooms/:id", () => {
    it("should update an existing room", async () => {
      const existingRoom: Partial<RoomItem> = {
        roomId: "room-1",
        spaId: "test-spa",
        name: "Old Name",
        minCapacity: 1,
        maxCapacity: 2,
        maxConcurrentServices: 1,
        serviceIds: [],
      };

      (RoomEntity.build as jest.Mock).mockImplementation(() => ({
        key: jest.fn().mockReturnValue({
          send: jest.fn().mockResolvedValue({ Item: existingRoom }),
        }),
        item: jest.fn().mockReturnValue({
          send: jest.fn().mockResolvedValue({}),
        }),
      }));

      const event = createMockEvent({
        httpMethod: "PUT",
        path: "/api/rooms/room-1",
        body: JSON.stringify({
          name: "Updated Name",
          maxConcurrentServices: 3,
        }),
      });

      const result = await handler(event, createMockContext());

      expect(result.statusCode).toBe(200);
      const body = parseBody<{ data: RoomItem }>(result.body);
      expect(body.data.name).toBe("Updated Name");
      expect(body.data.maxConcurrentServices).toBe(3);
    });

    it("should return 404 when updating nonexistent room", async () => {
      (RoomEntity.build as jest.Mock).mockReturnValue({
        key: jest.fn().mockReturnValue({
          send: jest.fn().mockResolvedValue({ Item: null }),
        }),
      });

      const event = createMockEvent({
        httpMethod: "PUT",
        path: "/api/rooms/nonexistent",
        body: JSON.stringify({ name: "Updated" }),
      });

      const result = await handler(event, createMockContext());

      expect(result.statusCode).toBe(404);
      const body = parseBody<{ error: { code: string } }>(result.body);
      expect(body.error.code).toBe("NOT_FOUND");
    });
  });

  describe("DELETE /api/rooms/:id", () => {
    it("should delete an existing room", async () => {
      const existingRoom: Partial<RoomItem> = {
        roomId: "room-1",
        spaId: "test-spa",
        name: "Room to Delete",
        minCapacity: 1,
        maxCapacity: 2,
        maxConcurrentServices: 1,
        serviceIds: [],
      };

      (RoomEntity.build as jest.Mock)
        .mockReturnValueOnce({
          key: jest.fn().mockReturnValue({
            send: jest.fn().mockResolvedValue({ Item: existingRoom }),
          }),
        })
        .mockReturnValueOnce({
          key: jest.fn().mockReturnValue({
            send: jest.fn().mockResolvedValue({}),
          }),
        });

      const event = createMockEvent({
        httpMethod: "DELETE",
        path: "/api/rooms/room-1",
      });

      const result = await handler(event, createMockContext());

      expect(result.statusCode).toBe(204);
    });

    it("should return 404 when deleting nonexistent room", async () => {
      (RoomEntity.build as jest.Mock).mockReturnValue({
        key: jest.fn().mockReturnValue({
          send: jest.fn().mockResolvedValue({ Item: null }),
        }),
      });

      const event = createMockEvent({
        httpMethod: "DELETE",
        path: "/api/rooms/nonexistent",
      });

      const result = await handler(event, createMockContext());

      expect(result.statusCode).toBe(404);
      const body = parseBody<{ error: { code: string } }>(result.body);
      expect(body.error.code).toBe("NOT_FOUND");
    });
  });
});
