import type { ReactNode } from "react";

import { getRequiredAccessContext } from "@/features/auth/get-access-context";

export default async function ProtectedApplicationLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  await getRequiredAccessContext();

  return children;
}
