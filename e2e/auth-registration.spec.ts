import { test, expect } from "@playwright/test";

test.describe("User Registration Flow", () => {
  test("should display registration form", async ({ page }) => {
    await page.goto("/register");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /create account/i })).toBeVisible();
  });

  test("should show password strength indicator", async ({ page }) => {
    await page.goto("/register");
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.fill("weak");
    // Weak password should show red indicator
    await expect(page.locator(".bg-red-500")).toBeVisible();

    await passwordInput.fill("StrongPass1!");
    // Strong password should show green indicator
    await expect(page.locator(".bg-emerald-500")).toBeVisible();
  });

  test("should validate required fields", async ({ page }) => {
    await page.goto("/register");
    await page.getByRole("button", { name: /create account/i }).click();
    // Form should not submit with empty fields
    await expect(page).toHaveURL(/register/);
  });
});
