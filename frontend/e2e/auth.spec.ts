import { test, expect } from "@playwright/test";

test.describe("Authentication Pages", () => {
  test("should display login page", async ({ page }) => {
    await page.goto("/en/login");

    // CardTitle contains "Login"
    await expect(page.locator('[data-slot="card-title"]')).toContainText(
      "Login"
    );
    // Button with sign in text
    await expect(
      page.getByRole("button", { name: /Sign in with your account/i })
    ).toBeVisible();
  });

  test("should have link to register page on login page", async ({ page }) => {
    await page.goto("/en/login");

    const registerLink = page.getByRole("link", { name: /Register/i });
    await expect(registerLink).toBeVisible();
    await registerLink.click();

    await expect(page).toHaveURL(/register/);
  });

  test("should display register page", async ({ page }) => {
    await page.goto("/en/register");

    // CardTitle contains "Register"
    await expect(page.locator('[data-slot="card-title"]')).toContainText(
      "Register"
    );
    // Button with continue to register text
    await expect(
      page.getByRole("button", { name: /Continue to register/i })
    ).toBeVisible();
  });

  test("should have link to login page on register page", async ({ page }) => {
    await page.goto("/en/register");

    const loginLink = page.getByRole("link", { name: /Login/i });
    await expect(loginLink).toBeVisible();
    await loginLink.click();

    await expect(page).toHaveURL(/login/);
  });

  test("should redirect unauthenticated users to login from dashboard", async ({
    page,
  }) => {
    await page.goto("/en/employees");

    // Should redirect to login page
    await expect(page).toHaveURL(/login/);
  });

  test("should redirect unauthenticated users to login from reservations", async ({
    page,
  }) => {
    await page.goto("/en/reservations");

    await expect(page).toHaveURL(/login/);
  });

  test("should work with French locale", async ({ page }) => {
    await page.goto("/fr/login");

    // French title is "Connexion"
    await expect(page.locator('[data-slot="card-title"]')).toContainText(
      "Connexion"
    );
  });

  test("should display French register page", async ({ page }) => {
    await page.goto("/fr/register");

    // French title is "Inscription"
    await expect(page.locator('[data-slot="card-title"]')).toContainText(
      "Inscription"
    );
  });
});
