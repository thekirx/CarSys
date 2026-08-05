import { DashboardView } from "@/features/dashboard/dashboard-view";
import { getDashboardData } from "@/features/dashboard/queries";
import { getRequiredAccessContext } from "@/features/auth/get-access-context";

export default async function DashboardPage() {
  const context = await getRequiredAccessContext();
  const data = await getDashboardData(context);
  return <DashboardView context={context} data={data} />;
}
