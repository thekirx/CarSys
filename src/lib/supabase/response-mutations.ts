import type { CookieMethodsServer } from "@supabase/ssr";
import type { NextResponse } from "next/server";

type SetAllCookies = NonNullable<CookieMethodsServer["setAll"]>;
type SupabaseCookieMutation = Parameters<SetAllCookies>[0][number];
type ServerCookieStore = {
  getAll(): Array<{ name: string; value: string }>;
  set(
    name: string,
    value: string,
    options: SupabaseCookieMutation["options"],
  ): unknown;
};

export type SupabaseResponseMutations = {
  cookies: SupabaseCookieMutation[];
  headers: Headers;
};

export function createSupabaseResponseMutations(): SupabaseResponseMutations {
  return { cookies: [], headers: new Headers() };
}

export function recordSupabaseResponseMutations(
  responseMutations: SupabaseResponseMutations,
  cookies: Parameters<SetAllCookies>[0],
  headers: Parameters<SetAllCookies>[1],
) {
  responseMutations.cookies.push(...cookies);
  Object.entries(headers).forEach(([name, value]) => {
    responseMutations.headers.set(name, value);
  });
}

export function createSupabaseCookieAdapter(
  cookieStore: ServerCookieStore,
  responseMutations?: SupabaseResponseMutations,
): CookieMethodsServer {
  return {
    getAll() {
      return cookieStore.getAll();
    },
    setAll(cookies, headers) {
      if (responseMutations) {
        recordSupabaseResponseMutations(
          responseMutations,
          cookies,
          headers,
        );
      }

      try {
        cookies.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      } catch {
        // Server Components cannot write cookies. Proxy refresh remains the
        // request-level fallback, while Route Handlers use the collector.
      }
    },
  };
}

export function applySupabaseResponseMutations(
  response: NextResponse,
  responseMutations: SupabaseResponseMutations,
) {
  responseMutations.headers.forEach((value, name) => {
    response.headers.set(name, value);
  });
  responseMutations.cookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  return response;
}
