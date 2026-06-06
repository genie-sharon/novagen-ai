import { test, expect } from "@playwright/test";

test.describe("Branding", () => {
  test("NovaGen logo appears on login page", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("NovaGen")).toBeVisible();
  });

  test("old Rosé branding does not appear", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Rosé")).not.toBeVisible();
  });

  test("browser title includes NovaGen", async ({ page }) => {
    await page.goto("/login");
    const title = await page.title();
    expect(title).toContain("NovaGen");
  });
});
