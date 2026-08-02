import { expect, test } from "@playwright/test";

test("redirects an unauthenticated dashboard visitor to sign-in with a safe return path", async ({
  page,
}) => {
  await page.goto("/dashboard?view=alerts");

  await expect(page).toHaveURL(
    /\/sign-in\?next=%2Fdashboard%3Fview%3Dalerts$/,
  );
  await expect(
    page.getByRole("heading", { name: "Welcome to Apex Autohaus" }),
  ).toBeVisible();
});

test("renders an accessible sign-in form and reports malformed input generically", async ({
  page,
}, testInfo) => {
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      browserErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));

  await page.goto("/sign-in");

  const email = page.getByRole("textbox", { name: "Email address" });
  const password = page.getByLabel("Password");
  const submit = page.getByRole("button", { name: "Sign in" });

  await expect(email).toHaveAttribute("autocomplete", "email");
  await expect(password).toHaveAttribute("autocomplete", "current-password");
  await expect(page.getByText("Trusted bootstrap required")).toBeVisible();
  await expect(
    page.getByRole("complementary", { name: "Demo role reference" }),
  ).not.toContainText(/demo-password|service[_ -]?role|secret key/i);
  await page.screenshot({
    path: testInfo.outputPath("sign-in.png"),
    fullPage: true,
  });

  await email.focus();
  await expect(email).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(password).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(submit).toBeFocused();

  await email.fill("not-an-email");
  await submit.click();

  await expect(page.getByText("Enter a valid email address")).toBeVisible();
  await expect(page.getByText("Enter your password")).toBeVisible();
  await expect(page.locator("body")).not.toContainText(
    /AuthApiError|User not found|invalid login credentials/i,
  );
  expect(browserErrors).toEqual([]);
});

test("never follows an external or malformed return path", async ({ page }) => {
  await page.goto(
    "/auth/callback?next=https%3A%2F%2Fexample.com%2Fsteal-session",
  );

  await expect(page).toHaveURL(/\/sign-in\?error=authentication$/);
  expect(new URL(page.url()).origin).toMatch(
    /^http:\/\/(?:127\.0\.0\.1|localhost):3000$/,
  );

  await page.goto("/sign-in?next=%2F%2Fexample.com%2Fdashboard");
  await expect(page.locator('input[name="next"]')).toHaveValue("/dashboard");
  expect(new URL(page.url()).origin).toMatch(
    /^http:\/\/(?:127\.0\.0\.1|localhost):3000$/,
  );
});
