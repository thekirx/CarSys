import type { OrganizationAccessContext } from "@/features/permissions/types";
import { hasPermission } from "@/features/permissions/permissions";
import { demoDashboard } from "@/lib/demo-data";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/types";
import type { DashboardData } from "@/features/dashboard/types";

const pipelineLabels: Record<string, string> = {
  acquired: "Acquired",
  for_inspection: "Inspection",
  for_repair_or_preparation: "Preparation",
  ready_for_listing: "Ready",
  available: "Available",
  reserved: "Reserved",
  sold: "Sold",
  released: "Released",
};

type SnapshotPayload = Record<string, Json | undefined>;
type SalesPoint = { month: string; units: number; revenue: number };
type TestDrive = { time: string; customer: string; vehicle: string; agent: string };

function asObject(value: Json): SnapshotPayload {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function parseSalesSeries(value: Json): SalesPoint[] {
  const series = asObject(value).series;
  if (!Array.isArray(series)) return [];
  return series.flatMap((point) => {
    if (!point || typeof point !== "object" || Array.isArray(point)) return [];
    const month = point.month;
    const units = point.units;
    const revenue = point.revenue;
    return typeof month === "string" && typeof units === "number" && typeof revenue === "number"
      ? [{ month, units, revenue }]
      : [];
  });
}

function parseTestDrives(value: Json): TestDrive[] {
  const appointments = asObject(value).appointments;
  if (!Array.isArray(appointments)) return [];
  return appointments.flatMap((appointment) => {
    if (!appointment || typeof appointment !== "object" || Array.isArray(appointment)) return [];
    const time = appointment.time;
    const customer = appointment.customer;
    const vehicle = appointment.vehicle;
    const agent = appointment.agent;
    return typeof time === "string" && typeof customer === "string" && typeof vehicle === "string"
      ? [{ time, customer, vehicle, agent: typeof agent === "string" ? agent : "Assigned sales team" }]
      : [];
  });
}

export async function getDashboardData(context: OrganizationAccessContext): Promise<DashboardData> {
  if (context.demoMode) {
    return {
      ...demoDashboard,
      financials: hasPermission(context, "financials.view_sensitive") ? demoDashboard.financials : null,
    };
  }

  const supabase = await createServerSupabaseClient();
  const [{ data: vehicles, error: vehicleError }, { data: snapshots }, { data: notifications }] = await Promise.all([
    supabase
      .from("vehicles")
      .select("id, stock_number, year, make, model, workflow_status, list_price, acquired_at, sold_at")
      .eq("organization_id", context.organizationId)
      .in("branch_id", context.branchIds),
    supabase
      .from("dashboard_snapshots")
      .select("metric_key, payload, branch_id, generated_at")
      .eq("organization_id", context.organizationId)
      .order("generated_at", { ascending: false }),
    supabase
      .from("notifications")
      .select("id, priority, title, body, created_at")
      .eq("organization_id", context.organizationId)
      .is("read_at", null)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  if (vehicleError) throw new Error("The dashboard inventory could not be loaded.");

  const scopedSnapshots = (snapshots ?? []).filter(
    (snapshot) => snapshot.branch_id === null || context.branchIds.includes(snapshot.branch_id),
  );
  const snapshotByKey = new Map(scopedSnapshots.map((snapshot) => [snapshot.metric_key, snapshot.payload]));
  const salesSeries = parseSalesSeries(snapshotByKey.get("sales-series") ?? {});
  const testDrives = parseTestDrives(snapshotByKey.get("upcoming-test-drives") ?? {});

  const statusCounts = new Map<string, number>();
  for (const vehicle of vehicles ?? []) {
    statusCounts.set(vehicle.workflow_status, (statusCounts.get(vehicle.workflow_status) ?? 0) + 1);
  }

  const pipeline = Object.entries(pipelineLabels)
    .map(([status, label]) => ({ label, count: statusCounts.get(status) ?? 0 }))
    .filter((stage) => stage.count > 0 && !["Sold", "Released"].includes(stage.label));

  const now = new Date();
  const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const soldThisMonth = (vehicles ?? []).filter(
    (vehicle) => vehicle.workflow_status === "sold" && vehicle.sold_at?.startsWith(currentMonth),
  ).length || salesSeries.at(-1)?.units || 0;

  const oldestVehicles = [...(vehicles ?? [])]
    .filter((vehicle) => !["sold", "released"].includes(vehicle.workflow_status))
    .sort((a, b) => (a.acquired_at ?? "9999-12-31").localeCompare(b.acquired_at ?? "9999-12-31"))
    .slice(0, 3)
    .map((vehicle) => ({
      id: vehicle.id,
      stock: vehicle.stock_number,
      year: vehicle.year,
      make: vehicle.make,
      model: vehicle.model,
      price: Number(vehicle.list_price),
      age: vehicle.acquired_at
        ? Math.max(0, Math.floor((Date.now() - new Date(`${vehicle.acquired_at}T00:00:00+08:00`).getTime()) / 86_400_000))
        : 0,
    }));

  let financials: DashboardData["financials"] = null;
  if (hasPermission(context, "financials.view_sensitive") && (vehicles?.length ?? 0) > 0) {
    const vehicleIds = vehicles?.map((vehicle) => vehicle.id) ?? [];
    const { data: financialRows, error: financialError } = await supabase
      .from("vehicle_financials")
      .select("acquisition_value, preparation_cost")
      .eq("organization_id", context.organizationId)
      .in("vehicle_id", vehicleIds);

    if (financialError) throw new Error("The financial dashboard summary could not be loaded.");
    const investedInventory = (financialRows ?? []).reduce(
      (total, row) => total + Number(row.acquisition_value) + Number(row.preparation_cost),
      0,
    );
    const projectedRevenue = (vehicles ?? [])
      .filter((vehicle) => !["sold", "released"].includes(vehicle.workflow_status))
      .reduce((total, vehicle) => total + Number(vehicle.list_price), 0);
    financials = {
      investedInventory,
      projectedRevenue,
      projectedGrossProfit: Math.max(0, projectedRevenue - investedInventory),
    };
  }

  return {
    metrics: {
      total: vehicles?.length ?? 0,
      available: statusCounts.get("available") ?? 0,
      reserved: statusCounts.get("reserved") ?? 0,
      soldThisMonth,
    },
    financials,
    pipeline,
    salesSeries: salesSeries.length ? salesSeries : demoDashboard.salesSeries,
    alerts: (notifications ?? []).map((notification) => ({
      level: notification.priority,
      title: notification.title,
      detail: notification.body,
      action: "Open workspace",
    })),
    testDrives,
    oldestVehicles,
  };
}
