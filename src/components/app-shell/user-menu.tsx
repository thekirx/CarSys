"use client";

import { useState } from "react";
import { ChevronDown, LogOut, UserRoundCog } from "lucide-react";
import { signOutAction } from "@/features/auth/actions";
import { Avatar } from "@/components/ui/avatar";
import { useOrganization } from "@/components/app-shell/organization-provider";

export function UserMenu() {
  const [open, setOpen] = useState(false);
  const context = useOrganization();
  return (
    <div className="user-menu-wrap">
      <button className="user-menu-trigger" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-haspopup="menu">
        <Avatar name={context.userName} />
        <span className="user-menu-copy"><strong>{context.userName}</strong><small>{context.roleName}</small></span>
        <ChevronDown size={15} />
      </button>
      {open ? (
        <div className="user-menu" role="menu">
          <div className="user-menu-summary"><UserRoundCog size={18} /><span><strong>{context.userEmail}</strong><small>{context.activeBranchName}</small></span></div>
          <form action={signOutAction}><button role="menuitem" type="submit"><LogOut size={16} /> Sign out</button></form>
        </div>
      ) : null}
    </div>
  );
}
