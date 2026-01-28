import { test, expect } from "./fixtures/auth";

test.describe("Reservations Page", () => {
  test("should display reservations page when authenticated", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/reservations");
    await authenticatedPage.waitForLoadState("networkidle");

    // Should show the page title
    await expect(authenticatedPage.locator("h1")).toContainText("Reservations");

    // Should show the description
    await expect(
      authenticatedPage.locator("text=Manage your spa reservations")
    ).toBeVisible();

    // Should show the Add Reservation button
    await expect(
      authenticatedPage.getByRole("button", { name: /Add Reservation/i })
    ).toBeVisible();
  });

  test("should display view mode toggle buttons", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/reservations");
    await authenticatedPage.waitForLoadState("networkidle");

    // Should show List view button
    await expect(
      authenticatedPage.getByRole("button", { name: /List/i })
    ).toBeVisible();

    // Should show Calendar view button
    await expect(
      authenticatedPage.getByRole("button", { name: /Calendar/i })
    ).toBeVisible();
  });

  test("should default to calendar view", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/en/reservations");
    await authenticatedPage.waitForLoadState("networkidle");

    // Calendar view should be visible (it shows week navigation)
    await expect(
      authenticatedPage.getByRole("button", { name: /Today/i })
    ).toBeVisible();
  });

  test("should switch to list view when clicking List button", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/reservations");
    await authenticatedPage.waitForLoadState("networkidle");

    // Click List view button
    await authenticatedPage.getByRole("button", { name: /List/i }).click();

    // Wait for view to update
    await authenticatedPage.waitForTimeout(500);

    // Table should be visible in list view (or "no reservations" message)
    const hasTable = await authenticatedPage.locator("table").isVisible();
    const hasNoReservationsMessage = await authenticatedPage
      .locator("text=No reservations found")
      .isVisible();

    expect(hasTable || hasNoReservationsMessage).toBeTruthy();
  });

  test("should switch back to calendar view when clicking Calendar button", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/reservations");
    await authenticatedPage.waitForLoadState("networkidle");

    // First switch to list view
    await authenticatedPage.getByRole("button", { name: /List/i }).click();
    await authenticatedPage.waitForTimeout(300);

    // Then switch back to calendar view
    await authenticatedPage.getByRole("button", { name: /Calendar/i }).click();
    await authenticatedPage.waitForTimeout(300);

    // Calendar elements should be visible
    await expect(
      authenticatedPage.getByRole("button", { name: /Today/i })
    ).toBeVisible();
  });

  test("should open reservation form when clicking Add Reservation", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/reservations");
    await authenticatedPage.waitForLoadState("networkidle");

    // Click Add Reservation button
    await authenticatedPage
      .getByRole("button", { name: /Add Reservation/i })
      .click();

    // Dialog should open
    await expect(
      authenticatedPage.locator('[role="dialog"]')
    ).toBeVisible();
    await expect(
      authenticatedPage
        .locator('[role="dialog"]')
        .locator("text=Add Reservation")
    ).toBeVisible();
  });

  test("should show form fields in reservation dialog", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/reservations");
    await authenticatedPage.waitForLoadState("networkidle");

    // Open the form
    await authenticatedPage
      .getByRole("button", { name: /Add Reservation/i })
      .click();

    // Wait for dialog to be visible
    await expect(
      authenticatedPage.locator('[role="dialog"]')
    ).toBeVisible();

    // Check for form labels - use specific label elements
    await expect(
      authenticatedPage.locator('[role="dialog"]').locator('label:has-text("Service")')
    ).toBeVisible();
    await expect(
      authenticatedPage.locator('[role="dialog"]').locator('label:has-text("Client")')
    ).toBeVisible();
    await expect(
      authenticatedPage.locator('[role="dialog"]').locator('label:has-text("Date")')
    ).toBeVisible();
  });

  test("should close reservation form when clicking Cancel", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/reservations");
    await authenticatedPage.waitForLoadState("networkidle");

    // Open the form
    await authenticatedPage
      .getByRole("button", { name: /Add Reservation/i })
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

  test("should display reservations page in French", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/fr/reservations");
    await authenticatedPage.waitForLoadState("networkidle");

    // French title
    await expect(authenticatedPage.locator("h1")).toContainText("Réservations");

    // French buttons
    await expect(
      authenticatedPage.getByRole("button", { name: /Ajouter/i })
    ).toBeVisible();
  });
});

test.describe("Calendar Week Navigation", () => {
  test("should navigate to previous week", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/en/reservations");
    await authenticatedPage.waitForLoadState("networkidle");

    // Get initial date display (the header shows the week dates)
    const initialDateText = await authenticatedPage
      .locator("h2.text-lg")
      .first()
      .textContent();

    // Click previous week button (chevron-left icon)
    await authenticatedPage
      .locator("button")
      .filter({ has: authenticatedPage.locator("svg.lucide-chevron-left") })
      .click();

    await authenticatedPage.waitForTimeout(300);

    // Date should have changed
    const newDateText = await authenticatedPage
      .locator("h2.text-lg")
      .first()
      .textContent();

    // The text should be different (previous week)
    expect(newDateText).not.toBe(initialDateText);
  });

  test("should navigate to next week", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/en/reservations");
    await authenticatedPage.waitForLoadState("networkidle");

    // Get initial date display
    const initialDateText = await authenticatedPage
      .locator("h2.text-lg")
      .first()
      .textContent();

    // Click next week button (chevron-right icon)
    await authenticatedPage
      .locator("button")
      .filter({ has: authenticatedPage.locator("svg.lucide-chevron-right") })
      .click();

    await authenticatedPage.waitForTimeout(300);

    // Date should have changed
    const newDateText = await authenticatedPage
      .locator("h2.text-lg")
      .first()
      .textContent();

    expect(newDateText).not.toBe(initialDateText);
  });

  test("should return to current week when clicking Today", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/reservations");
    await authenticatedPage.waitForLoadState("networkidle");

    // Navigate away from current week
    await authenticatedPage
      .locator("button")
      .filter({ has: authenticatedPage.locator("svg.lucide-chevron-left") })
      .click();
    await authenticatedPage.waitForTimeout(300);

    await authenticatedPage
      .locator("button")
      .filter({ has: authenticatedPage.locator("svg.lucide-chevron-left") })
      .click();
    await authenticatedPage.waitForTimeout(300);

    // Click Today button
    await authenticatedPage.getByRole("button", { name: /Today/i }).click();
    await authenticatedPage.waitForTimeout(300);

    // Should show current date somewhere in the header
    const today = new Date();
    const currentMonthYear = today.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });

    // The calendar header should contain the current month/year
    await expect(
      authenticatedPage.locator("h2.text-lg").first()
    ).toContainText(currentMonthYear.split(" ")[0]); // At least the month
  });

  test("should display weekday headers in calendar", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/reservations");
    await authenticatedPage.waitForLoadState("networkidle");

    // Should show all weekday abbreviations
    const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    for (const day of weekdays) {
      await expect(
        authenticatedPage.locator(`text=${day}`).first()
      ).toBeVisible();
    }
  });
});

test.describe("Sidebar Navigation", () => {
  test("should have working navigation links", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/reservations");
    await authenticatedPage.waitForLoadState("networkidle");

    // Navigate to employees via sidebar
    await authenticatedPage.getByRole("link", { name: /Employees/i }).click();
    await expect(authenticatedPage).toHaveURL(/employees/);

    // Navigate to rooms
    await authenticatedPage.getByRole("link", { name: /Rooms/i }).click();
    await expect(authenticatedPage).toHaveURL(/rooms/);

    // Navigate back to reservations
    await authenticatedPage
      .getByRole("link", { name: /Reservations/i })
      .click();
    await expect(authenticatedPage).toHaveURL(/reservations/);
  });

  test("should highlight active navigation item", async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto("/en/employees");
    await authenticatedPage.waitForLoadState("networkidle");

    // The employees link should have an active state (bg-neutral-100)
    const employeesLink = authenticatedPage.getByRole("link", {
      name: /Employees/i,
    });
    await expect(employeesLink).toHaveClass(/bg-neutral-100/);
  });
});
