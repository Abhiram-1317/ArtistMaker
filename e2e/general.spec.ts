import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("should load landing page", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Project Genesis/i);
  });

  test("should show hero section", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText(/cinematic/i).first()).toBeVisible();
    await expect(page.getByText(/movies with ai/i).first()).toBeVisible();
  });

  test("should navigate to register from CTA", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /get started/i }).first().click();
    await expect(page).toHaveURL(/register/);
  });

  test("should have working navigation links", async ({ page }) => {
    await page.goto("/");
    // Check Sign In link
    await expect(page.getByRole("link", { name: /sign in/i }).first()).toBeVisible();
  });

  test("should show showcase section", async ({ page }) => {
    await page.goto("/");
    const showcase = page.locator("#showcase");
    await showcase.scrollIntoViewIfNeeded();
    await expect(showcase).toBeVisible();
  });
});

test.describe("SEO", () => {
  test("should have proper meta tags", async ({ page }) => {
    await page.goto("/");
    const description = await page.locator('meta[name="description"]').getAttribute("content");
    expect(description).toContain("AI");
  });

  test("should serve robots.txt", async ({ page }) => {
    const response = await page.goto("/robots.txt");
    expect(response?.status()).toBe(200);
  });

  test("should serve sitemap.xml", async ({ page }) => {
    const response = await page.goto("/sitemap.xml");
    expect(response?.status()).toBe(200);
  });
});

test.describe("Error Pages", () => {
  test("should show 404 page for invalid routes", async ({ page }) => {
    await page.goto("/this-page-does-not-exist");
    await expect(page.getByText(/scene not found/i)).toBeVisible();
  });
});

test.describe("Legal Pages", () => {
  test("should load privacy policy", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.getByText(/privacy policy/i).first()).toBeVisible();
  });

  test("should load terms of service", async ({ page }) => {
    await page.goto("/terms");
    await expect(page.getByText(/terms of service/i).first()).toBeVisible();
  });
});
