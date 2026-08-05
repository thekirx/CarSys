"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CarFront, X } from "lucide-react";
import { getVisibleNavigation } from "@/features/permissions/navigation";
import { useOrganization } from "@/components/app-shell/organization-provider";
import { cn } from "@/lib/utils";

export function MobileNavigation({ open, onClose }: { open: boolean; onClose: () => void }) {
  const context = useOrganization();
  const pathname = usePathname();
  if (!open) return null;
  return (
    <div className="mobile-nav-backdrop" onClick={onClose} role="presentation">
      <aside className="mobile-nav" onClick={(event) => event.stopPropagation()} aria-label="Mobile navigation">
        <div className="mobile-nav-header"><span><span className="brand-mark"><CarFront size={19} /></span><strong>CarSys</strong></span><button onClick={onClose} aria-label="Close navigation"><X /></button></div>
        <p className="mobile-org">{context.organizationName}<small>{context.activeBranchName}</small></p>
        <nav>
          {getVisibleNavigation(context).map((item) => (
            <div key={item.href}>
              <Link className={cn(pathname === item.href && "active")} href={item.href} onClick={onClose}>{item.label}</Link>
              {item.children?.map((child) => <Link className={cn("mobile-sub-link", pathname === child.href && "active")} href={child.href} key={child.href} onClick={onClose}>{child.label}</Link>)}
            </div>
          ))}
        </nav>
      </aside>
    </div>
  );
}
