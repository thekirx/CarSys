begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(71);

-- Schema and RLS assertions. Removing a table or forgetting to enable RLS
-- makes the corresponding assertion fail independently.
select has_table('public', 'organizations', 'organizations exists');
select has_table('public', 'modules', 'modules exists');
select has_table('public', 'organization_modules', 'organization_modules exists');
select has_table('public', 'profiles', 'profiles exists');
select has_table('public', 'roles', 'roles exists');
select has_table('public', 'permissions', 'permissions exists');
select has_table('public', 'role_permissions', 'role_permissions exists');
select has_table('public', 'organization_memberships', 'organization_memberships exists');
select has_table('public', 'branches', 'branches exists');
select has_table('public', 'membership_branches', 'membership_branches exists');
select has_table('public', 'vehicles', 'vehicles exists');
select has_table('public', 'vehicle_financials', 'vehicle_financials exists');
select has_table('public', 'dashboard_snapshots', 'dashboard_snapshots exists');
select has_table('public', 'notifications', 'notifications exists');
select has_table('public', 'audit_logs', 'audit_logs exists');

select ok((select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = 'organizations'), 'organizations has RLS enabled');
select ok((select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = 'modules'), 'modules has RLS enabled');
select ok((select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = 'organization_modules'), 'organization_modules has RLS enabled');
select ok((select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = 'profiles'), 'profiles has RLS enabled');
select ok((select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = 'roles'), 'roles has RLS enabled');
select ok((select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = 'permissions'), 'permissions has RLS enabled');
select ok((select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = 'role_permissions'), 'role_permissions has RLS enabled');
select ok((select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = 'organization_memberships'), 'organization_memberships has RLS enabled');
select ok((select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = 'branches'), 'branches has RLS enabled');
select ok((select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = 'membership_branches'), 'membership_branches has RLS enabled');
select ok((select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = 'vehicles'), 'vehicles has RLS enabled');
select ok((select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = 'vehicle_financials'), 'vehicle_financials has RLS enabled');
select ok((select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = 'dashboard_snapshots'), 'dashboard_snapshots has RLS enabled');
select ok((select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = 'notifications'), 'notifications has RLS enabled');
select ok((select c.relrowsecurity from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname = 'audit_logs'), 'audit_logs has RLS enabled');

-- A PUBLIC or anon EXECUTE ACL, or a non-empty function search_path, breaks
-- the security boundary these assertions protect.
select ok(not exists (
  select 1 from pg_catalog.pg_proc p
  join pg_catalog.pg_namespace n on n.oid = p.pronamespace
  cross join lateral pg_catalog.aclexplode(coalesce(p.proacl, pg_catalog.acldefault('f', p.proowner))) acl
  where n.nspname = 'private' and p.proname = 'is_active_member'
    and acl.privilege_type = 'EXECUTE'
    and (acl.grantee = 0 or acl.grantee = (select oid from pg_catalog.pg_roles where rolname = 'anon'))
), 'is_active_member is not executable by PUBLIC or anon');
select ok(not exists (
  select 1 from pg_catalog.pg_proc p
  join pg_catalog.pg_namespace n on n.oid = p.pronamespace
  cross join lateral pg_catalog.aclexplode(coalesce(p.proacl, pg_catalog.acldefault('f', p.proowner))) acl
  where n.nspname = 'private' and p.proname = 'has_permission'
    and acl.privilege_type = 'EXECUTE'
    and (acl.grantee = 0 or acl.grantee = (select oid from pg_catalog.pg_roles where rolname = 'anon'))
), 'has_permission is not executable by PUBLIC or anon');
select ok(not exists (
  select 1 from pg_catalog.pg_proc p
  join pg_catalog.pg_namespace n on n.oid = p.pronamespace
  cross join lateral pg_catalog.aclexplode(coalesce(p.proacl, pg_catalog.acldefault('f', p.proowner))) acl
  where n.nspname = 'private' and p.proname = 'can_access_branch'
    and acl.privilege_type = 'EXECUTE'
    and (acl.grantee = 0 or acl.grantee = (select oid from pg_catalog.pg_roles where rolname = 'anon'))
), 'can_access_branch is not executable by PUBLIC or anon');
select ok(not exists (
  select 1 from pg_catalog.pg_proc p
  join pg_catalog.pg_namespace n on n.oid = p.pronamespace
  cross join lateral pg_catalog.aclexplode(coalesce(p.proacl, pg_catalog.acldefault('f', p.proowner))) acl
  where n.nspname = 'private' and p.proname = 'can_view_profile'
    and acl.privilege_type = 'EXECUTE'
    and (acl.grantee = 0 or acl.grantee = (select oid from pg_catalog.pg_roles where rolname = 'anon'))
), 'can_view_profile is not executable by PUBLIC or anon');

select ok((select coalesce(bool_or(pg_catalog.regexp_replace(setting, '^search_path=', '') in ('', '""')), false) from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace cross join lateral unnest(p.proconfig) setting where n.nspname = 'private' and p.proname = 'is_active_member' and setting like 'search_path=%'), 'is_active_member has an empty fixed search_path');
select ok((select coalesce(bool_or(pg_catalog.regexp_replace(setting, '^search_path=', '') in ('', '""')), false) from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace cross join lateral unnest(p.proconfig) setting where n.nspname = 'private' and p.proname = 'has_permission' and setting like 'search_path=%'), 'has_permission has an empty fixed search_path');
select ok((select coalesce(bool_or(pg_catalog.regexp_replace(setting, '^search_path=', '') in ('', '""')), false) from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace cross join lateral unnest(p.proconfig) setting where n.nspname = 'private' and p.proname = 'can_access_branch' and setting like 'search_path=%'), 'can_access_branch has an empty fixed search_path');
select ok((select coalesce(bool_or(pg_catalog.regexp_replace(setting, '^search_path=', '') in ('', '""')), false) from pg_catalog.pg_proc p join pg_catalog.pg_namespace n on n.oid = p.pronamespace cross join lateral unnest(p.proconfig) setting where n.nspname = 'private' and p.proname = 'can_view_profile' and setting like 'search_path=%'), 'can_view_profile has an empty fixed search_path');

select results_eq(
  $$select key::text from public.modules order by key$$,
  $$values ('dealership'::text), ('fleet_management'::text), ('vehicle_rental'::text)$$,
  'the global module catalog contains all required module keys'
);

select results_eq(
  $$select key from public.permissions order by key$$,
  $$
    values
      ('audit_logs.read'::text),
      ('financials.view_sensitive'::text),
      ('modules.manage'::text),
      ('reports.read'::text),
      ('settings.manage'::text),
      ('users.manage'::text),
      ('vehicles.manage'::text),
      ('vehicles.read'::text)
  $$,
  'the global permission catalog contains exactly the eight stable keys'
);

-- Deterministic fixtures are installed as the test runner role, which bypasses
-- RLS only for setup. Assertions below switch to authenticated JWT contexts.
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner-a@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'viewer-a@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sales-a@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'branch-a@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'inactive-a@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'invited-a@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000107', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'suspended-a@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'owner-b@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.profiles (id, display_name) values
  ('00000000-0000-0000-0000-000000000101', 'Owner A'),
  ('00000000-0000-0000-0000-000000000102', 'Viewer A'),
  ('00000000-0000-0000-0000-000000000103', 'Sales Agent A'),
  ('00000000-0000-0000-0000-000000000104', 'Branch User A'),
  ('00000000-0000-0000-0000-000000000105', 'Inactive User A'),
  ('00000000-0000-0000-0000-000000000106', 'Invited User A'),
  ('00000000-0000-0000-0000-000000000107', 'Suspended User A'),
  ('00000000-0000-0000-0000-000000000201', 'Owner B');

insert into public.organizations (id, company_name, slug) values
  ('10000000-0000-0000-0000-000000000001', 'Organization A', 'org-a'),
  ('20000000-0000-0000-0000-000000000001', 'Organization B', 'org-b');

insert into public.roles (id, organization_id, code, name, is_system) values
  ('10000000-0000-0000-0000-000000000101', '10000000-0000-0000-0000-000000000001', 'owner', 'Owner', true),
  ('10000000-0000-0000-0000-000000000102', '10000000-0000-0000-0000-000000000001', 'viewer', 'Viewer', true),
  ('10000000-0000-0000-0000-000000000103', '10000000-0000-0000-0000-000000000001', 'sales_agent', 'Sales Agent', true),
  ('20000000-0000-0000-0000-000000000101', '20000000-0000-0000-0000-000000000001', 'owner', 'Owner', true);

insert into public.role_permissions (organization_id, role_id, permission_id)
select '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000101', id
from public.permissions;

insert into public.role_permissions (organization_id, role_id, permission_id)
select '20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000101', id
from public.permissions;

insert into public.role_permissions (organization_id, role_id, permission_id)
select '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000103', id
from public.permissions where key = 'vehicles.manage';

insert into public.role_permissions (organization_id, role_id, permission_id)
select '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000102', id
from public.permissions where key in ('vehicles.read', 'reports.read');

insert into public.organization_memberships (id, organization_id, user_id, role_id, status, organization_scope, joined_at, inactivated_at) values
  ('10000000-0000-0000-0000-000000000201', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', '10000000-0000-0000-0000-000000000101', 'active', 'organization', now(), null),
  ('10000000-0000-0000-0000-000000000202', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000102', '10000000-0000-0000-0000-000000000102', 'active', 'organization', now(), null),
  ('10000000-0000-0000-0000-000000000203', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000103', '10000000-0000-0000-0000-000000000103', 'active', 'organization', now(), null),
  ('10000000-0000-0000-0000-000000000204', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000104', '10000000-0000-0000-0000-000000000102', 'active', 'assigned_branches', now(), null),
  ('10000000-0000-0000-0000-000000000205', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000105', '10000000-0000-0000-0000-000000000102', 'inactive', 'organization', null, now()),
  ('10000000-0000-0000-0000-000000000206', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000106', '10000000-0000-0000-0000-000000000102', 'invited', 'organization', null, null),
  ('10000000-0000-0000-0000-000000000207', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000107', '10000000-0000-0000-0000-000000000102', 'suspended', 'organization', now(), now()),
  ('20000000-0000-0000-0000-000000000201', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000201', '20000000-0000-0000-0000-000000000101', 'active', 'organization', now(), null);

insert into public.branches (id, organization_id, code, name, is_primary) values
  ('10000000-0000-0000-0000-000000000301', '10000000-0000-0000-0000-000000000001', 'A-MNL', 'A Manila', true),
  ('10000000-0000-0000-0000-000000000302', '10000000-0000-0000-0000-000000000001', 'A-CEB', 'A Cebu', false),
  ('20000000-0000-0000-0000-000000000301', '20000000-0000-0000-0000-000000000001', 'B-MNL', 'B Manila', true);

insert into public.membership_branches (organization_id, membership_id, branch_id) values
  ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000204', '10000000-0000-0000-0000-000000000301');

insert into public.organization_modules (organization_id, module_id, is_enabled, enabled_at, enabled_by)
select '10000000-0000-0000-0000-000000000001', id, true, now(), '00000000-0000-0000-0000-000000000101'
from public.modules where key = 'dealership';

insert into public.vehicles (id, organization_id, branch_id, stock_number, model_year, make, model, workflow_status, list_price) values
  ('10000000-0000-0000-0000-000000000401', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000301', 'A-001', 2024, 'Toyota', 'Vios', 'available', 800000),
  ('10000000-0000-0000-0000-000000000402', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000302', 'A-002', 2023, 'Honda', 'City', 'available', 850000),
  ('20000000-0000-0000-0000-000000000401', '20000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000301', 'B-001', 2025, 'Mitsubishi', 'Mirage', 'available', 900000);

insert into public.vehicle_financials (organization_id, vehicle_id, acquisition_value, total_invested_value, expected_profit, receivables)
values ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000401', 500000, 550000, 250000, 0);

insert into public.dashboard_snapshots (organization_id, branch_id, metric_key, period_start, period_end, payload, is_sensitive)
values
  ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000301', 'inventory.count', '2026-08-01', '2026-08-01', '{"count":1}', false),
  ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000302', 'inventory.cebu', '2026-08-01', '2026-08-01', '{"count":1}', false),
  ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000301', 'inventory.gross_margin', '2026-08-01', '2026-08-01', '{"amount":250000}', true);

insert into public.audit_logs (id, organization_id, actor_id, action, entity_type, entity_id)
values ('10000000-0000-0000-0000-000000000501', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'vehicle.created', 'vehicle', '10000000-0000-0000-0000-000000000401');

insert into public.notifications (id, organization_id, recipient_id, category, title, body)
values ('10000000-0000-0000-0000-000000000601', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000105', 'membership', 'Inactive notice', 'This row must not be visible after membership becomes inactive.');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000101","role":"authenticated"}', true);
select results_eq(
  $$select slug from public.organizations order by slug$$,
  $$values ('org-a'::text)$$,
  'an active member sees only its organization'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000201","role":"authenticated"}', true);
select is_empty(
  $$select id from public.vehicles where organization_id = '10000000-0000-0000-0000-000000000001'$$,
  'a user from another organization cannot read tenant vehicles'
);
select throws_ok(
  $$insert into public.vehicles (organization_id, branch_id, stock_number, model_year, make, model, list_price) values ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000301', 'ILLEGAL', 2024, 'Bad', 'Write', 1)$$,
  '42501',
  'new row violates row-level security policy for table "vehicles"',
  'a user from another organization cannot write tenant vehicles'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000105","role":"authenticated"}', true);
select is_empty(
  $$select id from public.organizations$$,
  'an inactive membership has no organization access'
);
select is_empty(
  $$select id from public.notifications where id = '10000000-0000-0000-0000-000000000601'$$,
  'an inactive recipient cannot read an organization notification'
);
select is_empty(
  $$update public.notifications set is_read = true, read_at = now() where id = '10000000-0000-0000-0000-000000000601' returning id$$,
  'an inactive recipient cannot update an organization notification'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000104","role":"authenticated"}', true);
select results_eq(
  $$select stock_number from public.vehicles order by stock_number$$,
  $$values ('A-001'::text)$$,
  'a branch-scoped user cannot read another branch vehicle'
);
select results_eq(
  $$select metric_key from public.dashboard_snapshots where not is_sensitive order by metric_key$$,
  $$values ('inventory.count'::text)$$,
  'a branch-scoped reports reader cannot read another branch snapshot'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000101","role":"authenticated"}', true);
select results_eq(
  $$select code from public.branches order by code$$,
  $$values ('A-CEB'::text), ('A-MNL'::text)$$,
  'an organization-scope Owner can read every organization branch'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000102","role":"authenticated"}', true);
select is_empty(
  $$select id from public.organization_memberships where status <> 'active'$$,
  'an ordinary active member cannot see non-active organization memberships'
);
select results_eq(
  $$select stock_number from public.vehicles order by stock_number$$,
  $$values ('A-001'::text), ('A-002'::text)$$,
  'a Viewer with vehicles.read can read ordinary organization inventory'
);
select results_eq(
  $$select metric_key from public.dashboard_snapshots where not is_sensitive order by metric_key$$,
  $$values ('inventory.cebu'::text), ('inventory.count'::text)$$,
  'a Viewer with reports.read can read non-sensitive organization reports'
);
select is_empty(
  $$update public.vehicles set list_price = 1 where id = '10000000-0000-0000-0000-000000000401' returning id$$,
  'a Viewer cannot update vehicles'
);
select throws_ok(
  $$insert into public.vehicles (organization_id, branch_id, stock_number, model_year, make, model, list_price) values ('10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000301', 'VIEWER-INSERT', 2024, 'Denied', 'Insert', 1)$$,
  '42501',
  'new row violates row-level security policy for table "vehicles"',
  'a Viewer cannot insert vehicles'
);
select is_empty(
  $$delete from public.vehicles where id = '10000000-0000-0000-0000-000000000401' returning id$$,
  'a Viewer cannot delete vehicles'
);
select is_empty(
  $$update public.organization_modules set is_enabled = false where organization_id = '10000000-0000-0000-0000-000000000001' returning id$$,
  'changing an organization module requires modules.manage'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000103","role":"authenticated"}', true);
select is_empty(
  $$select id from public.vehicles$$,
  'vehicles.manage alone does not grant inventory reads'
);
select is_empty(
  $$update public.vehicles set list_price = 810000 where id = '10000000-0000-0000-0000-000000000401' returning id$$,
  'vehicles.manage alone cannot update rows hidden by the vehicles.read policy'
);
select is_empty(
  $$select id from public.dashboard_snapshots where not is_sensitive$$,
  'an active member without reports.read cannot read non-sensitive reports'
);

reset role;
insert into public.role_permissions (organization_id, role_id, permission_id)
select '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000103', id
from public.permissions where key in ('vehicles.read', 'reports.read');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000103","role":"authenticated"}', true);
select results_eq(
  $$update public.vehicles set list_price = 810000 where id = '10000000-0000-0000-0000-000000000401' returning stock_number$$,
  $$values ('A-001'::text)$$,
  'vehicles.manage plus vehicles.read can update an accessible vehicle'
);
select results_eq(
  $$select metric_key from public.dashboard_snapshots where not is_sensitive order by metric_key$$,
  $$values ('inventory.cebu'::text), ('inventory.count'::text)$$,
  'reports.read grants non-sensitive organization reports'
);
select is_empty(
  $$select id from public.vehicle_financials$$,
  'a Sales Agent cannot read vehicle financials'
);
select is_empty(
  $$select id from public.dashboard_snapshots where is_sensitive$$,
  'a Sales Agent cannot read sensitive dashboard snapshots'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-000000000101","role":"authenticated"}', true);
select results_eq(
  $$select count(*) from public.organization_memberships where status <> 'active'$$,
  $$values (3::bigint)$$,
  'a users.manage actor can see invited, suspended, and inactive memberships'
);
select results_eq(
  $$select metric_key from public.dashboard_snapshots where is_sensitive order by metric_key$$,
  $$values ('inventory.gross_margin'::text)$$,
  'reports.read plus financials.view_sensitive grants sensitive reports'
);
select results_eq(
  $$update public.organization_memberships set status = 'active', joined_at = now(), inactivated_at = null where id = '10000000-0000-0000-0000-000000000206' returning status::text$$,
  $$values ('active'::text)$$,
  'a users.manage actor can activate an invited membership'
);
select results_eq(
  $$update public.organization_memberships set status = 'active', inactivated_at = null where id = '10000000-0000-0000-0000-000000000207' returning status::text$$,
  $$values ('active'::text)$$,
  'a users.manage actor can reactivate a suspended membership'
);
select results_eq(
  $$delete from public.organization_memberships where id = '10000000-0000-0000-0000-000000000205' returning status::text$$,
  $$values ('inactive'::text)$$,
  'a users.manage actor can delete an inactive membership'
);
select throws_ok(
  $$update public.audit_logs set reason = 'tampered' where id = '10000000-0000-0000-0000-000000000501'$$,
  '42501',
  'permission denied for table audit_logs',
  'authenticated users cannot update audit rows'
);
select throws_ok(
  $$delete from public.audit_logs where id = '10000000-0000-0000-0000-000000000501'$$,
  '42501',
  'permission denied for table audit_logs',
  'authenticated users cannot delete audit rows'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('organization-files', '20000000-0000-0000-0000-000000000001/private/other-org.txt')$$,
  '42501',
  'new row violates row-level security policy for table "objects"',
  'Storage rejects a path belonging to another organization'
);

reset role;
select * from finish();
rollback;
