import { AppShell } from "@/components/app-shell/app-shell";
import { getRequiredAccessContext } from "@/features/auth/get-access-context";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const context = await getRequiredAccessContext();
  return <AppShell context={context}>{children}</AppShell>;
}
