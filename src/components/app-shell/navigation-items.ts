import type { LucideIcon } from "lucide-react";
import {
  BlocksIcon,
  Building2Icon,
  ChartNoAxesCombinedIcon,
  CarFrontIcon,
  LayoutDashboardIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react";

import type { NavigationItem } from "@/features/permissions/navigation";

const navigationIcons = {
  dashboard: LayoutDashboardIcon,
  "vehicle-inventory": CarFrontIcon,
  reports: ChartNoAxesCombinedIcon,
  "company-settings": Building2Icon,
  "module-settings": BlocksIcon,
  "user-management": UsersIcon,
  "audit-logs": ShieldCheckIcon,
} as const satisfies Readonly<Record<string, LucideIcon>>;

type SupportedNavigationKey = keyof typeof navigationIcons;

export type ShellNavigationItem = Readonly<
  Pick<NavigationItem, "key" | "label" | "href"> & { icon: LucideIcon }
>;

const isSupportedNavigationKey = (
  key: string,
): key is SupportedNavigationKey => key in navigationIcons;

export const createShellNavigationItems = (
  items: readonly NavigationItem[],
): readonly ShellNavigationItem[] =>
  items.flatMap((item) =>
    isSupportedNavigationKey(item.key)
      ? [
          {
            key: item.key,
            label: item.label,
            href: item.href,
            icon: navigationIcons[item.key],
          },
        ]
      : [],
  );

export const isNavigationItemActive = (pathname: string, href: string) =>
  pathname === href || pathname.startsWith(`${href}/`);
