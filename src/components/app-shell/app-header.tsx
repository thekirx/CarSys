"use client";

import { BellIcon, Building2Icon } from "lucide-react";
import { usePathname } from "next/navigation";

import { MobileNavigation } from "@/components/app-shell/mobile-navigation";
import {
  isNavigationItemActive,
  type ShellNavigationItem,
} from "@/components/app-shell/navigation-items";
import {
  ALL_BRANCHES,
  useOrganization,
} from "@/components/app-shell/organization-provider";
import { UserMenu } from "@/components/app-shell/user-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

type AppHeaderProps = Readonly<{
  items: readonly ShellNavigationItem[];
}>;

const getCurrentPageTitle = (
  pathname: string,
  items: readonly ShellNavigationItem[],
) =>
  items
    .filter((item) => isNavigationItemActive(pathname, item.href))
    .toSorted((left, right) => right.href.length - left.href.length)[0]?.label ??
  "Workspace";

export function AppHeader({ items }: AppHeaderProps) {
  const pathname = usePathname();
  const { organization, user, scope, branches, selectedBranchId, selectBranch } =
    useOrganization();
  const pageTitle = getCurrentPageTitle(pathname, items);
  const branchOptions = [
    ...(scope === "organization"
      ? [{ label: "All branches", value: ALL_BRANCHES }]
      : []),
    ...branches.map((branch) => ({ label: branch.name, value: branch.id })),
  ];
  const selectedBranchLabel =
    selectedBranchId === ALL_BRANCHES
      ? "All branches"
      : (branches.find((branch) => branch.id === selectedBranchId)?.name ??
        "No branches assigned");

  return (
    <header className="sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 px-3 backdrop-blur-sm sm:px-4 lg:px-5">
      <div className="lg:hidden">
        <MobileNavigation items={items} />
      </div>
      <SidebarTrigger className="hidden lg:inline-flex" />
      <Separator orientation="vertical" className="mx-1 hidden h-5 lg:block" />
      <div className="min-w-0 flex-1">
        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <p className="truncate text-sm font-medium sm:hidden">{pageTitle}</p>
      </div>

      <div className="flex min-w-0 max-w-28 items-center gap-2 sm:max-w-44">
        <Select
          items={branchOptions}
          value={selectedBranchId}
          onValueChange={(value) => {
            if (typeof value === "string") {
              selectBranch(value);
            }
          }}
          disabled={branchOptions.length === 0}
        >
          <SelectTrigger
            aria-label={`Branch for ${organization.name}`}
            className="w-full max-w-52"
          >
            <Building2Icon aria-hidden="true" />
            <SelectValue>{selectedBranchLabel}</SelectValue>
          </SelectTrigger>
          <SelectContent align="end" alignItemWithTrigger={false}>
            <SelectGroup>
              {branchOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Notifications unavailable"
        aria-describedby="notifications-unavailable-description"
        disabled
      >
        <BellIcon data-icon="inline-start" />
      </Button>
      <span id="notifications-unavailable-description" className="sr-only">
        Notifications are not available in this foundation release.
      </span>
      <UserMenu
        displayName={user.displayName}
        email={user.email}
        roleName={user.roleName}
      />
    </header>
  );
}
