import { NextResponse, type NextRequest } from "next/server";
import type { DemoRole } from "@/features/permissions/types";

const roles = new Set<DemoRole>(["owner", "branch-manager", "sales-agent", "inventory-staff", "viewer"]);
export async function GET(request: NextRequest) {
  const role = request.nextUrl.searchParams.get("role") as DemoRole | null;
  const response = NextResponse.redirect(new URL("/dashboard", request.url));
  if (role && roles.has(role)) response.cookies.set("carsys_demo_role", role, { httpOnly: true, sameSite: "lax", path: "/" });
  return response;
}
