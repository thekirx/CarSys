"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getPublicEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

export function createBrowserSupabaseClient() {
  const env = getPublicEnv();
  if (!env) throw new Error("Supabase is not configured. Add the public environment variables.");
  return createBrowserClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}
