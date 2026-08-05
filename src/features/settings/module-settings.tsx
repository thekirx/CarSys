import { Boxes, CarFront, Check, Clock4, KeyRound } from "lucide-react";

export type ModuleRecord = { key: "dealership" | "fleet_management" | "vehicle_rental"; name: string; enabled: boolean; description: string };

const iconByKey = { dealership: CarFront, fleet_management: Boxes, vehicle_rental: KeyRound } as const;

export function ModuleSettings({ modules }: { modules: ModuleRecord[] }) {
  return <div className="module-grid">{modules.map((module) => {
    const Icon = iconByKey[module.key];
    return <article className={`module-card ${module.enabled ? "module-enabled" : ""}`} key={module.key}>
      <div className="module-card-head"><span className="module-icon"><Icon size={22} /></span><span className={module.enabled ? "status-enabled" : "status-upgrade"}>{module.enabled ? <><Check size={13} /> Enabled</> : <><Clock4 size={13} /> Available upgrade</>}</span></div>
      <h3>{module.name}</h3><p>{module.description}</p>
      <div className="module-capabilities">{module.key === "dealership" ? <><span>Vehicle inventory</span><span>Sales pipeline</span><span>Customer records</span></> : module.key === "fleet_management" ? <><span>Fleet assignments</span><span>Maintenance planning</span><span>Utilization reports</span></> : <><span>Rental availability</span><span>Contracts</span><span>Returns workflow</span></>}</div>
      {module.enabled ? <div className="module-footer"><span className="status-dot" /> Core module active</div> : <div className="module-footer muted">Contact Optrizo to scope this module.</div>}
    </article>;
  })}</div>;
}
