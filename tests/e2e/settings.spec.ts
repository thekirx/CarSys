import { expect, test } from "@playwright/test";
test("disabled future modules stay inside Owner settings", async ({ page }) => { await page.goto("/auth/demo?role=owner"); await page.goto("/settings/modules"); await expect(page.getByText("Fleet Management")).toBeVisible(); await expect(page.getByRole("link", { name: "Fleet Management" })).toHaveCount(0); });
