"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import type {
  ApplicationShellData,
  ShellBranch,
} from "@/components/app-shell/shell-data";

export const ALL_BRANCHES = "all";

type SelectedBranchId = string | null;

type OrganizationContextValue = ApplicationShellData &
  Readonly<{
    selectedBranchId: SelectedBranchId;
    selectBranch: (branchId: string) => void;
  }>;

const OrganizationContext = createContext<OrganizationContextValue | null>(
  null,
);

type OrganizationProviderProps = ApplicationShellData &
  Readonly<{
    children: ReactNode;
    initialSelectedBranchId?: string | null;
  }>;

const sortBranches = (branches: readonly ShellBranch[]) =>
  [...branches].toSorted((left, right) => {
    if (left.isPrimary !== right.isPrimary) {
      return left.isPrimary ? -1 : 1;
    }

    return left.name.localeCompare(right.name) || left.id.localeCompare(right.id);
  });

const resolveSelection = (
  scope: ApplicationShellData["scope"],
  branches: readonly ShellBranch[],
  requestedBranchId: string | null | undefined,
): SelectedBranchId => {
  if (scope === "organization" && requestedBranchId === ALL_BRANCHES) {
    return ALL_BRANCHES;
  }

  if (branches.some((branch) => branch.id === requestedBranchId)) {
    return requestedBranchId ?? null;
  }

  return scope === "organization" ? ALL_BRANCHES : (branches[0]?.id ?? null);
};

export function OrganizationProvider({
  children,
  organization,
  user,
  scope,
  branches,
  initialSelectedBranchId,
}: OrganizationProviderProps) {
  const orderedBranches = useMemo(() => sortBranches(branches), [branches]);
  const [requestedBranchId, setRequestedBranchId] =
    useState<SelectedBranchId>(initialSelectedBranchId ?? null);
  const selectedBranchId = resolveSelection(
    scope,
    orderedBranches,
    requestedBranchId,
  );

  const selectBranch = useCallback(
    (branchId: string) => {
      if (
        (scope === "organization" && branchId === ALL_BRANCHES) ||
        orderedBranches.some((branch) => branch.id === branchId)
      ) {
        setRequestedBranchId(branchId);
      }
    },
    [orderedBranches, scope],
  );

  const value = useMemo<OrganizationContextValue>(
    () => ({
      organization,
      user,
      scope,
      branches: orderedBranches,
      selectedBranchId,
      selectBranch,
    }),
    [
      organization,
      user,
      scope,
      orderedBranches,
      selectedBranchId,
      selectBranch,
    ],
  );

  return (
    <OrganizationContext.Provider value={value}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error("useOrganization must be used within OrganizationProvider");
  }

  return context;
}
