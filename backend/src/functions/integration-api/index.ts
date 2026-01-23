import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import { Effect, pipe } from "effect";
import { errorToResponse, AppError, UnauthorizedError, ForbiddenError } from "../../core/shared/errors";
import { GetItemCommand } from "dynamodb-toolbox/entity/actions/get";
import { IntegrationEntity, type IntegrationItem } from "../../core/database/entities/integration.entity";
import { verifySecret } from "../../core/shared/crypto";

// Route handlers
import { webhookRouter } from "./routes/webhook";
import { reservationsRouter } from "./routes/reservations";
import { verifyRouter } from "./routes/verify";

type RouteHandler = (
  event: APIGatewayProxyEvent,
  pathParams: Record<string, string>,
  integration: IntegrationItem
) => Effect.Effect<APIGatewayProxyResult, AppError>;

interface Route {
  method: string;
  pattern: RegExp;
  paramNames: string[];
  handler: RouteHandler;
  requiredPermission?: string;
}

// Route registry
const routes: Route[] = [
  // Webhook receiver
  {
    method: "POST",
    pattern: /^\/integration\/webhook$/,
    paramNames: [],
    handler: webhookRouter.receive,
  },
  // Reservations
  {
    method: "GET",
    pattern: /^\/integration\/reservations$/,
    paramNames: [],
    handler: reservationsRouter.list,
    requiredPermission: "reservations:read",
  },
  {
    method: "POST",
    pattern: /^\/integration\/reservations$/,
    paramNames: [],
    handler: reservationsRouter.create,
    requiredPermission: "reservations:write",
  },
  {
    method: "GET",
    pattern: /^\/integration\/reservations\/([^/]+)$/,
    paramNames: ["id"],
    handler: reservationsRouter.get,
    requiredPermission: "reservations:read",
  },
  {
    method: "PUT",
    pattern: /^\/integration\/reservations\/([^/]+)$/,
    paramNames: ["id"],
    handler: reservationsRouter.update,
    requiredPermission: "reservations:write",
  },
  // Hash verification
  {
    method: "POST",
    pattern: /^\/integration\/verify-hash$/,
    paramNames: [],
    handler: verifyRouter.verifyHash,
  },
];

function matchRoute(
  method: string,
  path: string
): { route: Route; params: Record<string, string> } | null {
  for (const route of routes) {
    if (route.method !== method) continue;

    const match = path.match(route.pattern);
    if (match) {
      const params: Record<string, string> = {};
      route.paramNames.forEach((name, index) => {
        params[name] = match[index + 1];
      });
      return { route, params };
    }
  }
  return null;
}

/**
 * Extract integration token from Authorization header
 * Expected format: Bearer <spaId>:<integrationId>:<secret>
 */
function parseAuthHeader(event: APIGatewayProxyEvent): {
  spaId: string;
  integrationId: string;
  secret: string;
} | null {
  const authHeader = event.headers?.Authorization || event.headers?.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.slice(7);
  const parts = token.split(":");
  if (parts.length !== 3) {
    return null;
  }

  return {
    spaId: parts[0],
    integrationId: parts[1],
    secret: parts[2],
  };
}

/**
 * Validate integration token and retrieve integration details
 */
async function validateIntegration(
  spaId: string,
  integrationId: string,
  secret: string
): Promise<IntegrationItem | null> {
  try {
    const result = await IntegrationEntity.build(GetItemCommand)
      .key({ spaId, integrationId })
      .send();

    if (!result.Item) {
      return null;
    }

    const integration = result.Item as IntegrationItem;

    // Check if integration is active
    if (!integration.isActive) {
      return null;
    }

    // Verify the secret
    if (!verifySecret(secret, integration.secretHash)) {
      return null;
    }

    return integration;
  } catch (error) {
    console.error("Error validating integration:", error);
    return null;
  }
}

/**
 * Check if integration has required permission
 */
function hasPermission(integration: IntegrationItem, permission: string): boolean {
  return integration.permissions.includes(permission) || integration.permissions.includes("*");
}

export async function handler(
  event: APIGatewayProxyEvent,
  _context: Context
): Promise<APIGatewayProxyResult> {
  const method = event.httpMethod;
  const path = event.path;

  console.log(`[Integration API] ${method} ${path}`);

  // Match route
  const matched = matchRoute(method, path);

  if (!matched) {
    return {
      statusCode: 404,
      body: JSON.stringify({ error: { code: "NOT_FOUND", message: "Route not found" } }),
      headers: { "Content-Type": "application/json" },
    };
  }

  // Parse auth header
  const auth = parseAuthHeader(event);
  if (!auth) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        error: {
          code: "UNAUTHORIZED",
          message: "Missing or invalid Authorization header. Expected: Bearer <spaId>:<integrationId>:<secret>",
        },
      }),
      headers: { "Content-Type": "application/json" },
    };
  }

  // Validate integration
  const integration = await validateIntegration(auth.spaId, auth.integrationId, auth.secret);
  if (!integration) {
    return {
      statusCode: 401,
      body: JSON.stringify({
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid integration credentials",
        },
      }),
      headers: { "Content-Type": "application/json" },
    };
  }

  // Check permission if required
  if (matched.route.requiredPermission && !hasPermission(integration, matched.route.requiredPermission)) {
    return {
      statusCode: 403,
      body: JSON.stringify({
        error: {
          code: "FORBIDDEN",
          message: `Missing required permission: ${matched.route.requiredPermission}`,
        },
      }),
      headers: { "Content-Type": "application/json" },
    };
  }

  // Add spaId to path params
  const params = { ...matched.params, spaId: integration.spaId };

  // Execute the handler with Effect
  const program = matched.route.handler(event, params, integration);

  const result = await Effect.runPromise(
    pipe(
      program,
      Effect.catchAll((error: AppError) => Effect.succeed(errorToResponse(error)))
    )
  );

  return result;
}
