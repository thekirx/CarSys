import { describe, expect, it } from "vitest";

import {
  DEFAULT_AUTHENTICATED_PATH,
  getSafeInternalPath,
} from "@/features/auth/safe-redirect";

describe("getSafeInternalPath", () => {
  it.each([
    ["dashboard", "/dashboard", "/dashboard"],
    ["dashboard child", "/dashboard/overview", "/dashboard/overview"],
    ["settings query", "/settings/company?tab=details", "/settings/company?tab=details"],
    ["encoded safe path", "%2Fvehicles%3Fstatus%3Davailable", "/vehicles?status=available"],
    ["reports hash", "/reports#monthly", "/reports#monthly"],
    ["audit log child", "/audit-logs/entry-1", "/audit-logs/entry-1"],
  ])("allows the protected %s path", (_, value, expected) => {
    expect(getSafeInternalPath(value)).toBe(expected);
  });

  it.each([
    ["missing", undefined],
    ["non-string", ["/dashboard"]],
    ["empty", ""],
    ["relative", "dashboard"],
    ["external origin", "https://example.com/dashboard"],
    ["protocol relative", "//example.com/dashboard"],
    ["encoded protocol relative", "%2F%2Fexample.com%2Fdashboard"],
    ["double-encoded protocol relative", "%252F%252Fexample.com%252Fdashboard"],
    ["backslash", "/dashboard\\example"],
    ["encoded backslash", "/dashboard%5Cexample"],
    ["control character", "/dashboard\nnext"],
    ["encoded control character", "/dashboard%0d%0aLocation%3A%20https%3A%2F%2Fexample.com"],
    ["malformed encoding", "/dashboard%2"],
    ["dot-segment escape", "/dashboard/%2e%2e/sign-in"],
    ["sign-in loop", "/sign-in?next=/dashboard"],
    ["callback loop", "/auth/callback?next=/dashboard"],
    ["unauthorized loop", "/unauthorized"],
    ["unprotected home", "/"],
    ["lookalike prefix", "/dashboard-external"],
  ])("rejects the %s bypass", (_, value) => {
    expect(getSafeInternalPath(value)).toBe(DEFAULT_AUTHENTICATED_PATH);
  });
});
