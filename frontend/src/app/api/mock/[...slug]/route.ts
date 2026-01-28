import { NextRequest, NextResponse } from "next/server";

// Mock API responses for E2E testing
// Only active when E2E_TEST_MODE is enabled

const mockResponses: Record<string, unknown> = {
  "/api/employees": [],
  "/api/rooms": [],
  "/api/products": [],
  "/api/services": [],
  "/api/clients": [],
  "/api/reservations": [],
  "/api/closures": [],
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string[] }> }
) {
  if (process.env.E2E_TEST_MODE !== "true") {
    return NextResponse.json(
      { error: "Not found" },
      { status: 404 }
    );
  }

  const { slug } = await params;
  const path = `/api/${slug.join("/")}`;

  if (path in mockResponses) {
    return NextResponse.json(mockResponses[path]);
  }

  // Handle specific entity endpoints (e.g., /api/employees/:id)
  const basePath = path.split("/").slice(0, 3).join("/");
  if (basePath in mockResponses) {
    return NextResponse.json(null, { status: 404 });
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function POST(request: NextRequest) {
  if (process.env.E2E_TEST_MODE !== "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Return a mock created entity
  const body = await request.json();
  return NextResponse.json({
    id: crypto.randomUUID(),
    ...body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
}

export async function PUT(request: NextRequest) {
  if (process.env.E2E_TEST_MODE !== "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  return NextResponse.json({
    ...body,
    updatedAt: new Date().toISOString(),
  });
}

export async function DELETE() {
  if (process.env.E2E_TEST_MODE !== "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(null, { status: 204 });
}
