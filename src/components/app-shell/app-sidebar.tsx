"use client";

import Link from "next/link";
import { LifeBuoyIcon } from "lucide-react";
import { usePathname } from "next/navigation";

import {
  isNavigationItemActive,
  type ShellNavigationItem,
} from "@/components/app-shell/navigation-items";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

type AppSidebarProps = Readonly<{
  items: readonly ShellNavigationItem[];
}>;

export function ApexBrand() {
  return (
    <div className="flex h-14 items-center gap-2.5 px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center text-xl font-bold text-sidebar-primary"
      >
        A
      </span>
      <span className="flex min-w-0 flex-col leading-none group-data-[collapsible=icon]:hidden">
        <span className="truncate text-sm font-semibold tracking-tight text-sidebar-foreground">
          Apex Autohaus
        </span>
        <span className="mt-1 text-[0.65rem] uppercase tracking-[0.16em] text-sidebar-foreground/55">
          Operations
        </span>
      </span>
    </div>
  );
}

export function AppSidebar({ items }: AppSidebarProps) {
  const isMobile = useIsMobile();
  const pathname = usePathname();

  if (isMobile) {
    return null;
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 pt-2">
        <ApexBrand />
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Dealership</SidebarGroupLabel>
          <SidebarGroupContent>
            <nav aria-label="Primary navigation">
              <SidebarMenu className="gap-1">
                {items.map((item) => {
                  const Icon = item.icon;
                  const isActive = isNavigationItemActive(pathname, item.href);

                  return (
                    <SidebarMenuItem key={item.key}>
                      <SidebarMenuButton
                        render={
                          <Link
                            href={item.href}
                            aria-current={isActive ? "page" : undefined}
                          />
                        }
                        isActive={isActive}
                        tooltip={item.label}
                      >
                        <Icon aria-hidden="true" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </nav>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-3 pb-3">
        <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-sidebar-foreground/60 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <LifeBuoyIcon aria-hidden="true" />
          <span className="group-data-[collapsible=icon]:hidden">Help & support</span>
        </div>
        <p className="px-2 text-[0.65rem] text-sidebar-foreground/40 group-data-[collapsible=icon]:hidden">
          Foundation v1
        </p>
        <SidebarSeparator className="mx-0" />
        <SidebarTrigger className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
