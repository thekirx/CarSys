import { InviteUserDialog } from "@/features/settings/users/invite-user-dialog";
import { UserTable } from "@/features/settings/users/user-table";
import { getUserManagementData } from "@/features/settings/users/user-queries";
import { requirePagePermission } from "@/features/permissions/guards";

export default async function UsersPage() {
  const context = await requirePagePermission("users.manage");
  const data = await getUserManagementData(context);
  return <div className="settings-page">
    <div className="page-heading page-heading-actions"><div><p className="eyebrow">Permissions</p><h2>Users & access</h2><p>Manage organization membership, roles, branch assignments, and account status.</p></div><InviteUserDialog roles={data.roles} branches={data.branches} /></div>
    <UserTable initialUsers={data.users} currentUserId={context.userId} demoMode={context.demoMode} />
  </div>;
}
