import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { ModuleSettings } from "@/features/settings/module-settings";
it("shows Fleet and Rental as disabled upgrades", () => { render(<ModuleSettings modules={[{ key: "dealership", name: "Dealership", enabled: true, description: "Core" },{ key: "fleet_management", name: "Fleet Management", enabled: false, description: "Future" },{ key: "vehicle_rental", name: "Vehicle Rental", enabled: false, description: "Future" }]} />); expect(screen.getByText("Fleet Management")).toBeInTheDocument(); expect(screen.getAllByText("Available upgrade")).toHaveLength(2); });
