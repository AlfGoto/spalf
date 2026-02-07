import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from "aws-lambda";
import { Effect, pipe } from "effect";
import {
  errorToResponse,
  AppError,
  ValidationError,
} from "../../core/shared/errors";

// Route handlers
import { employeesRouter } from "./routes/employees";
import { roomsRouter } from "./routes/rooms";
import { productsRouter } from "./routes/products";
import { servicesRouter } from "./routes/services";
import { clientsRouter } from "./routes/clients";
import { reservationsRouter } from "./routes/reservations";
import { closuresRouter } from "./routes/closures";
import { integrationsRouter } from "./routes/integrations";

type RouteHandler = (
  event: APIGatewayProxyEvent,
  pathParams: Record<string, string>,
) => Effect.Effect<APIGatewayProxyResult, AppError>;

interface Route {
  method: string;
  pattern: RegExp;
  paramNames: string[];
  handler: RouteHandler;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
  "Content-Type": "application/json",
};

function json(statusCode: number, body: unknown): APIGatewayProxyResult {
  return {
    statusCode,
    headers: corsHeaders,
    body: JSON.stringify(body),
  };
}

// Route registry
const routes: Route[] = [
  // Employees
  {
    method: "GET",
    pattern: /^\/api\/employees$/,
    paramNames: [],
    handler: employeesRouter.list,
  },
  {
    method: "POST",
    pattern: /^\/api\/employees$/,
    paramNames: [],
    handler: employeesRouter.create,
  },
  {
    method: "GET",
    pattern: /^\/api\/employees\/([^/]+)$/,
    paramNames: ["id"],
    handler: employeesRouter.get,
  },
  {
    method: "PUT",
    pattern: /^\/api\/employees\/([^/]+)$/,
    paramNames: ["id"],
    handler: employeesRouter.update,
  },
  {
    method: "DELETE",
    pattern: /^\/api\/employees\/([^/]+)$/,
    paramNames: ["id"],
    handler: employeesRouter.delete,
  },
  // Rooms
  {
    method: "GET",
    pattern: /^\/api\/rooms$/,
    paramNames: [],
    handler: roomsRouter.list,
  },
  {
    method: "POST",
    pattern: /^\/api\/rooms$/,
    paramNames: [],
    handler: roomsRouter.create,
  },
  {
    method: "GET",
    pattern: /^\/api\/rooms\/([^/]+)$/,
    paramNames: ["id"],
    handler: roomsRouter.get,
  },
  {
    method: "PUT",
    pattern: /^\/api\/rooms\/([^/]+)$/,
    paramNames: ["id"],
    handler: roomsRouter.update,
  },
  {
    method: "DELETE",
    pattern: /^\/api\/rooms\/([^/]+)$/,
    paramNames: ["id"],
    handler: roomsRouter.delete,
  },
  // Products
  {
    method: "GET",
    pattern: /^\/api\/products$/,
    paramNames: [],
    handler: productsRouter.list,
  },
  {
    method: "POST",
    pattern: /^\/api\/products$/,
    paramNames: [],
    handler: productsRouter.create,
  },
  {
    method: "GET",
    pattern: /^\/api\/products\/([^/]+)$/,
    paramNames: ["id"],
    handler: productsRouter.get,
  },
  {
    method: "PUT",
    pattern: /^\/api\/products\/([^/]+)$/,
    paramNames: ["id"],
    handler: productsRouter.update,
  },
  {
    method: "DELETE",
    pattern: /^\/api\/products\/([^/]+)$/,
    paramNames: ["id"],
    handler: productsRouter.delete,
  },
  // Services
  {
    method: "GET",
    pattern: /^\/api\/services$/,
    paramNames: [],
    handler: servicesRouter.list,
  },
  {
    method: "POST",
    pattern: /^\/api\/services$/,
    paramNames: [],
    handler: servicesRouter.create,
  },
  {
    method: "GET",
    pattern: /^\/api\/services\/([^/]+)$/,
    paramNames: ["id"],
    handler: servicesRouter.get,
  },
  {
    method: "PUT",
    pattern: /^\/api\/services\/([^/]+)$/,
    paramNames: ["id"],
    handler: servicesRouter.update,
  },
  {
    method: "DELETE",
    pattern: /^\/api\/services\/([^/]+)$/,
    paramNames: ["id"],
    handler: servicesRouter.delete,
  },
  // Clients
  {
    method: "GET",
    pattern: /^\/api\/clients$/,
    paramNames: [],
    handler: clientsRouter.list,
  },
  {
    method: "POST",
    pattern: /^\/api\/clients$/,
    paramNames: [],
    handler: clientsRouter.create,
  },
  {
    method: "GET",
    pattern: /^\/api\/clients\/([^/]+)$/,
    paramNames: ["id"],
    handler: clientsRouter.get,
  },
  {
    method: "PUT",
    pattern: /^\/api\/clients\/([^/]+)$/,
    paramNames: ["id"],
    handler: clientsRouter.update,
  },
  {
    method: "DELETE",
    pattern: /^\/api\/clients\/([^/]+)$/,
    paramNames: ["id"],
    handler: clientsRouter.delete,
  },
  // Reservations
  {
    method: "GET",
    pattern: /^\/api\/reservations\/calendar$/,
    paramNames: [],
    handler: reservationsRouter.calendar,
  },
  {
    method: "GET",
    pattern: /^\/api\/reservations$/,
    paramNames: [],
    handler: reservationsRouter.list,
  },
  {
    method: "POST",
    pattern: /^\/api\/reservations$/,
    paramNames: [],
    handler: reservationsRouter.create,
  },
  {
    method: "GET",
    pattern: /^\/api\/reservations\/([^/]+)$/,
    paramNames: ["id"],
    handler: reservationsRouter.get,
  },
  {
    method: "PUT",
    pattern: /^\/api\/reservations\/([^/]+)$/,
    paramNames: ["id"],
    handler: reservationsRouter.update,
  },
  {
    method: "DELETE",
    pattern: /^\/api\/reservations\/([^/]+)$/,
    paramNames: ["id"],
    handler: reservationsRouter.delete,
  },
  // Closures
  {
    method: "GET",
    pattern: /^\/api\/closures$/,
    paramNames: [],
    handler: closuresRouter.list,
  },
  {
    method: "POST",
    pattern: /^\/api\/closures$/,
    paramNames: [],
    handler: closuresRouter.create,
  },
  {
    method: "GET",
    pattern: /^\/api\/closures\/([^/]+)$/,
    paramNames: ["id"],
    handler: closuresRouter.get,
  },
  {
    method: "PUT",
    pattern: /^\/api\/closures\/([^/]+)$/,
    paramNames: ["id"],
    handler: closuresRouter.update,
  },
  {
    method: "DELETE",
    pattern: /^\/api\/closures\/([^/]+)$/,
    paramNames: ["id"],
    handler: closuresRouter.delete,
  },
  // Integrations
  {
    method: "GET",
    pattern: /^\/api\/integrations$/,
    paramNames: [],
    handler: integrationsRouter.list,
  },
  {
    method: "POST",
    pattern: /^\/api\/integrations$/,
    paramNames: [],
    handler: integrationsRouter.create,
  },
  {
    method: "GET",
    pattern: /^\/api\/integrations\/([^/]+)$/,
    paramNames: ["id"],
    handler: integrationsRouter.get,
  },
  {
    method: "PUT",
    pattern: /^\/api\/integrations\/([^/]+)$/,
    paramNames: ["id"],
    handler: integrationsRouter.update,
  },
  {
    method: "DELETE",
    pattern: /^\/api\/integrations\/([^/]+)$/,
    paramNames: ["id"],
    handler: integrationsRouter.delete,
  },
  {
    method: "POST",
    pattern: /^\/api\/integrations\/([^/]+)\/regenerate-secret$/,
    paramNames: ["id"],
    handler: integrationsRouter.regenerateSecret,
  },
];

function matchRoute(
  method: string,
  path: string,
): { handler: RouteHandler; params: Record<string, string> } | null {
  for (const route of routes) {
    if (route.method !== method) continue;

    const match = path.match(route.pattern);
    if (match) {
      const params: Record<string, string> = {};
      route.paramNames.forEach((name, index) => {
        params[name] = match[index + 1];
      });
      return { handler: route.handler, params };
    }
  }
  return null;
}

function getSpaId(event: APIGatewayProxyEvent): string | null {
  // Extract spa ID from the Cognito claims
  // The spa ID should be set as a custom attribute in the JWT
  const claims = event.requestContext.authorizer?.claims;
  return claims?.["custom:spaId"] || null;
}

export async function handler(
  event: APIGatewayProxyEvent,
  _context: Context,
): Promise<APIGatewayProxyResult> {
  const method = event.httpMethod;
  const path = event.path;

  console.log(`[API] ${method} ${path}`);

  // Match route
  const matched = matchRoute(method, path);

  if (!matched) {
    return json(404, {
      error: { code: "NOT_FOUND", message: "Route not found" },
    });
  }

  // Get spa ID from claims
  const spaId = getSpaId(event);
  if (!spaId) {
    return json(401, {
      error: { code: "UNAUTHORIZED", message: "Missing spa context" },
    });
  }

  // Add spaId to path params
  const params = { ...matched.params, spaId };

  // Execute the handler with Effect
  const program = matched.handler(event, params);

  const result = await Effect.runPromise(
    pipe(
      program,
      Effect.catchAll((error: AppError) =>
        Effect.succeed(errorToResponse(error)),
      ),
    ),
  );

  // 🔥 FORCE CORS HERE
  return {
    ...result,
    headers: {
      ...corsHeaders,
      ...(result.headers ?? {}),
    },
  };
}
