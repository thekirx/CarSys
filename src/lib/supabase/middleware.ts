import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { getPublicEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

export async function updateSession(
  request: NextRequest,
  requestHeaders = new Headers(request.headers),
): Promise<Readonly<{ response: NextResponse; userId: string | null }>> {
  let response = NextResponse.next({ request: { headers: requestHeaders } });
  const {
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  } = getPublicEnv();

  const supabase = createServerClient<Database>(
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          const cookieHeader = request.headers.get("cookie");
          if (cookieHeader) {
            requestHeaders.set("cookie", cookieHeader);
          }

          response = NextResponse.next({ request: { headers: requestHeaders } });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
          Object.entries(headers).forEach(([name, value]) => {
            response.headers.set(name, value);
          });
        },
      },
    },
  );

  const { data, error } = await supabase.auth.getClaims();
  const userId =
    !error && typeof data?.claims.sub === "string" ? data.claims.sub : null;

  return { response, userId };
}
