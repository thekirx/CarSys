import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const defaultPassword = process.env.DEMO_DEFAULT_PASSWORD;

if (!url || !serviceRoleKey || !defaultPassword) {
  console.error("Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or DEMO_DEFAULT_PASSWORD.");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
const organizationId = "10000000-0000-0000-0000-000000000001";
const branchId = "30000000-0000-0000-0000-000000000001";
const users = [
  { email: "owner@apexautohaus.demo", name: "Kirk Orino", roleId: "50000000-0000-0000-0000-000000000001", scope: "organization" },
  { email: "manager@apexautohaus.demo", name: "Bianca Santos", roleId: "50000000-0000-0000-0000-000000000002", scope: "assigned_branches" },
  { email: "sales@apexautohaus.demo", name: "Paolo Reyes", roleId: "50000000-0000-0000-0000-000000000003", scope: "assigned_branches" },
  { email: "inventory@apexautohaus.demo", name: "Mika dela Cruz", roleId: "50000000-0000-0000-0000-000000000004", scope: "assigned_branches" },
  { email: "viewer@apexautohaus.demo", name: "Angela Lim", roleId: "50000000-0000-0000-0000-000000000005", scope: "assigned_branches" },
];

for (const record of users) {
  const { data: created, error: createError } = await supabase.auth.admin.createUser({
    email: record.email,
    password: defaultPassword,
    email_confirm: true,
    user_metadata: { display_name: record.name },
  });

  let user = created.user;
  if (createError?.message?.includes("already been registered")) {
    const { data: page, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listError) throw listError;
    user = page.users.find((candidate) => candidate.email === record.email) ?? null;
  } else if (createError) {
    throw createError;
  }
  if (!user) throw new Error(`Unable to resolve Auth user for ${record.email}`);

  const { error: profileError } = await supabase.from("profiles").upsert({ id: user.id, display_name: record.name, email: record.email }, { onConflict: "id" });
  if (profileError) throw profileError;

  const { data: membership, error: membershipError } = await supabase.from("organization_memberships").upsert({
    organization_id: organizationId,
    user_id: user.id,
    role_id: record.roleId,
    status: "active",
    scope: record.scope,
    joined_at: new Date().toISOString(),
  }, { onConflict: "organization_id,user_id" }).select("id").single();
  if (membershipError) throw membershipError;

  if (record.scope === "assigned_branches") {
    const { error: assignmentError } = await supabase.from("membership_branches").upsert({ membership_id: membership.id, branch_id: branchId }, { onConflict: "membership_id,branch_id" });
    if (assignmentError) throw assignmentError;
  }
  console.log(`Ready: ${record.email}`);
}

console.log("Demo users created. Passwords and service credentials were not printed.");
