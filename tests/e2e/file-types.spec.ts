import { test, expect } from "@playwright/test";
import path from "node:path";

const FIXTURES_DIR = path.resolve("tests/fixtures");

test.describe("Supported file types", () => {
  test("TXT file shows in the paperclip selector", async ({ page }) => {
    await page.goto("/chat");
    const fileInput = page.locator('input[type="file"]');

    // Verify accepted extensions
    const accept = await fileInput.getAttribute("accept");
    expect(accept).toContain(".txt");
    expect(accept).toContain(".csv");
    expect(accept).toContain(".docx");
    expect(accept).toContain(".pdf");
  });

  test("unsupported .doc file would be rejected client-side", async ({ page }) => {
    // This is a structural test verifying the file input accept attribute
    // does not include .doc
    await page.goto("/chat");
    const fileInput = page.locator('input[type="file"]');
    const accept = await fileInput.getAttribute("accept");
    expect(accept).not.toContain(".doc");
  });
});
