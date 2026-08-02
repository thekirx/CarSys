import { headers } from "next/headers";
import type { ReactNode } from "react";

import {
  CURRENT_PATH_HEADER,
  getRequiredAccessContext,
} from "@/features/auth/get-access-context";

export default async function ProtectedApplicationLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const currentPath = (await headers()).get(CURRENT_PATH_HEADER);
  await getRequiredAccessContext({
    allowMissingMembership: currentPath === "/unauthorized",
  });

  return children;
}
