import type { DashboardData } from "@/features/dashboard/types";

export const dashboardFixture: DashboardData = {
  metrics: { total: 3, available: 2, reserved: 1, soldThisMonth: 1 },
  financials: { investedInventory: 2_000_000, projectedRevenue: 2_600_000, projectedGrossProfit: 600_000 },
  pipeline: [{ label: "Available", count: 2 }, { label: "Reserved", count: 1 }],
  salesSeries: [{ month: "Aug", units: 1, revenue: 2.6 }],
  alerts: [{ level: "warning", title: "Reservation expiring", detail: "Follow up today", action: "Open reservation" }],
  testDrives: [{ time: "10:30 AM", customer: "Test Customer", vehicle: "2024 Toyota Fortuner", agent: "Test Agent" }],
  oldestVehicles: [{ id: "vehicle-1", stock: "AA-0001", year: 2022, make: "Toyota", model: "Camry", price: 1_800_000, age: 45 }],
};
