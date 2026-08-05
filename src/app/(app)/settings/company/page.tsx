import { CompanyForm, type CompanyFormValues } from "@/features/settings/company-form";
import { requirePagePermission } from "@/features/permissions/guards";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const demoCompany: CompanyFormValues = {
  name: "Apex Autohaus",
  email: "operations@apexautohaus.ph",
  phone: "+639171234567",
  address: "1128 EDSA, Quezon City, Metro Manila, Philippines",
  timezone: "Asia/Manila",
  currency: "PHP",
};

export default async function CompanySettingsPage() {
  const context = await requirePagePermission("settings.manage");
  let initialValues = demoCompany;
  if (!context.demoMode) {
    const supabase = await createServerSupabaseClient();
    const { data: organization } = await supabase
      .from("organizations")
      .select("name, email, phone, address, timezone, currency")
      .eq("id", context.organizationId)
      .single();
    if (organization) {
      initialValues = {
        name: organization.name,
        email: organization.email ?? "",
        phone: organization.phone ?? "",
        address: organization.address ?? "",
        timezone: organization.timezone,
        currency: organization.currency,
      };
    }
  }
  return <div className="settings-page"><div className="page-heading"><div><p className="eyebrow">Organization</p><h2>Company settings</h2><p>Manage the business identity and Philippine operating defaults for this workspace.</p></div></div><section className="settings-card"><CompanyForm initialValues={initialValues} /></section></div>;
}
