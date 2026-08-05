import { VehicleInventory } from "@/features/vehicles/vehicle-inventory";
import { requirePagePermission } from "@/features/permissions/guards";
export default async function VehiclesPage() { await requirePagePermission("vehicles.read"); return <VehicleInventory />; }
