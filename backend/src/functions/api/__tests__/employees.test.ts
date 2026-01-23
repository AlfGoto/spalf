import { createMockEvent, createMockContext, parseBody } from "./test-utils";
import type { EmployeeItem } from "../../../core/database/entities";

// Mock the DynamoDB operations at module level
const mockSend = jest.fn();
const mockBuild = jest.fn();
const mockItem = jest.fn();
const mockKey = jest.fn();
const mockQuery = jest.fn();
const mockEntities = jest.fn();

// Mock dynamodb-toolbox commands
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

// Mock the EmployeeEntity
jest.mock("../../../core/database/entities", () => ({
  EmployeeEntity: {
    build: jest.fn(() => ({
      item: jest.fn(() => ({ send: mockSend })),
      key: jest.fn(() => ({ send: mockSend })),
    })),
  },
}));

// Mock the SpalfTable
jest.mock("../../../core/database/table", () => ({
  SpalfTable: {
    build: jest.fn(() => ({
      query: jest.fn(() => ({
        entities: jest.fn(() => ({ send: mockSend })),
      })),
    })),
  },
}));

// Mock ulid for consistent IDs
jest.mock("ulid", () => ({
  ulid: jest.fn(() => "test-id-12345"),
}));

// Import after mocking
import { handler } from "../index";
import { EmployeeEntity } from "../../../core/database/entities";
import { SpalfTable } from "../../../core/database/table";

describe("Employees API Integration Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/employees", () => {
    it("should return empty list when no employees exist", async () => {
      // Mock empty query result
      (SpalfTable.build as jest.Mock).mockReturnValue({
        query: jest.fn().mockReturnValue({
          entities: jest.fn().mockReturnValue({
            send: jest.fn().mockResolvedValue({ Items: [] }),
          }),
        }),
      });

      const event = createMockEvent({
        httpMethod: "GET",
        path: "/api/employees",
      });

      const result = await handler(event, createMockContext());

      expect(result.statusCode).toBe(200);
      const body = parseBody<{ data: EmployeeItem[] }>(result.body);
      expect(body.data).toEqual([]);
    });

    it("should return list of employees", async () => {
      const mockEmployees: Partial<EmployeeItem>[] = [
        {
          employeeId: "emp-1",
          spaId: "test-spa",
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          employmentType: "FULLTIME",
          serviceIds: [],
        },
        {
          employeeId: "emp-2",
          spaId: "test-spa",
          firstName: "Jane",
          lastName: "Smith",
          email: "jane@example.com",
          employmentType: "FREELANCE",
          serviceIds: [],
        },
      ];

      (SpalfTable.build as jest.Mock).mockReturnValue({
        query: jest.fn().mockReturnValue({
          entities: jest.fn().mockReturnValue({
            send: jest.fn().mockResolvedValue({ Items: mockEmployees }),
          }),
        }),
      });

      const event = createMockEvent({
        httpMethod: "GET",
        path: "/api/employees",
      });

      const result = await handler(event, createMockContext());

      expect(result.statusCode).toBe(200);
      const body = parseBody<{ data: EmployeeItem[] }>(result.body);
      expect(body.data).toHaveLength(2);
      expect(body.data[0].firstName).toBe("John");
      expect(body.data[1].firstName).toBe("Jane");
    });

    it("should return 401 when spa context is missing", async () => {
      const event = createMockEvent({
        httpMethod: "GET",
        path: "/api/employees",
        requestContext: {
          ...createMockEvent().requestContext,
          authorizer: { claims: {} },
        },
      });

      const result = await handler(event, createMockContext());

      expect(result.statusCode).toBe(401);
      const body = parseBody<{ error: { code: string } }>(result.body);
      expect(body.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("POST /api/employees", () => {
    it("should create a new employee", async () => {
      (EmployeeEntity.build as jest.Mock).mockReturnValue({
        item: jest.fn().mockReturnValue({
          send: jest.fn().mockResolvedValue({}),
        }),
      });

      const newEmployee = {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        employmentType: "FULLTIME",
      };

      const event = createMockEvent({
        httpMethod: "POST",
        path: "/api/employees",
        body: JSON.stringify(newEmployee),
      });

      const result = await handler(event, createMockContext());

      expect(result.statusCode).toBe(201);
      const body = parseBody<{ data: EmployeeItem }>(result.body);
      expect(body.data.firstName).toBe("John");
      expect(body.data.lastName).toBe("Doe");
      expect(body.data.email).toBe("john@example.com");
      expect(body.data.employeeId).toBe("test-id-12345");
    });

    it("should return 400 when firstName is missing", async () => {
      const event = createMockEvent({
        httpMethod: "POST",
        path: "/api/employees",
        body: JSON.stringify({
          lastName: "Doe",
          email: "john@example.com",
          employmentType: "FULLTIME",
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
        path: "/api/employees",
        body: JSON.stringify({
          firstName: "John",
          email: "john@example.com",
          employmentType: "FULLTIME",
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
        path: "/api/employees",
        body: JSON.stringify({
          firstName: "John",
          lastName: "Doe",
          employmentType: "FULLTIME",
        }),
      });

      const result = await handler(event, createMockContext());

      expect(result.statusCode).toBe(400);
      const body = parseBody<{ error: { code: string; message: string } }>(result.body);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.message).toContain("Email");
    });

    it("should return 400 when employmentType is invalid", async () => {
      const event = createMockEvent({
        httpMethod: "POST",
        path: "/api/employees",
        body: JSON.stringify({
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          employmentType: "INVALID",
        }),
      });

      const result = await handler(event, createMockContext());

      expect(result.statusCode).toBe(400);
      const body = parseBody<{ error: { code: string; message: string } }>(result.body);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.message).toContain("employment type");
    });

    it("should return 400 when body is invalid JSON", async () => {
      const event = createMockEvent({
        httpMethod: "POST",
        path: "/api/employees",
        body: "not valid json",
      });

      const result = await handler(event, createMockContext());

      expect(result.statusCode).toBe(400);
      const body = parseBody<{ error: { code: string } }>(result.body);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("GET /api/employees/:id", () => {
    it("should return employee by id", async () => {
      const mockEmployee: Partial<EmployeeItem> = {
        employeeId: "emp-1",
        spaId: "test-spa",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        employmentType: "FULLTIME",
        serviceIds: [],
      };

      (EmployeeEntity.build as jest.Mock).mockReturnValue({
        key: jest.fn().mockReturnValue({
          send: jest.fn().mockResolvedValue({ Item: mockEmployee }),
        }),
      });

      const event = createMockEvent({
        httpMethod: "GET",
        path: "/api/employees/emp-1",
      });

      const result = await handler(event, createMockContext());

      expect(result.statusCode).toBe(200);
      const body = parseBody<{ data: EmployeeItem }>(result.body);
      expect(body.data.employeeId).toBe("emp-1");
      expect(body.data.firstName).toBe("John");
    });

    it("should return 404 when employee not found", async () => {
      (EmployeeEntity.build as jest.Mock).mockReturnValue({
        key: jest.fn().mockReturnValue({
          send: jest.fn().mockResolvedValue({ Item: null }),
        }),
      });

      const event = createMockEvent({
        httpMethod: "GET",
        path: "/api/employees/nonexistent",
      });

      const result = await handler(event, createMockContext());

      expect(result.statusCode).toBe(404);
      const body = parseBody<{ error: { code: string } }>(result.body);
      expect(body.error.code).toBe("NOT_FOUND");
    });
  });

  describe("PUT /api/employees/:id", () => {
    it("should update an existing employee", async () => {
      const existingEmployee: Partial<EmployeeItem> = {
        employeeId: "emp-1",
        spaId: "test-spa",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        employmentType: "FULLTIME",
        serviceIds: [],
      };

      // First call returns the existing employee (get)
      // Second call is the update
      const getMock = jest.fn().mockResolvedValue({ Item: existingEmployee });
      const updateMock = jest.fn().mockResolvedValue({});

      let callCount = 0;
      (EmployeeEntity.build as jest.Mock).mockImplementation(() => ({
        key: jest.fn().mockReturnValue({ send: getMock }),
        item: jest.fn().mockReturnValue({ send: updateMock }),
      }));

      const event = createMockEvent({
        httpMethod: "PUT",
        path: "/api/employees/emp-1",
        body: JSON.stringify({
          firstName: "Johnny",
          phone: "+1234567890",
        }),
      });

      const result = await handler(event, createMockContext());

      expect(result.statusCode).toBe(200);
      const body = parseBody<{ data: EmployeeItem }>(result.body);
      expect(body.data.firstName).toBe("Johnny");
      expect(body.data.phone).toBe("+1234567890");
    });

    it("should return 404 when updating nonexistent employee", async () => {
      (EmployeeEntity.build as jest.Mock).mockReturnValue({
        key: jest.fn().mockReturnValue({
          send: jest.fn().mockResolvedValue({ Item: null }),
        }),
      });

      const event = createMockEvent({
        httpMethod: "PUT",
        path: "/api/employees/nonexistent",
        body: JSON.stringify({ firstName: "Updated" }),
      });

      const result = await handler(event, createMockContext());

      expect(result.statusCode).toBe(404);
      const body = parseBody<{ error: { code: string } }>(result.body);
      expect(body.error.code).toBe("NOT_FOUND");
    });
  });

  describe("DELETE /api/employees/:id", () => {
    it("should delete an existing employee", async () => {
      const existingEmployee: Partial<EmployeeItem> = {
        employeeId: "emp-1",
        spaId: "test-spa",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        employmentType: "FULLTIME",
        serviceIds: [],
      };

      const getMock = jest.fn().mockResolvedValue({ Item: existingEmployee });
      const deleteMock = jest.fn().mockResolvedValue({});

      (EmployeeEntity.build as jest.Mock).mockImplementation(() => ({
        key: jest.fn().mockReturnValue({ send: getMock.mockResolvedValueOnce({ Item: existingEmployee }).mockResolvedValueOnce({}) }),
      }));

      // For delete, we need both get and delete to work
      (EmployeeEntity.build as jest.Mock)
        .mockReturnValueOnce({
          key: jest.fn().mockReturnValue({
            send: jest.fn().mockResolvedValue({ Item: existingEmployee }),
          }),
        })
        .mockReturnValueOnce({
          key: jest.fn().mockReturnValue({
            send: jest.fn().mockResolvedValue({}),
          }),
        });

      const event = createMockEvent({
        httpMethod: "DELETE",
        path: "/api/employees/emp-1",
      });

      const result = await handler(event, createMockContext());

      expect(result.statusCode).toBe(204);
    });

    it("should return 404 when deleting nonexistent employee", async () => {
      (EmployeeEntity.build as jest.Mock).mockReturnValue({
        key: jest.fn().mockReturnValue({
          send: jest.fn().mockResolvedValue({ Item: null }),
        }),
      });

      const event = createMockEvent({
        httpMethod: "DELETE",
        path: "/api/employees/nonexistent",
      });

      const result = await handler(event, createMockContext());

      expect(result.statusCode).toBe(404);
      const body = parseBody<{ error: { code: string } }>(result.body);
      expect(body.error.code).toBe("NOT_FOUND");
    });
  });

  describe("Route Not Found", () => {
    it("should return 404 for unknown routes", async () => {
      const event = createMockEvent({
        httpMethod: "GET",
        path: "/api/unknown",
      });

      const result = await handler(event, createMockContext());

      expect(result.statusCode).toBe(404);
      const body = parseBody<{ error: { code: string } }>(result.body);
      expect(body.error.code).toBe("NOT_FOUND");
    });

    it("should return 404 for unsupported HTTP methods", async () => {
      const event = createMockEvent({
        httpMethod: "PATCH",
        path: "/api/employees",
      });

      const result = await handler(event, createMockContext());

      expect(result.statusCode).toBe(404);
    });
  });
});
