import { createMockEvent, createMockContext, parseBody } from "./test-utils";
import type { ClientItem } from "../../../core/database/entities";

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
  ClientEntity: {
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
  ulid: jest.fn(() => "test-client-id"),
}));

// Import after mocking
import { handler } from "../index";
import { ClientEntity } from "../../../core/database/entities";
import { SpalfTable } from "../../../core/database/table";

describe("Clients API Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/clients", () => {
    it("should return empty list when no clients exist", async () => {
      (SpalfTable.build as jest.Mock).mockReturnValue({
        query: jest.fn().mockReturnValue({
          entities: jest.fn().mockReturnValue({
            send: jest.fn().mockResolvedValue({ Items: [] }),
          }),
        }),
      });

      const event = createMockEvent({
        httpMethod: "GET",
        path: "/api/clients",
      });

      const result = await handler(event, createMockContext());

      expect(result.statusCode).toBe(200);
      const body = parseBody<{ data: ClientItem[] }>(result.body);
      expect(body.data).toEqual([]);
    });

    it("should return list of clients", async () => {
      const mockClients: Partial<ClientItem>[] = [
        {
          clientId: "client-1",
          spaId: "test-spa",
          firstName: "Alice",
          lastName: "Johnson",
          email: "alice@example.com",
        },
        {
          clientId: "client-2",
          spaId: "test-spa",
          firstName: "Bob",
          lastName: "Williams",
          email: "bob@example.com",
          phone: "+1234567890",
          allergies: "Peanuts",
        },
      ];

      (SpalfTable.build as jest.Mock).mockReturnValue({
        query: jest.fn().mockReturnValue({
          entities: jest.fn().mockReturnValue({
            send: jest.fn().mockResolvedValue({ Items: mockClients }),
          }),
        }),
      });

      const event = createMockEvent({
        httpMethod: "GET",
        path: "/api/clients",
      });

      const result = await handler(event, createMockContext());

      expect(result.statusCode).toBe(200);
      const body = parseBody<{ data: ClientItem[] }>(result.body);
      expect(body.data).toHaveLength(2);
      expect(body.data[0].firstName).toBe("Alice");
      expect(body.data[1].allergies).toBe("Peanuts");
    });
  });

  describe("POST /api/clients", () => {
    it("should create a new client with required fields", async () => {
      (ClientEntity.build as jest.Mock).mockReturnValue({
        item: jest.fn().mockReturnValue({
          send: jest.fn().mockResolvedValue({}),
        }),
      });

      const newClient = {
        firstName: "Alice",
        lastName: "Johnson",
        email: "alice@example.com",
      };

      const event = createMockEvent({
        httpMethod: "POST",
        path: "/api/clients",
        body: JSON.stringify(newClient),
      });

      const result = await handler(event, createMockContext());

      expect(result.statusCode).toBe(201);
      const body = parseBody<{ data: ClientItem }>(result.body);
      expect(body.data.firstName).toBe("Alice");
      expect(body.data.lastName).toBe("Johnson");
      expect(body.data.email).toBe("alice@example.com");
      expect(body.data.clientId).toBe("test-client-id");
    });

    it("should create a client with all optional fields", async () => {
      (ClientEntity.build as jest.Mock).mockReturnValue({
        item: jest.fn().mockReturnValue({
          send: jest.fn().mockResolvedValue({}),
        }),
      });

      const newClient = {
        firstName: "Bob",
        lastName: "Smith",
        email: "bob@example.com",
        phone: "+1234567890",
        allergies: "Shellfish, Nuts",
        preferences: "Prefers gentle pressure",
        notes: "VIP customer",
      };

      const event = createMockEvent({
        httpMethod: "POST",
        path: "/api/clients",
        body: JSON.stringify(newClient),
      });

      const result = await handler(event, createMockContext());

      expect(result.statusCode).toBe(201);
      const body = parseBody<{ data: ClientItem }>(result.body);
      expect(body.data.phone).toBe("+1234567890");
      expect(body.data.allergies).toBe("Shellfish, Nuts");
      expect(body.data.preferences).toBe("Prefers gentle pressure");
      expect(body.data.notes).toBe("VIP customer");
    });

    it("should return 400 when firstName is missing", async () => {
      const event = createMockEvent({
        httpMethod: "POST",
        path: "/api/clients",
        body: JSON.stringify({
          lastName: "Johnson",
          email: "alice@example.com",
        }),
      });

      const result = await handler(event, createMockContext());

      expect(result.statusCode).toBe(400);
      const body = parseBody<{ error: { code: string; message: string } }>(result.body);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.message).toContain("First name");
    });

    it("should return 400 when lastName is missing", async () => {
      const event = createMockEvent({
        httpMethod: "POST",
        path: "/api/clients",
        body: JSON.stringify({
          firstName: "Alice",
          email: "alice@example.com",
        }),
      });

      const result = await handler(event, createMockContext());

      expect(result.statusCode).toBe(400);
      const body = parseBody<{ error: { code: string; message: string } }>(result.body);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.message).toContain("Last name");
    });

    it("should return 400 when email is missing", async () => {
      const event = createMockEvent({
        httpMethod: "POST",
        path: "/api/clients",
        body: JSON.stringify({
          firstName: "Alice",
          lastName: "Johnson",
        }),
      });

      const result = await handler(event, createMockContext());

      expect(result.statusCode).toBe(400);
      const body = parseBody<{ error: { code: string; message: string } }>(result.body);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.message).toContain("Email");
    });

    it("should return 400 when email format is invalid", async () => {
      const event = createMockEvent({
        httpMethod: "POST",
        path: "/api/clients",
        body: JSON.stringify({
          firstName: "Alice",
          lastName: "Johnson",
          email: "not-a-valid-email",
        }),
      });

      const result = await handler(event, createMockContext());

      expect(result.statusCode).toBe(400);
      const body = parseBody<{ error: { code: string; message: string } }>(result.body);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.message).toContain("email format");
    });

    it("should accept various valid email formats", async () => {
      (ClientEntity.build as jest.Mock).mockReturnValue({
        item: jest.fn().mockReturnValue({
          send: jest.fn().mockResolvedValue({}),
        }),
      });

      const validEmails = [
        "test@example.com",
        "user.name@domain.co.uk",
        "user+tag@example.org",
      ];

      for (const email of validEmails) {
        const event = createMockEvent({
          httpMethod: "POST",
          path: "/api/clients",
          body: JSON.stringify({
            firstName: "Test",
            lastName: "User",
            email,
          }),
        });

        const result = await handler(event, createMockContext());
        expect(result.statusCode).toBe(201);
      }
    });
  });

  describe("GET /api/clients/:id", () => {
    it("should return client by id", async () => {
      const mockClient: Partial<ClientItem> = {
        clientId: "client-1",
        spaId: "test-spa",
        firstName: "Alice",
        lastName: "Johnson",
        email: "alice@example.com",
        allergies: "Pollen",
      };

      (ClientEntity.build as jest.Mock).mockReturnValue({
        key: jest.fn().mockReturnValue({
          send: jest.fn().mockResolvedValue({ Item: mockClient }),
        }),
      });

      const event = createMockEvent({
        httpMethod: "GET",
        path: "/api/clients/client-1",
      });

      const result = await handler(event, createMockContext());

      expect(result.statusCode).toBe(200);
      const body = parseBody<{ data: ClientItem }>(result.body);
      expect(body.data.clientId).toBe("client-1");
      expect(body.data.firstName).toBe("Alice");
      expect(body.data.allergies).toBe("Pollen");
    });

    it("should return 404 when client not found", async () => {
      (ClientEntity.build as jest.Mock).mockReturnValue({
        key: jest.fn().mockReturnValue({
          send: jest.fn().mockResolvedValue({ Item: null }),
        }),
      });

      const event = createMockEvent({
        httpMethod: "GET",
        path: "/api/clients/nonexistent",
      });

      const result = await handler(event, createMockContext());

      expect(result.statusCode).toBe(404);
      const body = parseBody<{ error: { code: string } }>(result.body);
      expect(body.error.code).toBe("NOT_FOUND");
    });
  });

  describe("PUT /api/clients/:id", () => {
    it("should update an existing client", async () => {
      const existingClient: Partial<ClientItem> = {
        clientId: "client-1",
        spaId: "test-spa",
        firstName: "Alice",
        lastName: "Johnson",
        email: "alice@example.com",
      };

      (ClientEntity.build as jest.Mock).mockImplementation(() => ({
        key: jest.fn().mockReturnValue({
          send: jest.fn().mockResolvedValue({ Item: existingClient }),
        }),
        item: jest.fn().mockReturnValue({
          send: jest.fn().mockResolvedValue({}),
        }),
      }));

      const event = createMockEvent({
        httpMethod: "PUT",
        path: "/api/clients/client-1",
        body: JSON.stringify({
          allergies: "Newly discovered: Latex",
          notes: "Updated notes",
        }),
      });

      const result = await handler(event, createMockContext());

      expect(result.statusCode).toBe(200);
      const body = parseBody<{ data: ClientItem }>(result.body);
      expect(body.data.allergies).toBe("Newly discovered: Latex");
      expect(body.data.notes).toBe("Updated notes");
      expect(body.data.firstName).toBe("Alice"); // Preserved from existing
    });

    it("should return 404 when updating nonexistent client", async () => {
      (ClientEntity.build as jest.Mock).mockReturnValue({
        key: jest.fn().mockReturnValue({
          send: jest.fn().mockResolvedValue({ Item: null }),
        }),
      });

      const event = createMockEvent({
        httpMethod: "PUT",
        path: "/api/clients/nonexistent",
        body: JSON.stringify({ firstName: "Updated" }),
      });

      const result = await handler(event, createMockContext());

      expect(result.statusCode).toBe(404);
      const body = parseBody<{ error: { code: string } }>(result.body);
      expect(body.error.code).toBe("NOT_FOUND");
    });
  });

  describe("DELETE /api/clients/:id", () => {
    it("should delete an existing client", async () => {
      const existingClient: Partial<ClientItem> = {
        clientId: "client-1",
        spaId: "test-spa",
        firstName: "Alice",
        lastName: "Johnson",
        email: "alice@example.com",
      };

      (ClientEntity.build as jest.Mock)
        .mockReturnValueOnce({
          key: jest.fn().mockReturnValue({
            send: jest.fn().mockResolvedValue({ Item: existingClient }),
          }),
        })
        .mockReturnValueOnce({
          key: jest.fn().mockReturnValue({
            send: jest.fn().mockResolvedValue({}),
          }),
        });

      const event = createMockEvent({
        httpMethod: "DELETE",
        path: "/api/clients/client-1",
      });

      const result = await handler(event, createMockContext());

      expect(result.statusCode).toBe(204);
    });

    it("should return 404 when deleting nonexistent client", async () => {
      (ClientEntity.build as jest.Mock).mockReturnValue({
        key: jest.fn().mockReturnValue({
          send: jest.fn().mockResolvedValue({ Item: null }),
        }),
      });

      const event = createMockEvent({
        httpMethod: "DELETE",
        path: "/api/clients/nonexistent",
      });

      const result = await handler(event, createMockContext());

      expect(result.statusCode).toBe(404);
      const body = parseBody<{ error: { code: string } }>(result.body);
      expect(body.error.code).toBe("NOT_FOUND");
    });
  });
});
