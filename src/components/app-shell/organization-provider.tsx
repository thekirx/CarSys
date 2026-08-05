"use client";

import { createContext, useContext } from "react";
import type { OrganizationAccessContext } from "@/features/permissions/types";

const OrganizationContext = createContext<OrganizationAccessContext | null>(null);

export function OrganizationProvider({ value, children }: { value: OrganizationAccessContext; children: React.ReactNode }) {
  return <OrganizationContext.Provider value={value}>{children}</OrganizationContext.Provider>;
}

export function useOrganization() {
  const value = useContext(OrganizationContext);
  if (!value) throw new Error("useOrganization must be used inside OrganizationProvider");
  return value;
}
