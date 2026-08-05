"use client";

import { useMemo, useState } from "react";
import { CarFront, Filter, Plus, Search, SlidersHorizontal } from "lucide-react";
import { demoVehicles } from "@/lib/demo-data";
import { formatPeso } from "@/lib/formatting/philippines";

export function VehicleInventory() {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All statuses");
  const filtered = useMemo(() => demoVehicles.filter((vehicle) => {
    const matchesQuery = `${vehicle.stock} ${vehicle.make} ${vehicle.model}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (status === "All statuses" || vehicle.status === status);
  }), [query, status]);

  return <div className="inventory-page">
    <div className="page-heading page-heading-actions"><div><p className="eyebrow">Dealership</p><h2>Vehicle inventory</h2><p>Phase 1 read model showing stock identity, workflow state, pricing, and aging.</p></div><button className="button button-primary"><Plus size={16} /> Add vehicle</button></div>
    <section className="inventory-toolbar card"><label className="inventory-search"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search stock number, make, or model" /></label><label className="inventory-filter"><Filter size={16} /><select value={status} onChange={(event) => setStatus(event.target.value)}><option>All statuses</option>{Array.from(new Set(demoVehicles.map((vehicle) => vehicle.status))).map((item) => <option key={item}>{item}</option>)}</select></label><button className="button button-secondary"><SlidersHorizontal size={16} /> More filters</button></section>
    <section className="inventory-table-card card">
      <div className="inventory-table-summary"><div><strong>{filtered.length}</strong><span>vehicles shown</span></div><p><span className="status-dot" /> Live demo inventory</p></div>
      <div className="responsive-table"><table><thead><tr><th>Vehicle</th><th>Stock no.</th><th>Status</th><th>List price</th><th>Inventory age</th></tr></thead><tbody>{filtered.map((vehicle) => <tr key={vehicle.stock}><td><div className="vehicle-cell"><span><CarFront size={18} /></span><div><strong>{vehicle.year} {vehicle.make}</strong><small>{vehicle.model}</small></div></div></td><td><code>{vehicle.stock}</code></td><td><span className={`vehicle-status status-${vehicle.status.toLowerCase().replaceAll(" ", "-")}`}>{vehicle.status}</span></td><td><strong>{formatPeso(vehicle.price)}</strong></td><td><span className={vehicle.age > 45 ? "age-critical" : ""}>{vehicle.age} days</span></td></tr>)}</tbody></table></div>
      {filtered.length === 0 ? <div className="table-empty"><CarFront size={30} /><h3>No vehicles match these filters</h3><p>Try a broader search or clear the selected status.</p></div> : null}
    </section>
  </div>;
}
