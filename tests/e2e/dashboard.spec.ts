import { expect, test } from "@playwright/test";
test("Owner sees dashboard financial summary", async ({ page }) => { await page.goto("/auth/demo?role=owner"); await expect(page.getByText("Inventory capital overview")).toBeVisible(); await expect(page.getByText("₱21,800,000")).toBeVisible(); });
test("Sales Agent does not receive sensitive financial values", async ({ page }) => { await page.goto("/auth/demo?role=sales-agent"); await expect(page.getByText("Restricted")).toBeVisible(); await expect(page.getByText("₱21,800,000")).toHaveCount(0); });
