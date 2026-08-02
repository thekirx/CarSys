import { describe, expect, it } from "vitest";
import { unstable_doesMiddlewareMatch as unstable_doesProxyMatch } from "next/experimental/testing/server";
import { NextResponse } from "next/server";

import {
  createSignInRedirectResponse,
  isProtectedApplicationPath,
} from "@/features/auth/proxy-policy";
import { config } from "@/proxy";

describe("protected application path classification", () => {
  it.each([
    "/dashboard",
    "/dashboard/overview",
    "/vehicles",
    "/reports/monthly",
    "/audit-logs",
    "/settings/company",
    "/unauthorized",
    "/access-unavailable",
  ])("classifies %s as protected", (pathname) => {
    expect(isProtectedApplicationPath(pathname)).toBe(true);
  });

  it.each([
    "/",
    "/sign-in",
    "/auth/callback",
    "/dashboard-external",
    "/_next/static/file.js",
    "/logo.png",
  ])("does not classify %s as protected", (pathname) => {
    expect(isProtectedApplicationPath(pathname)).toBe(false);
  });
});

describe("Proxy matcher", () => {
  it.each([
    "/dashboard",
    "/sign-in",
    "/auth/callback",
    "/settings/company",
  ])("runs for application route %s", (url) => {
    expect(unstable_doesProxyMatch({ config, url })).toBe(true);
  });

  it.each([
    "/settings/export.js",
    "/dashboard/theme.css",
    "/vehicles/photos/primary.png",
    "/access-unavailable/status.css",
  ])("still runs for protected extension-looking route %s", (url) => {
    expect(unstable_doesProxyMatch({ config, url })).toBe(true);
  });

  it.each([
    "/_next/static/chunk.js",
    "/_next/image?url=%2Flogo.png&w=640&q=75",
    "/images/logo.png",
    "/fonts/geist.woff2",
    "/favicon.ico",
  ])("skips ordinary static asset %s", (url) => {
    expect(unstable_doesProxyMatch({ config, url })).toBe(false);
  });
});

describe("createSignInRedirectResponse", () => {
  it("keeps the safe return path plus refreshed cookies and cache headers", () => {
    const refreshedResponse = NextResponse.next();
    refreshedResponse.cookies.set("sb-auth", "refreshed", {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
    });
    refreshedResponse.headers.set("cache-control", "private, no-store");
    refreshedResponse.headers.set("expires", "0");

    const redirect = createSignInRedirectResponse(
      new URL("https://carsys.example/dashboard?view=alerts"),
      refreshedResponse,
    );

    expect(redirect.status).toBe(307);
    expect(redirect.headers.get("location")).toBe(
      "https://carsys.example/sign-in?next=%2Fdashboard%3Fview%3Dalerts",
    );
    expect(redirect.headers.get("cache-control")).toBe("private, no-store");
    expect(redirect.headers.get("expires")).toBe("0");
    expect(redirect.cookies.get("sb-auth")).toMatchObject({
      name: "sb-auth",
      value: "refreshed",
      httpOnly: true,
      path: "/",
      sameSite: "lax",
    });
  });

  it("does not copy internal Next routing headers onto the redirect", () => {
    const refreshedResponse = NextResponse.next();
    refreshedResponse.headers.set("x-middleware-next", "1");

    const redirect = createSignInRedirectResponse(
      new URL("https://carsys.example/dashboard"),
      refreshedResponse,
    );

    expect(redirect.headers.has("x-middleware-next")).toBe(false);
  });
});
