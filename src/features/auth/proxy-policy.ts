import { NextResponse } from "next/server";

import { getSafeInternalPath } from "@/features/auth/safe-redirect";

const PROTECTED_APPLICATION_PREFIXES = [
  "/dashboard",
  "/vehicles",
  "/reports",
  "/audit-logs",
  "/settings",
  "/unauthorized",
  "/access-unavailable",
] as const;

const shouldSkipCopiedHeader = (name: string) =>
  name === "location" ||
  name === "set-cookie" ||
  name.startsWith("x-middleware-");

export const isProtectedApplicationPath = (pathname: string) =>
  PROTECTED_APPLICATION_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

export function createSignInRedirectResponse(
  requestUrl: URL,
  refreshedResponse: NextResponse,
) {
  const destination = new URL("/sign-in", requestUrl.origin);
  destination.searchParams.set(
    "next",
    getSafeInternalPath(`${requestUrl.pathname}${requestUrl.search}`),
  );

  const redirectResponse = NextResponse.redirect(destination);

  refreshedResponse.headers.forEach((value, name) => {
    if (!shouldSkipCopiedHeader(name)) {
      redirectResponse.headers.set(name, value);
    }
  });

  refreshedResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}
