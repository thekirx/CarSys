import type { DemoRole, OrganizationAccessContext, PermissionKey } from "@/features/permissions/types";

const allPermissions: PermissionKey[] = [
  "settings.manage", "users.manage", "modules.manage", "financials.view_sensitive",
  "vehicles.read", "vehicles.manage", "reports.read", "audit_logs.read",
];

const roleConfig: Record<DemoRole, { name: string; person: string; email: string; scope: "organization" | "assigned_branches"; permissions: PermissionKey[] }> = {
  owner: { name: "Owner", person: "Kirk Orino", email: "owner@apexautohaus.demo", scope: "organization", permissions: allPermissions },
  "branch-manager": { name: "Branch Manager", person: "Bianca Santos", email: "manager@apexautohaus.demo", scope: "assigned_branches", permissions: ["financials.view_sensitive", "vehicles.read", "vehicles.manage", "reports.read"] },
  "sales-agent": { name: "Sales Agent", person: "Paolo Reyes", email: "sales@apexautohaus.demo", scope: "assigned_branches", permissions: ["vehicles.read"] },
  "inventory-staff": { name: "Inventory Staff", person: "Mika dela Cruz", email: "inventory@apexautohaus.demo", scope: "assigned_branches", permissions: ["vehicles.read", "vehicles.manage"] },
  viewer: { name: "Viewer", person: "Angela Lim", email: "viewer@apexautohaus.demo", scope: "assigned_branches", permissions: ["vehicles.read", "reports.read"] },
};

export function createDemoAccessContext(role: DemoRole = "owner"): OrganizationAccessContext {
  const config = roleConfig[role] ?? roleConfig.owner;
  return {
    organizationId: "10000000-0000-0000-0000-000000000001",
    organizationName: "Apex Autohaus",
    userId: `20000000-0000-0000-0000-${role.padEnd(12, "0").slice(0, 12)}`,
    userName: config.person,
    userEmail: config.email,
    roleName: config.name,
    roleCode: role,
    scope: config.scope,
    branchIds: ["30000000-0000-0000-0000-000000000001"],
    activeBranchId: "30000000-0000-0000-0000-000000000001",
    activeBranchName: "Quezon City Main",
    permissions: config.permissions,
    enabledModules: ["dealership"],
    demoMode: true,
  };
}

export const demoRoles = (Object.keys(roleConfig) as DemoRole[]).map((key) => ({ key, ...roleConfig[key] }));

export const demoVehicles = [
  { stock: "AA-2601", year: 2024, make: "Toyota", model: "Fortuner 2.8 Q", status: "Available", price: 2380000, age: 12 },
  { stock: "AA-2602", year: 2023, make: "Ford", model: "Everest Titanium+", status: "Reserved", price: 2195000, age: 18 },
  { stock: "AA-2603", year: 2024, make: "Honda", model: "CR-V VX Turbo", status: "Ready for listing", price: 1990000, age: 8 },
  { stock: "AA-2604", year: 2022, make: "Mazda", model: "CX-9 AWD", status: "Available", price: 2450000, age: 47 },
  { stock: "AA-2605", year: 2023, make: "Mitsubishi", model: "Montero Sport GT", status: "For inspection", price: 1850000, age: 6 },
  { stock: "AA-2606", year: 2021, make: "Lexus", model: "RX 350 F Sport", status: "Available", price: 3290000, age: 63 },
  { stock: "AA-2607", year: 2024, make: "Nissan", model: "Terra VL 4x4", status: "Reserved", price: 2240000, age: 14 },
  { stock: "AA-2608", year: 2023, make: "Subaru", model: "Forester 2.0i-S", status: "Available", price: 1680000, age: 29 },
];

export const demoDashboard = {
  metrics: { total: 25, available: 14, reserved: 4, soldThisMonth: 7 },
  financials: { investedInventory: 21800000, projectedRevenue: 26750000, projectedGrossProfit: 4950000 },
  pipeline: [
    { label: "Acquired", count: 3 }, { label: "Inspection", count: 4 }, { label: "Preparation", count: 2 },
    { label: "Ready", count: 2 }, { label: "Available", count: 14 }, { label: "Reserved", count: 4 },
  ],
  salesSeries: [
    { month: "Mar", units: 5, revenue: 8.2 }, { month: "Apr", units: 7, revenue: 11.4 },
    { month: "May", units: 6, revenue: 9.8 }, { month: "Jun", units: 9, revenue: 15.7 },
    { month: "Jul", units: 8, revenue: 13.9 }, { month: "Aug", units: 7, revenue: 12.1 },
  ],
  alerts: [
    { level: "critical", title: "3 vehicles need pricing review", detail: "Inventory aged over 45 days", action: "Review inventory" },
    { level: "warning", title: "2 reservations expire today", detail: "Follow up before 5:00 PM", action: "Open reservations" },
    { level: "info", title: "4 preparation tasks are overdue", detail: "Assigned to QC Main inventory team", action: "View tasks" },
  ],
  testDrives: [
    { time: "10:30 AM", customer: "Miguel Navarro", vehicle: "2024 Toyota Fortuner", agent: "Paolo Reyes" },
    { time: "1:00 PM", customer: "Sofia Tan", vehicle: "2023 Ford Everest", agent: "Bianca Santos" },
    { time: "3:30 PM", customer: "Anton Garcia", vehicle: "2021 Lexus RX 350", agent: "Paolo Reyes" },
  ],
  oldestVehicles: [...demoVehicles]
    .sort((a, b) => b.age - a.age)
    .slice(0, 3)
    .map((vehicle, index) => ({ id: `demo-oldest-${index}`, ...vehicle })),
};

export const demoUsers = demoRoles.map((role, index) => ({
  id: `user-${index + 1}`,
  name: role.person,
  email: role.email,
  role: role.name,
  roleCode: role.key,
  scope: role.scope === "organization" ? "All branches" : "Assigned branches",
  branches: role.scope === "organization" ? "All branches" : "Quezon City Main",
  status: "Active",
}));
