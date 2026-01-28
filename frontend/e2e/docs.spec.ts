import { test, expect } from "@playwright/test";

test.describe("Documentation Pages (Public)", () => {
  test("should load documentation landing page", async ({ page }) => {
    await page.goto("/en/docs");

    // Title is "Spalf Integration Documentation"
    await expect(page.locator("h1")).toContainText(
      "Spalf Integration Documentation"
    );
  });

  test("should display section cards on landing page", async ({ page }) => {
    await page.goto("/en/docs");

    // Look for section cards by their card-title data-slot
    await expect(
      page.locator('[data-slot="card-title"]', { hasText: "API Reference" })
    ).toBeVisible();
    await expect(
      page.locator('[data-slot="card-title"]', {
        hasText: "Integration Guides",
      })
    ).toBeVisible();
    await expect(
      page.locator('[data-slot="card-title"]', { hasText: "Webhooks" })
    ).toBeVisible();
  });

  test("should navigate to API reference page", async ({ page }) => {
    await page.goto("/en/docs");

    // Click on the API Reference card
    await page
      .locator('[data-slot="card"]', { hasText: "API Reference" })
      .click();
    await expect(page).toHaveURL(/docs\/api-reference/);

    await expect(page.locator("h1")).toContainText("API Reference");
  });

  test("should navigate to guides page", async ({ page }) => {
    await page.goto("/en/docs");

    // Click on the Integration Guides card
    await page
      .locator('[data-slot="card"]', { hasText: "Integration Guides" })
      .click();
    await expect(page).toHaveURL(/docs\/guides/);

    await expect(page.locator("h1")).toContainText("Integration Guides");
  });

  test("should navigate to webhooks page via card", async ({ page }) => {
    await page.goto("/en/docs");

    // Click on the Webhooks card
    await page.locator('[data-slot="card"]', { hasText: "Webhooks" }).click();
    await expect(page).toHaveURL(/docs\/webhooks/);

    await expect(page.locator("h1")).toContainText("Webhooks");
  });

  test("should display API endpoints on API reference page", async ({
    page,
  }) => {
    await page.goto("/en/docs/api-reference");

    // Path is in code element, method in span - look for sections by their heading
    await expect(page.getByRole("heading", { name: "Reservations" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Webhook Management" })).toBeVisible();

    // Look for endpoint paths in code elements
    await expect(
      page.locator("code", { hasText: "/integration/reservations" }).first()
    ).toBeVisible();
  });

  test("should display webhook events on webhooks page", async ({ page }) => {
    await page.goto("/en/docs/webhooks");

    // Should show webhook event types - use exact matching
    await expect(
      page.getByText("reservation.created", { exact: true }).first()
    ).toBeVisible();
    await expect(
      page.getByText("reservation.updated", { exact: true }).first()
    ).toBeVisible();
    await expect(
      page.getByText("reservation.cancelled", { exact: true }).first()
    ).toBeVisible();
    await expect(
      page.getByText("client.created", { exact: true }).first()
    ).toBeVisible();
    await expect(
      page.getByText("client.updated", { exact: true }).first()
    ).toBeVisible();
  });

  test("should work with French locale", async ({ page }) => {
    await page.goto("/fr/docs");

    // French title
    await expect(page.locator("h1")).toContainText(
      "Documentation d'intégration Spalf"
    );
  });

  test("should display quick links on landing page", async ({ page }) => {
    await page.goto("/en/docs");

    // Quick links section
    await expect(
      page.getByRole("heading", { name: "Quick Links" })
    ).toBeVisible();
    await expect(
      page.locator("h3", { hasText: "Create a Reservation" })
    ).toBeVisible();
    await expect(
      page.locator("h3", { hasText: "Set Up Webhooks" })
    ).toBeVisible();
    await expect(
      page.locator("h3", { hasText: "Authentication" })
    ).toBeVisible();
    await expect(
      page.locator("h3", { hasText: "Webhook Events" })
    ).toBeVisible();
  });

  test("should display guides content", async ({ page }) => {
    await page.goto("/en/docs/guides");

    // Should show guide sections
    await expect(page.getByText("Getting Started")).toBeVisible();
    await expect(page.getByText("Setting Up Webhooks")).toBeVisible();
    await expect(page.getByText("Syncing Reservations")).toBeVisible();
  });
});
