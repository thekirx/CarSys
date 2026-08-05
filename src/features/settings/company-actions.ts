"use server";

import { revalidatePath } from "next/cache";
import { companySettingsSchema } from "@/features/settings/company-schema";
import { getRequiredAccessContext } from "@/features/auth/get-access-context";
import { hasPermission } from "@/features/permissions/permissions";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type CompanyActionState = { success?: string; error?: string; fields?: Record<string, string[]> };

export async function updateCompanyAction(_state: CompanyActionState, formData: FormData): Promise<CompanyActionState> {
  const context = await getRequiredAccessContext();
  if (!hasPermission(context, "settings.manage")) return { error: "You do not have permission to update company settings." };
  const parsed = companySettingsSchema.safeParse({
    name: formData.get("name"), email: formData.get("email"), phone: formData.get("phone"), address: formData.get("address"),
    timezone: formData.get("timezone"), currency: formData.get("currency"),
  });
  if (!parsed.success) return { fields: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  if (context.demoMode) return { success: "Demo company settings validated successfully. Connect Supabase to persist changes." };

  const supabase = await createServerSupabaseClient();
  const { data: before } = await supabase.from("organizations").select("*").eq("id", context.organizationId).single();
  const { error } = await supabase.from("organizations").update(parsed.data).eq("id", context.organizationId);
  if (error) return { error: "The company profile could not be updated." };
  await supabase.from("audit_logs").insert({ organization_id: context.organizationId, actor_user_id: context.userId, action: "organization.updated", entity_type: "organization", entity_id: context.organizationId, before_data: before, after_data: parsed.data, reason: "Company settings update" });
  revalidatePath("/settings/company");
  return { success: "Company settings updated." };
}
