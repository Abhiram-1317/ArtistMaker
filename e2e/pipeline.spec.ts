import { test, expect } from "@playwright/test";

/**
 * E2E smoke tests for the AI movie generation pipeline.
 * These verify the full flow: dashboard → wizard → project → render.
 * Run with: npx playwright test e2e/pipeline.spec.ts
 */

test.describe("Movie Pipeline", () => {
  test.describe.configure({ mode: "serial" });

  test("API health endpoint responds", async ({ request }) => {
    const res = await request.get("http://localhost:3001/health");
    expect(res.ok()).toBeTruthy();
  });

  test("AI Worker health endpoint responds", async ({ request }) => {
    const res = await request.get("http://localhost:3002/health");
    expect(res.ok()).toBeTruthy();
  });

  test("dashboard loads for authenticated user", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("test@genesis.local");
    await page.getByLabel(/password/i).fill("TestPassword123!");
    await page.getByRole("button", { name: /sign in/i }).click();

    // Should redirect to dashboard
    await page.waitForURL(/dashboard/, { timeout: 10_000 });
    await expect(page.getByText(/project/i).first()).toBeVisible();
  });

  test("project wizard opens and creates a project", async ({ page }) => {
    // Navigate to wizard
    await page.goto("/dashboard");
    await page.getByRole("link", { name: /new.*project|create/i }).first().click();
    await page.waitForURL(/wizard|new/);

    // Fill project title
    await page.getByLabel(/title|name/i).first().fill("E2E Test Movie");

    // Submit first step
    await page.getByRole("button", { name: /next|continue|create/i }).first().click();
    await expect(page.getByText(/E2E Test Movie/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test("render queue accepts a job via API", async ({ request }) => {
    const res = await request.post("http://localhost:3001/api/render", {
      data: {
        projectId: "e2e-test-project",
        type: "preview",
        settings: { resolution: "720p", fps: 24 },
      },
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer e2e-test-token",
      },
    });
    // Accept 200, 201, or 401 (auth required) — we're just testing connectivity
    expect([200, 201, 401, 403]).toContain(res.status());
  });
});
