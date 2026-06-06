import { test, expect } from "@playwright/test";

test.describe("Thread behavior", () => {
  test("New Chat button exists", async ({ page }) => {
    await page.goto("/chat");
    await expect(page.getByText("New Chat")).toBeVisible();
  });
});
