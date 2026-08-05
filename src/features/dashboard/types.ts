export type DashboardMetric = { label: string; value: number; trend: string; tone: "neutral" | "positive" | "warning" };

export type DashboardVehicle = {
  id: string;
  stock: string;
  year: number;
  make: string;
  model: string;
  price: number;
  age: number;
};

export type DashboardData = {
  metrics: { total: number; available: number; reserved: number; soldThisMonth: number };
  financials: { investedInventory: number; projectedRevenue: number; projectedGrossProfit: number } | null;
  pipeline: Array<{ label: string; count: number }>;
  salesSeries: Array<{ month: string; units: number; revenue: number }>;
  alerts: Array<{ level: string; title: string; detail: string; action: string }>;
  testDrives: Array<{ time: string; customer: string; vehicle: string; agent: string }>;
  oldestVehicles: DashboardVehicle[];
};
