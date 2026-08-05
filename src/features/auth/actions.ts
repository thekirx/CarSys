"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/env";
import { signInSchema } from "@/features/auth/schemas";
import type { DemoRole } from "@/features/permissions/types";

export type AuthActionState = { error?: string; fields?: { email?: string[]; password?: string[] } };

const safePath = (value: FormDataEntryValue | null) => {
  const path = typeof value === "string" ? value : "/dashboard";
  return path.startsWith("/") && !path.startsWith("//") ? path : "/dashboard";
};

export async function signInAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const demoRole = formData.get("demoRole") as DemoRole | null;
  if (isDemoMode() && demoRole) {
    const cookieStore = await cookies();
    cookieStore.set("carsys_demo_role", demoRole, { httpOnly: true, sameSite: "lax", path: "/" });
    redirect(safePath(formData.get("next")));
  }

  const parsed = signInSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next"),
  });
  if (!parsed.success) return { fields: parsed.error.flatten().fieldErrors };

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
    if (error) return { error: "The email or password is incorrect." };
  } catch {
    return { error: "Authentication is not configured. Use a demo account or add Supabase credentials." };
  }
  redirect(safePath(formData.get("next")));
}

export async function signOutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("carsys_demo_role");
  if (!isDemoMode()) {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
  }
  redirect("/sign-in");
}
