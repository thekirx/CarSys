import { expect, test } from "@playwright/test";
test("Owner can open user settings", async ({ page }) => { await page.goto("/auth/demo?role=owner"); await page.goto("/settings/users"); await expect(page.getByRole("heading", { name: "Users & access" })).toBeVisible(); });
test("Sales Agent is denied settings", async ({ page }) => { await page.goto("/auth/demo?role=sales-agent"); await page.goto("/settings/company"); await expect(page.getByRole("heading", { name: "Access restricted" })).toBeVisible(); });
