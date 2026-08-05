import type { OrganizationAccessContext } from "@/features/permissions/types";
import type { ModuleRecord } from "@/features/settings/module-settings";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const descriptions: Record<ModuleRecord["key"], string> = {
  dealership: "Inventory, customer, test-drive, deal, and reporting workflows for automotive retail.",
  fleet_management: "Manage assigned vehicles, utilization, maintenance schedules, and fleet reporting.",
  vehicle_rental: "Availability, reservations, rental contracts, vehicle releases, and returns.",
};

export async function getModuleSettings(context: OrganizationAccessContext): Promise<ModuleRecord[]> {
  if (context.demoMode) {
    return [
      { key: "dealership", name: "Dealership", enabled: true, description: descriptions.dealership },
      { key: "fleet_management", name: "Fleet Management", enabled: false, description: descriptions.fleet_management },
      { key: "vehicle_rental", name: "Vehicle Rental", enabled: false, description: descriptions.vehicle_rental },
    ];
  }

  const supabase = await createServerSupabaseClient();
  const [{ data: modules, error: moduleError }, { data: organizationModules }] = await Promise.all([
    supabase.from("modules").select("id, key, name, description").order("name"),
    supabase
      .from("organization_modules")
      .select("module_id, enabled")
      .eq("organization_id", context.organizationId),
  ]);
  if (moduleError) throw new Error("Module settings could not be loaded.");
  const enabledById = new Map((organizationModules ?? []).map((record) => [record.module_id, record.enabled]));
  return (modules ?? []).map((module) => ({
    key: module.key as ModuleRecord["key"],
    name: module.name,
    enabled: enabledById.get(module.id) ?? false,
    description: module.description || descriptions[module.key as ModuleRecord["key"]],
  }));
}
