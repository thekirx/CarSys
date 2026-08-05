"use server";

import { revalidatePath } from "next/cache";
import { getRequiredAccessContext } from "@/features/auth/get-access-context";
import { hasPermission } from "@/features/permissions/permissions";
import { inviteUserSchema } from "@/features/settings/users/user-schema";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type InviteUserState = { success?: string; error?: string; fields?: Record<string, string[]> };

export async function inviteUserAction(_state: InviteUserState, formData: FormData): Promise<InviteUserState> {
  const context = await getRequiredAccessContext();
  if (!hasPermission(context, "users.manage")) return { error: "You do not have permission to invite users." };

  const parsed = inviteUserSchema.safeParse({
    email: formData.get("email"),
    fullName: formData.get("fullName"),
    roleId: formData.get("roleId"),
    scope: formData.get("scope"),
    branchIds: formData.getAll("branchIds").map(String),
  });
  if (!parsed.success) return { fields: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  if (context.demoMode) return { success: `Invitation for ${parsed.data.email} validated in demo mode.` };

  const supabase = await createServerSupabaseClient();
  const { data: role } = await supabase
    .from("roles")
    .select("id, organization_id, code")
    .eq("id", parsed.data.roleId)
    .eq("organization_id", context.organizationId)
    .maybeSingle();
  if (!role || role.code === "owner") return { error: "Select an available role from this organization." };

  if (parsed.data.scope === "assigned_branches") {
    const { data: validBranches } = await supabase
      .from("branches")
      .select("id")
      .eq("organization_id", context.organizationId)
      .in("id", parsed.data.branchIds);
    if ((validBranches?.length ?? 0) !== new Set(parsed.data.branchIds).size) {
      return { error: "One or more branch assignments are invalid." };
    }
  }

  const admin = createAdminSupabaseClient();
  if (!admin) return { error: "User invitations require the server-only SUPABASE_SERVICE_ROLE_KEY." };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { data: invitation, error: inviteError } = await admin.auth.admin.inviteUserByEmail(parsed.data.email, {
    redirectTo: `${siteUrl.replace(/\/$/, "")}/auth/callback`,
    data: { display_name: parsed.data.fullName },
  });
  if (inviteError || !invitation.user) return { error: "The invitation could not be sent. The account may already exist." };

  const userId = invitation.user.id;
  const { error: profileError } = await admin.from("profiles").upsert({
    id: userId,
    display_name: parsed.data.fullName,
    email: parsed.data.email,
  });
  if (profileError) return { error: "The invitation was sent, but the user profile could not be prepared." };

  const { data: membership, error: membershipError } = await admin
    .from("organization_memberships")
    .insert({
      organization_id: context.organizationId,
      user_id: userId,
      role_id: role.id,
      status: "invited",
      scope: parsed.data.scope,
    })
    .select("id")
    .single();
  if (membershipError || !membership) return { error: "The invitation was sent, but organization access could not be created." };

  if (parsed.data.scope === "assigned_branches") {
    const { error: assignmentError } = await admin.from("membership_branches").insert(
      parsed.data.branchIds.map((branchId) => ({ membership_id: membership.id, branch_id: branchId })),
    );
    if (assignmentError) return { error: "The invitation was sent, but branch access could not be assigned." };
  }

  await admin.from("audit_logs").insert({
    organization_id: context.organizationId,
    actor_user_id: context.userId,
    action: "membership.invited",
    entity_type: "organization_membership",
    entity_id: membership.id,
    after_data: { email: parsed.data.email, role_id: role.id, scope: parsed.data.scope, branch_ids: parsed.data.branchIds },
    reason: "Owner invitation",
  });

  revalidatePath("/settings/users");
  return { success: `Invitation sent to ${parsed.data.email}.` };
}

export async function setMembershipStatusAction(formData: FormData): Promise<void> {
  const context = await getRequiredAccessContext();
  if (!hasPermission(context, "users.manage")) return;
  const membershipId = String(formData.get("membershipId") ?? "");
  const nextStatus = String(formData.get("status") ?? "");
  if (!membershipId || !["active", "suspended"].includes(nextStatus)) return;
  if (context.demoMode) return;

  const supabase = await createServerSupabaseClient();
  const { data: target } = await supabase
    .from("organization_memberships")
    .select("id, user_id, role_id, status")
    .eq("id", membershipId)
    .eq("organization_id", context.organizationId)
    .maybeSingle();
  if (!target || target.user_id === context.userId) return;

  const { data: role } = await supabase.from("roles").select("code").eq("id", target.role_id).maybeSingle();
  if (role?.code === "owner" && nextStatus === "suspended") {
    const { data: owners } = await supabase
      .from("organization_memberships")
      .select("id, role_id")
      .eq("organization_id", context.organizationId)
      .eq("status", "active");
    const ownerRoleIds = new Set([target.role_id]);
    const activeOwnerCount = (owners ?? []).filter((owner) => ownerRoleIds.has(owner.role_id)).length;
    if (activeOwnerCount <= 1) return;
  }

  const { error } = await supabase
    .from("organization_memberships")
    .update({
      status: nextStatus,
      suspended_at: nextStatus === "suspended" ? new Date().toISOString() : null,
    })
    .eq("id", membershipId)
    .eq("organization_id", context.organizationId);
  if (!error) {
    await supabase.from("audit_logs").insert({
      organization_id: context.organizationId,
      actor_user_id: context.userId,
      action: `membership.${nextStatus}`,
      entity_type: "organization_membership",
      entity_id: membershipId,
      before_data: { status: target.status },
      after_data: { status: nextStatus },
      reason: "Owner access management",
    });
    revalidatePath("/settings/users");
  }
}
