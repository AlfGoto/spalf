import { test as base, type Page } from "@playwright/test";

// Extend Playwright test to add authenticated page fixture
export const test = base.extend<{ authenticatedPage: Page }>({
  authenticatedPage: async ({ browser }, use) => {
    // Create a new context with the test cookie already set
    const context = await browser.newContext();

    // Set the E2E test cookie to simulate authentication
    await context.addCookies([
      {
        name: "spalf.e2e_test",
        value: "authenticated",
        url: "http://localhost:3000",
      },
    ]);

    const page = await context.newPage();
    await use(page);

    // Cleanup
    await context.close();
  },
});

export { expect } from "@playwright/test";
