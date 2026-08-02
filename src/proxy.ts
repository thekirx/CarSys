import type { NextRequest } from "next/server";

import { CURRENT_PATH_HEADER } from "@/features/auth/get-access-context";
import {
  createSignInRedirectResponse,
  isProtectedApplicationPath,
} from "@/features/auth/proxy-policy";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(
    CURRENT_PATH_HEADER,
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

  const { response, userId } = await updateSession(request, requestHeaders);

  if (
    isProtectedApplicationPath(request.nextUrl.pathname) &&
    userId === null
  ) {
    return createSignInRedirectResponse(request.nextUrl, response);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|map|woff|woff2|ttf|otf)$).*)",
  ],
};
