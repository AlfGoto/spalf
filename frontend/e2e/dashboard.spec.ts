import { test, expect } from "./fixtures/auth";

test.describe("Dashboard - Employees Page", () => {
  test("should display employees page when authenticated", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/employees");
    await authenticatedPage.waitForLoadState("networkidle");

    // Should show the page title
    await expect(authenticatedPage.locator("h1")).toContainText("Employees");

    // Should show the description
    await expect(
      authenticatedPage.locator("text=Manage your spa employees")
    ).toBeVisible();

    // Should show the Add Employee button
    await expect(
      authenticatedPage.getByRole("button", { name: /Add Employee/i })
    ).toBeVisible();
  });

  test("should open employee form when clicking Add Employee", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/employees");
    await authenticatedPage.waitForLoadState("networkidle");

    // Wait for Add Employee button and click
    await authenticatedPage
      .getByRole("button", { name: /Add Employee/i })
      .click();

    // Dialog should open with form title
    await expect(
      authenticatedPage.locator('[role="dialog"]')
    ).toBeVisible();
    await expect(
      authenticatedPage.locator('[role="dialog"]').locator("text=Add Employee")
    ).toBeVisible();

    // Form fields should be visible
    await expect(
      authenticatedPage.getByLabel(/First Name/i)
    ).toBeVisible();
    await expect(
      authenticatedPage.getByLabel(/Last Name/i)
    ).toBeVisible();
    await expect(authenticatedPage.getByLabel(/Email/i)).toBeVisible();
  });

  test("should close employee form when clicking Cancel", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/employees");
    await authenticatedPage.waitForLoadState("networkidle");

    // Open the form
    await authenticatedPage
      .getByRole("button", { name: /Add Employee/i })
      .click();
    await expect(
      authenticatedPage.locator('[role="dialog"]')
    ).toBeVisible();

    // Click Cancel
    await authenticatedPage.getByRole("button", { name: /Cancel/i }).click();

    // Dialog should close
    await expect(
      authenticatedPage.locator('[role="dialog"]')
    ).not.toBeVisible();
  });

  test("should display employees page in French", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/fr/employees");
    await authenticatedPage.waitForLoadState("networkidle");

    // French title for employees in the nav
    await expect(authenticatedPage.locator("h1")).toContainText("Employés");
  });
});

test.describe("Dashboard - Rooms Page", () => {
  test("should display rooms page when authenticated", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/rooms");
    await authenticatedPage.waitForLoadState("networkidle");

    // Should show the page title
    await expect(authenticatedPage.locator("h1")).toContainText("Rooms");

    // Should show the Add Room button
    await expect(
      authenticatedPage.getByRole("button", { name: /Add Room/i })
    ).toBeVisible();
  });

  test("should open room form when clicking Add Room", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/rooms");
    await authenticatedPage.waitForLoadState("networkidle");

    await authenticatedPage.getByRole("button", { name: /Add Room/i }).click();

    // Dialog should open
    await expect(
      authenticatedPage.locator('[role="dialog"]')
    ).toBeVisible();

    // Form fields should be visible
    await expect(authenticatedPage.getByLabel(/Name/i)).toBeVisible();
    await expect(
      authenticatedPage.getByLabel(/Minimum Capacity/i)
    ).toBeVisible();
    await expect(
      authenticatedPage.getByLabel(/Maximum Capacity/i)
    ).toBeVisible();
  });
});

test.describe("Dashboard - Products Page", () => {
  test("should display products page when authenticated", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/products");
    await authenticatedPage.waitForLoadState("networkidle");

    // Should show the page title
    await expect(authenticatedPage.locator("h1")).toContainText("Products");

    // Should show the Add Product button
    await expect(
      authenticatedPage.getByRole("button", { name: /Add Product/i })
    ).toBeVisible();
  });
});

test.describe("Dashboard - Services Page", () => {
  test("should display services page when authenticated", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/services");
    await authenticatedPage.waitForLoadState("networkidle");

    // Should show the page title
    await expect(authenticatedPage.locator("h1")).toContainText("Services");

    // Should show the Add Service button
    await expect(
      authenticatedPage.getByRole("button", { name: /Add Service/i })
    ).toBeVisible();
  });
});

test.describe("Dashboard - Clients Page", () => {
  test("should display clients page when authenticated", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/clients");
    await authenticatedPage.waitForLoadState("networkidle");

    // Should show the page title
    await expect(authenticatedPage.locator("h1")).toContainText("Clients");

    // Should show the Add Client button
    await expect(
      authenticatedPage.getByRole("button", { name: /Add Client/i })
    ).toBeVisible();

    // Should show the search input
    await expect(
      authenticatedPage.getByPlaceholder(/Search/i)
    ).toBeVisible();
  });
});

test.describe("Dashboard - Closures Page", () => {
  test("should display closures page when authenticated", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/closures");
    await authenticatedPage.waitForLoadState("networkidle");

    // Should show the page title
    await expect(authenticatedPage.locator("h1")).toContainText("Closures");

    // Should show the Add Closure button
    await expect(
      authenticatedPage.getByRole("button", { name: /Add Closure/i })
    ).toBeVisible();
  });
});
