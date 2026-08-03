import { mapApplicationShellData } from "@/components/app-shell/shell-data";
import type { OrganizationAccessContext } from "@/features/permissions/types";

const emptyBranchResult = Promise.resolve({ data: [], error: null });

export async function loadApplicationShellData(
  context: OrganizationAccessContext,
) {
  try {
    const { createServerSupabaseClient } = await import(
      "@/lib/supabase/server"
    );
    const supabase = await createServerSupabaseClient();
    const branchQuery = supabase
      .from("branches")
      .select("id, organization_id, name, is_primary, is_active")
      .eq("organization_id", context.organizationId)
      .eq("is_active", true)
      .order("is_primary", { ascending: false })
      .order("name", { ascending: true });

    const accessibleBranches =
      context.scope === "organization"
        ? branchQuery
        : context.branchIds.length === 0
          ? emptyBranchResult
          : branchQuery.in("id", [...new Set(context.branchIds)]);

    const [authResult, profileResult, organizationResult, membershipResult, branchesResult] =
      await Promise.all([
        supabase.auth.getUser(),
        supabase
          .from("profiles")
          .select("id, display_name")
          .eq("id", context.userId)
          .maybeSingle(),
        supabase
          .from("organizations")
          .select("id, company_name, is_active")
          .eq("id", context.organizationId)
          .eq("is_active", true)
          .maybeSingle(),
        supabase
          .from("organization_memberships")
          .select(
            "id, organization_id, user_id, role_id, status, organization_scope",
          )
          .eq("organization_id", context.organizationId)
          .eq("user_id", context.userId)
          .eq("status", "active")
          .maybeSingle(),
        accessibleBranches,
      ]);

    const membership = membershipResult.data;
    if (
      authResult.error ||
      profileResult.error ||
      organizationResult.error ||
      membershipResult.error ||
      branchesResult.error ||
      !authResult.data.user ||
      !profileResult.data ||
      !organizationResult.data ||
      !membership ||
      !Array.isArray(branchesResult.data)
    ) {
      return null;
    }

    const roleResult = await supabase
      .from("roles")
      .select("id, organization_id, name")
      .eq("organization_id", context.organizationId)
      .eq("id", membership.role_id)
      .maybeSingle();

    if (roleResult.error || !roleResult.data) {
      return null;
    }

    return mapApplicationShellData({
      context,
      authUser: {
        id: authResult.data.user.id,
        email: authResult.data.user.email,
      },
      profile: profileResult.data,
      organization: organizationResult.data,
      membership,
      role: roleResult.data,
      branches: branchesResult.data,
    });
  } catch {
    return null;
  }
}
