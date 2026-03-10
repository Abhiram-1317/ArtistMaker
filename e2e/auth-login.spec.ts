import { test, expect } from "@playwright/test";

test.describe("Login Flow", () => {
  test("should display login form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("should login with demo credentials", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill("demo@genesis.ai");
    await page.locator('input[type="password"]').fill("Demo1234!");
    await page.getByRole("button", { name: /sign in/i }).click();
    // Should redirect to dashboard after login
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    await expect(page).toHaveURL(/dashboard/);
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill("wrong@email.com");
    await page.locator('input[type="password"]').fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();
    // Should show error message
    await expect(page.locator("text=Invalid")).toBeVisible({ timeout: 5000 });
  });
});
