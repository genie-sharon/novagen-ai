import { test, expect } from "@playwright/test";

test.describe("Chat", () => {
  test("chat page shows NovaGen heading", async ({ page }) => {
    await page.goto("/chat");
    await expect(page.getByText("NovaGen")).toBeVisible();
  });

  test("compact attachment composer has paperclip button", async ({ page }) => {
    await page.goto("/chat");
    await expect(page.getByLabel("Attach document")).toBeVisible();
  });

  test("Send button is visible on chat page", async ({ page }) => {
    await page.goto("/chat");
    await expect(page.getByRole("button", { name: /send/i })).toBeVisible();
  });

  test("textarea is visible", async ({ page }) => {
    await page.goto("/chat");
    await expect(page.getByPlaceholder(/type a message/i)).toBeVisible();
  });
});
