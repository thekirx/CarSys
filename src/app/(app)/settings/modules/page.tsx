import { ModuleSettings } from "@/features/settings/module-settings";
import { getModuleSettings } from "@/features/settings/module-queries";
import { requirePagePermission } from "@/features/permissions/guards";

export default async function ModulesPage() {
  const context = await requirePagePermission("modules.manage");
  const modules = await getModuleSettings(context);
  return <div className="settings-page"><div className="page-heading"><div><p className="eyebrow">Workspace capabilities</p><h2>Modules</h2><p>Dealership operations are active. Future modules remain separate until their workflows are scoped.</p></div></div><ModuleSettings modules={modules} /></div>;
}
