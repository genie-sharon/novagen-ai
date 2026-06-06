import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("login form is visible", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("signup link navigates to signup", async ({ page }) => {
    await page.goto("/login");
    await page.getByText("Sign up").click();
    await expect(page).toHaveURL(/\/signup/);
  });

  test("validation message for invalid input", async ({ page }) => {
    // Native HTML5 validation prevents submission of empty form
    await page.goto("/login");
    await page.getByRole("button", { name: /sign in/i }).click();
    // The email input should show validation message
    const emailInput = page.getByLabel("Email");
    const validationMessage = await emailInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    );
    expect(validationMessage).toBeTruthy();
  });
});
