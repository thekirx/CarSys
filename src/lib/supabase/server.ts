import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getPublicEnv } from "@/lib/env";
import {
  createSupabaseCookieAdapter,
  type SupabaseResponseMutations,
} from "@/lib/supabase/response-mutations";
import type { Database } from "@/lib/supabase/types";

type CreateServerSupabaseClientOptions = Readonly<{
  responseMutations?: SupabaseResponseMutations;
}>;

export async function createServerSupabaseClient(
  options: CreateServerSupabaseClientOptions = {},
) {
  const cookieStore = await cookies();
  const {
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  } = getPublicEnv();

  return createServerClient<Database>(
    NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: createSupabaseCookieAdapter(
        cookieStore,
        options.responseMutations,
      ),
    },
  );
}
