"use client";

import Link from "next/link";
import { MenuIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { ApexBrand } from "@/components/app-shell/app-sidebar";
import {
  isNavigationItemActive,
  type ShellNavigationItem,
} from "@/components/app-shell/navigation-items";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type MobileNavigationProps = Readonly<{
  items: readonly ShellNavigationItem[];
}>;

export function MobileNavigation({ items }: MobileNavigationProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Open navigation"
          />
        }
      >
        <MenuIcon data-icon="inline-start" />
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-72 gap-0 border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
      >
        <SheetHeader className="px-3 py-2 text-left">
          <SheetTitle className="sr-only">Application navigation</SheetTitle>
          <SheetDescription className="sr-only">
            Navigate the Apex Autohaus dealership workspace.
          </SheetDescription>
          <ApexBrand />
        </SheetHeader>
        <Separator className="bg-sidebar-border" />
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 py-4">
          <p className="px-2 text-xs font-medium uppercase tracking-[0.14em] text-sidebar-foreground/55">
            Dealership
          </p>
          <nav aria-label="Mobile primary navigation">
            <ul className="flex flex-col gap-1">
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = isNavigationItemActive(pathname, item.href);

                return (
                  <li key={item.key}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={isActive ? "page" : undefined}
                      className={cn(
                        "flex h-9 items-center gap-2 rounded-md px-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                        isActive
                          ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <Icon aria-hidden="true" />
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
        <div className="border-t border-sidebar-border px-5 py-4 text-[0.65rem] text-sidebar-foreground/45">
          Foundation v1
        </div>
      </SheetContent>
    </Sheet>
  );
}
