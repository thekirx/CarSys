import { redirect } from "next/navigation";
import type { PermissionKey } from "@/features/permissions/types";
import { getRequiredAccessContext } from "@/features/auth/get-access-context";
import { hasPermission } from "@/features/permissions/permissions";

export async function requirePagePermission(permission: PermissionKey) {
  const context = await getRequiredAccessContext();
  if (!hasPermission(context, permission)) redirect("/unauthorized");
  return context;
}
