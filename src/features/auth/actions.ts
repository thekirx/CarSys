"use server";

import { redirect } from "next/navigation";

import {
  performPasswordSignIn,
  type SignInActionState,
} from "@/features/auth/action-logic";
import { getSafeInternalPath } from "@/features/auth/safe-redirect";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function signInAction(
  _previousState: SignInActionState,
  formData: FormData,
): Promise<SignInActionState> {
  const supabase = await createServerSupabaseClient();
  const result = await performPasswordSignIn(formData, (credentials) =>
    supabase.auth.signInWithPassword(credentials),
  );

  if (!result.ok) {
    return result.state;
  }

  redirect(getSafeInternalPath(formData.get("next")));
}

export async function signOutAction(): Promise<never> {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut({ scope: "local" });
  redirect("/sign-in");
}
