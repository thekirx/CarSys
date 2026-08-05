"use client";

import { useMemo, useState } from "react";
import { Search, ShieldCheck, UserCheck, UserX } from "lucide-react";
import { setMembershipStatusAction } from "@/features/settings/users/user-actions";
import type { UserManagementRecord } from "@/features/settings/users/user-queries";

export function UserTable({ initialUsers, currentUserId, demoMode }: { initialUsers: UserManagementRecord[]; currentUserId: string; demoMode: boolean }) {
  const [query, setQuery] = useState("");
  const users = useMemo(
    () => initialUsers.filter((user) => `${user.name} ${user.email} ${user.role}`.toLowerCase().includes(query.toLowerCase())),
    [initialUsers, query],
  );
  return <div className="table-card">
    <div className="table-toolbar"><label><Search size={16} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search users…" aria-label="Search users" /></label><span>{users.filter((user) => user.status === "Active").length} active members</span></div>
    <div className="responsive-table"><table><thead><tr><th>Team member</th><th>Role</th><th>Access scope</th><th>Branches</th><th>Status</th><th aria-label="Actions" /></tr></thead><tbody>{users.map((user) => <tr key={user.id}><td><Person user={user} /></td><td><span className="role-badge"><ShieldCheck size={13} />{user.role}</span></td><td>{user.scope}</td><td>{user.branches}</td><td><span className={user.status === "Active" ? "active-status" : "suspended-status"}>{user.status === "Active" ? <UserCheck size={13} /> : <UserX size={13} />}{user.status}</span></td><td><MembershipAction user={user} currentUserId={currentUserId} demoMode={demoMode} /></td></tr>)}</tbody></table></div>
    <div className="mobile-user-list">{users.map((user) => <article key={user.id}><Person user={user} /><dl><div><dt>Role</dt><dd>{user.role}</dd></div><div><dt>Scope</dt><dd>{user.scope}</dd></div><div><dt>Status</dt><dd>{user.status}</dd></div></dl><MembershipAction user={user} currentUserId={currentUserId} demoMode={demoMode} /></article>)}</div>
  </div>;
}

function Person({ user }: { user: UserManagementRecord }) {
  const initials = user.name.split(" ").map((part) => part[0]).slice(0, 2).join("");
  return <div className="person-cell"><span>{initials}</span><div><strong>{user.name}</strong><small>{user.email}</small></div></div>;
}

function MembershipAction({ user, currentUserId, demoMode }: { user: UserManagementRecord; currentUserId: string; demoMode: boolean }) {
  const nextStatus = user.status === "Active" ? "suspended" : "active";
  const isSelf = user.id === currentUserId;
  return <form action={setMembershipStatusAction}>
    <input type="hidden" name="membershipId" value={user.membershipId} />
    <input type="hidden" name="status" value={nextStatus} />
    <button className="table-action table-action-text" type="submit" disabled={isSelf || demoMode} title={demoMode ? "Status changes are disabled in demo mode" : isSelf ? "You cannot change your own status" : undefined}>
      {nextStatus === "suspended" ? "Suspend" : "Activate"}
    </button>
  </form>;
}
