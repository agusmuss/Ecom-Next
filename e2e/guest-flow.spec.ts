import { test, expect } from "@playwright/test";

test("guest can navigate core pages", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "MiniCommerce" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Products" })).toBeVisible();
  await expect(page.getByRole("link", { name: /cart/i })).toBeVisible();

  await page.getByRole("link", { name: "Products" }).click();
  await expect(page.getByRole("heading", { name: "Products" })).toBeVisible();

  await page.getByRole("link", { name: /cart/i }).click();
  await expect(page.getByRole("heading", { name: "Cart" })).toBeVisible();
  await expect(page.getByText("Your cart is empty.")).toBeVisible();

  await page.getByRole("link", { name: "Home" }).click();
  await expect(page.getByRole("heading", { name: /Build the next generation/i })).toBeVisible();
});
