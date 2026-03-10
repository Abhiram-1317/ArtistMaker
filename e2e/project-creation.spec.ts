import { test, expect } from "@playwright/test";

test.describe("Project Creation Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Login with demo credentials
    await page.goto("/login");
    await page.locator('input[type="email"]').fill("demo@genesis.ai");
    await page.locator('input[type="password"]').fill("Demo1234!");
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/dashboard/, { timeout: 10000 });
  });

  test("should navigate to new project wizard", async ({ page }) => {
    await page.goto("/projects/new");
    // Should show the wizard
    await expect(page.getByText(/concept/i)).toBeVisible();
  });

  test("should complete project wizard steps", async ({ page }) => {
    await page.goto("/projects/new");

    // Step 1: Concept
    await page.locator('input[placeholder*="title" i]').fill("Test Movie");
    await page.locator('textarea').first().fill("A test movie for E2E testing");

    // Navigate to next step
    const nextButton = page.getByRole("button", { name: /next/i });
    if (await nextButton.isVisible()) {
      await nextButton.click();
    }
  });

  test("should show project list on dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    // Dashboard should load
    await expect(page.locator("main")).toBeVisible();
  });
});
