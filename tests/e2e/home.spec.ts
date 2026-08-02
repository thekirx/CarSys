import { expect, test } from "@playwright/test";

test("renders the CarSys home page", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "CarSys" })).toBeVisible();
});
