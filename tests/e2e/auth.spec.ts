import { expect, test } from "@playwright/test";
test("redirects an unauthenticated visitor to sign in when Supabase mode is active", async ({ page }) => { await page.goto("/sign-in"); await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible(); });
