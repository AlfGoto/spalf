import type { APIGatewayProxyEvent, Context } from "aws-lambda";

/**
 * Test utilities for API integration tests
 */

// Helper to create a mock API Gateway event
export function createMockEvent(overrides: Partial<APIGatewayProxyEvent> = {}): APIGatewayProxyEvent {
  return {
    httpMethod: "GET",
    path: "/api/employees",
    body: null,
    headers: {},
    multiValueHeaders: {},
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {
      accountId: "123456789012",
      apiId: "api-id",
      authorizer: {
        claims: {
          "custom:spaId": "test-spa",
          sub: "user-123",
        },
      },
      protocol: "HTTP/1.1",
      httpMethod: "GET",
      identity: {
        accessKey: null,
        accountId: null,
        apiKey: null,
        apiKeyId: null,
        caller: null,
        clientCert: null,
        cognitoAuthenticationProvider: null,
        cognitoAuthenticationType: null,
        cognitoIdentityId: null,
        cognitoIdentityPoolId: null,
        principalOrgId: null,
        sourceIp: "127.0.0.1",
        user: null,
        userAgent: "test-agent",
        userArn: null,
      },
      path: "/api/employees",
      stage: "test",
      requestId: "request-id",
      requestTimeEpoch: Date.now(),
      resourceId: "resource-id",
      resourcePath: "/api/employees",
    },
    resource: "/api/employees",
    isBase64Encoded: false,
    ...overrides,
  };
}

// Helper to create mock context
export function createMockContext(): Context {
  return {
    callbackWaitsForEmptyEventLoop: false,
    functionName: "test-function",
    functionVersion: "1",
    invokedFunctionArn: "arn:aws:lambda:us-east-1:123456789012:function:test",
    memoryLimitInMB: "128",
    awsRequestId: "test-request-id",
    logGroupName: "/aws/lambda/test",
    logStreamName: "2026/01/23/[$LATEST]test",
    getRemainingTimeInMillis: () => 30000,
    done: () => {},
    fail: () => {},
    succeed: () => {},
  };
}

// Helper to parse response body
export function parseBody<T>(body: string | null): T {
  return JSON.parse(body || "{}") as T;
}

// Type for mock entity operations
export interface MockEntityOperations {
  put: jest.Mock;
  get: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  query: jest.Mock;
}

// Create mock entity operations
export function createMockEntityOps(): MockEntityOperations {
  return {
    put: jest.fn().mockResolvedValue({}),
    get: jest.fn().mockResolvedValue({ Item: null }),
    update: jest.fn().mockResolvedValue({}),
    delete: jest.fn().mockResolvedValue({}),
    query: jest.fn().mockResolvedValue({ Items: [] }),
  };
}
