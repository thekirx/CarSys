import { expect, test, type Page } from "@playwright/test";

async function openDashboardAs(page: Page, role: "owner" | "sales-agent") {
  await page.goto(`/auth/demo?role=${role}`);

  await expect
    .poll(async () => {
      const cookies = await page.context().cookies();
      return cookies.find((cookie) => cookie.name === "carsys_demo_role")?.value;
    })
    .toBe(role);

  await page.goto("/dashboard");
}

test("Owner sees dashboard financial summary", async ({ page }) => {
  await openDashboardAs(page, "owner");
  await expect(page.getByText("Inventory capital overview")).toBeVisible();
  await expect(page.getByText("₱21,800,000")).toBeVisible();
});

test("Sales Agent does not receive sensitive financial values", async ({ page }) => {
  await openDashboardAs(page, "sales-agent");
  await expect(page.getByText("Restricted", { exact: true })).toBeVisible();
  await expect(page.getByText("₱21,800,000")).toHaveCount(0);
});
