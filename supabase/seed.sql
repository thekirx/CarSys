-- Deterministic Phase 1 demo tenancy. Auth-backed rows are installed by
-- scripts/create-demo-users.mjs after the corresponding Auth identities exist.

insert into public.organizations (
  id,
  company_name,
  slug,
  email,
  mobile,
  address,
  currency,
  timezone,
  is_active,
  branding,
  created_at,
  updated_at
)
values (
  'a0000000-0000-4000-8000-000000000001',
  'Apex Autohaus',
  'apex-autohaus',
  'hello@apex-autohaus.example',
  '+63 917 000 0101',
  '{"line1":"101 Fictional Avenue","barangay":"Bagong Pag-asa","city":"Quezon City","province":"Metro Manila","postal_code":"1105","country":"PH"}'::jsonb,
  'PHP',
  'Asia/Manila',
  true,
  '{"primary_color":"#0f172a","accent_color":"#f59e0b","wordmark":"Apex Autohaus"}'::jsonb,
  '2026-08-02 09:00:00+08',
  '2026-08-02 09:00:00+08'
)
on conflict (slug) do update
set company_name = excluded.company_name,
    email = excluded.email,
    mobile = excluded.mobile,
    address = excluded.address,
    currency = excluded.currency,
    timezone = excluded.timezone,
    is_active = excluded.is_active,
    branding = excluded.branding,
    updated_at = excluded.updated_at;

insert into public.branches (
  id,
  organization_id,
  code,
  name,
  address,
  is_primary,
  is_active,
  created_at,
  updated_at
)
select
  'a0000000-0000-4000-8000-000000000101',
  organization.id,
  'QC-MAIN',
  'Quezon City Main',
  '{"line1":"101 Fictional Avenue","barangay":"Bagong Pag-asa","city":"Quezon City","province":"Metro Manila","postal_code":"1105","country":"PH"}'::jsonb,
  true,
  true,
  '2026-08-02 09:00:00+08',
  '2026-08-02 09:00:00+08'
from public.organizations organization
where organization.slug = 'apex-autohaus'
on conflict (organization_id, code) do update
set name = excluded.name,
    address = excluded.address,
    is_primary = excluded.is_primary,
    is_active = excluded.is_active,
    updated_at = excluded.updated_at;

insert into public.organization_modules (
  id,
  organization_id,
  module_id,
  is_enabled,
  enabled_at,
  enabled_by,
  created_at,
  updated_at
)
select
  module_seed.id,
  organization.id,
  module.id,
  module_seed.is_enabled,
  case
    when module_seed.is_enabled then '2026-08-02 09:00:00+08'::timestamptz
    else null
  end,
  null,
  '2026-08-02 09:00:00+08',
  '2026-08-02 09:00:00+08'
from public.organizations organization
cross join (
  values
    ('a2000000-0000-4000-8000-000000000001'::uuid, 'dealership'::public.module_key, true),
    ('a2000000-0000-4000-8000-000000000002'::uuid, 'fleet_management'::public.module_key, false),
    ('a2000000-0000-4000-8000-000000000003'::uuid, 'vehicle_rental'::public.module_key, false)
) as module_seed(id, key, is_enabled)
join public.modules module on module.key = module_seed.key
where organization.slug = 'apex-autohaus'
on conflict (organization_id, module_id) do update
set is_enabled = excluded.is_enabled,
    enabled_at = excluded.enabled_at,
    enabled_by = excluded.enabled_by,
    updated_at = excluded.updated_at;

insert into public.roles (
  id,
  organization_id,
  code,
  name,
  description,
  is_system,
  created_at,
  updated_at
)
select
  role_seed.id,
  organization.id,
  role_seed.code,
  role_seed.name,
  role_seed.description,
  true,
  '2026-08-02 09:00:00+08',
  '2026-08-02 09:00:00+08'
from public.organizations organization
cross join (
  values
    ('a1000000-0000-4000-8000-000000000001'::uuid, 'owner'::text, 'Owner'::text, 'Organization-wide administration, financials, modules, users, and audit visibility.'::text),
    ('a1000000-0000-4000-8000-000000000002'::uuid, 'branch_manager'::text, 'Branch Manager'::text, 'Assigned-branch operations without organization administration or sensitive financials.'::text),
    ('a1000000-0000-4000-8000-000000000003'::uuid, 'sales_agent'::text, 'Sales Agent'::text, 'Assigned-branch inventory visibility without sensitive financials or administrative mutation.'::text),
    ('a1000000-0000-4000-8000-000000000004'::uuid, 'inventory_staff'::text, 'Inventory Staff'::text, 'Assigned-branch vehicle preparation and inventory record maintenance.'::text),
    ('a1000000-0000-4000-8000-000000000005'::uuid, 'viewer'::text, 'Viewer'::text, 'Read-only assigned-branch visibility without sensitive financials.'::text)
) as role_seed(id, code, name, description)
where organization.slug = 'apex-autohaus'
on conflict (organization_id, code) do update
set name = excluded.name,
    description = excluded.description,
    is_system = excluded.is_system,
    updated_at = excluded.updated_at;

insert into public.role_permissions (
  id,
  organization_id,
  role_id,
  permission_id,
  created_at
)
select
  permission_seed.id,
  organization.id,
  role.id,
  permission.id,
  '2026-08-02 09:00:00+08'
from public.organizations organization
join public.roles role on role.organization_id = organization.id
cross join (
  values
    ('a3000000-0000-4000-8000-000000000001'::uuid, 'owner'::text, 'settings.manage'::text),
    ('a3000000-0000-4000-8000-000000000002'::uuid, 'owner'::text, 'modules.manage'::text),
    ('a3000000-0000-4000-8000-000000000003'::uuid, 'owner'::text, 'users.manage'::text),
    ('a3000000-0000-4000-8000-000000000004'::uuid, 'owner'::text, 'vehicles.manage'::text),
    ('a3000000-0000-4000-8000-000000000005'::uuid, 'owner'::text, 'financials.view_sensitive'::text),
    ('a3000000-0000-4000-8000-000000000006'::uuid, 'owner'::text, 'audit_logs.read'::text),
    ('a3000000-0000-4000-8000-000000000007'::uuid, 'branch_manager'::text, 'vehicles.manage'::text),
    ('a3000000-0000-4000-8000-000000000008'::uuid, 'inventory_staff'::text, 'vehicles.manage'::text)
) as permission_seed(id, role_code, permission_key)
join public.permissions permission on permission.key = permission_seed.permission_key
where organization.slug = 'apex-autohaus'
  and role.code = permission_seed.role_code
on conflict (organization_id, role_id, permission_id) do update
set created_at = excluded.created_at;

-- System role grants are authoritative. Remove stale grants so repeat seeding
-- cannot retain a permission that the documented matrix no longer allows.
delete from public.role_permissions role_permission
using public.organizations organization, public.roles role, public.permissions permission
where role_permission.organization_id = organization.id
  and role_permission.role_id = role.id
  and role_permission.permission_id = permission.id
  and organization.slug = 'apex-autohaus'
  and role.is_system
  and role.code in ('owner', 'branch_manager', 'sales_agent', 'inventory_staff', 'viewer')
  and not exists (
    select 1
    from (
      values
        ('owner'::text, 'settings.manage'::text),
        ('owner'::text, 'modules.manage'::text),
        ('owner'::text, 'users.manage'::text),
        ('owner'::text, 'vehicles.manage'::text),
        ('owner'::text, 'financials.view_sensitive'::text),
        ('owner'::text, 'audit_logs.read'::text),
        ('branch_manager'::text, 'vehicles.manage'::text),
        ('inventory_staff'::text, 'vehicles.manage'::text)
    ) as allowed(role_code, permission_key)
    where allowed.role_code = role.code
      and allowed.permission_key = permission.key
  );

insert into public.vehicles (
  id,
  organization_id,
  branch_id,
  stock_number,
  model_year,
  make,
  model,
  variant,
  workflow_status,
  list_price,
  acquired_at,
  listed_at,
  released_at,
  created_at,
  updated_at
)
select
  vehicle_seed.id,
  organization.id,
  branch.id,
  vehicle_seed.stock_number,
  vehicle_seed.model_year,
  vehicle_seed.make,
  vehicle_seed.model,
  vehicle_seed.variant,
  vehicle_seed.workflow_status,
  vehicle_seed.list_price,
  vehicle_seed.acquired_at,
  vehicle_seed.listed_at,
  vehicle_seed.released_at,
  vehicle_seed.acquired_at,
  '2026-08-02 09:00:00+08'
from public.organizations organization
join public.branches branch
  on branch.organization_id = organization.id
 and branch.code = 'QC-MAIN'
cross join (
  values
    ('a4000000-0000-4000-8000-000000000001'::uuid, 'QC-2026-001'::text, 2024::smallint, 'Toyota'::text, 'Vios'::text, 'XLE CVT'::text, 'acquired'::public.vehicle_workflow_status, 685000.00::numeric, '2026-08-01 09:00:00+08'::timestamptz, null::timestamptz, null::timestamptz),
    ('a4000000-0000-4000-8000-000000000002', 'QC-2026-002', 2023, 'Mitsubishi', 'Mirage G4', 'GLX CVT', 'acquired', 575000.00, '2026-07-31 10:00:00+08', null, null),
    ('a4000000-0000-4000-8000-000000000003', 'QC-2026-003', 2024, 'Honda', 'City', 'S CVT', 'for_inspection', 825000.00, '2026-07-29 11:00:00+08', null, null),
    ('a4000000-0000-4000-8000-000000000004', 'QC-2026-004', 2023, 'Nissan', 'Almera', 'VL Turbo CVT', 'for_inspection', 790000.00, '2026-07-28 13:00:00+08', null, null),
    ('a4000000-0000-4000-8000-000000000005', 'QC-2026-005', 2022, 'Suzuki', 'Dzire', 'GL AGS', 'for_repair_or_preparation', 545000.00, '2026-07-26 09:30:00+08', null, null),
    ('a4000000-0000-4000-8000-000000000006', 'QC-2026-006', 2023, 'Toyota', 'Innova', 'E Diesel A/T', 'for_repair_or_preparation', 1050000.00, '2026-07-24 15:00:00+08', null, null),
    ('a4000000-0000-4000-8000-000000000007', 'QC-2026-007', 2022, 'Mitsubishi', 'Xpander', 'GLS A/T', 'ready_for_listing', 965000.00, '2026-07-22 14:00:00+08', null, null),
    ('a4000000-0000-4000-8000-000000000008', 'QC-2026-008', 2023, 'Suzuki', 'Ertiga', 'GL A/T', 'ready_for_listing', 890000.00, '2026-07-20 10:30:00+08', null, null),
    ('a4000000-0000-4000-8000-000000000009', 'QC-2026-009', 2024, 'Toyota', 'Fortuner', 'V Diesel A/T', 'available', 2050000.00, '2026-07-18 11:00:00+08', '2026-07-24 09:00:00+08', null),
    ('a4000000-0000-4000-8000-000000000010', 'QC-2026-010', 2023, 'Mitsubishi', 'Montero Sport', 'GLS A/T', 'available', 1650000.00, '2026-07-15 09:00:00+08', '2026-07-21 09:00:00+08', null),
    ('a4000000-0000-4000-8000-000000000011', 'QC-2026-011', 2023, 'Nissan', 'Terra', 'VE A/T', 'available', 1550000.00, '2026-07-12 13:00:00+08', '2026-07-18 09:00:00+08', null),
    ('a4000000-0000-4000-8000-000000000012', 'QC-2026-012', 2022, 'Ford', 'Everest', 'Trend A/T', 'available', 1480000.00, '2026-07-09 10:00:00+08', '2026-07-15 09:00:00+08', null),
    ('a4000000-0000-4000-8000-000000000013', 'QC-2026-013', 2023, 'Isuzu', 'mu-X', 'LS-A A/T', 'available', 1580000.00, '2026-06-08 14:00:00+08', '2026-06-14 09:00:00+08', null),
    ('a4000000-0000-4000-8000-000000000014', 'QC-2026-014', 2022, 'Toyota', 'Hiace', 'Commuter Deluxe', 'reserved', 1420000.00, '2026-07-08 09:00:00+08', '2026-07-14 09:00:00+08', null),
    ('a4000000-0000-4000-8000-000000000015', 'QC-2026-015', 2023, 'Nissan', 'Urvan', 'Premium A/T', 'reserved', 1350000.00, '2026-07-07 11:00:00+08', '2026-07-13 09:00:00+08', null),
    ('a4000000-0000-4000-8000-000000000016', 'QC-2026-016', 2024, 'Honda', 'BR-V', 'VX CVT', 'reserved', 1120000.00, '2026-07-06 10:00:00+08', '2026-07-12 09:00:00+08', null),
    ('a4000000-0000-4000-8000-000000000017', 'QC-2026-017', 2023, 'Toyota', 'Raize', 'G CVT', 'sold', 980000.00, '2026-06-30 09:00:00+08', '2026-07-06 09:00:00+08', null),
    ('a4000000-0000-4000-8000-000000000018', 'QC-2026-018', 2024, 'Honda', 'Brio', 'RS CVT', 'sold', 735000.00, '2026-06-28 11:00:00+08', '2026-07-04 09:00:00+08', null),
    ('a4000000-0000-4000-8000-000000000019', 'QC-2026-019', 2023, 'Kia', 'Soluto', 'EX A/T', 'sold', 615000.00, '2026-06-25 13:00:00+08', '2026-07-01 09:00:00+08', null),
    ('a4000000-0000-4000-8000-000000000020', 'QC-2026-020', 2022, 'Hyundai', 'Accent', 'GL A/T', 'released', 690000.00, '2026-06-22 10:00:00+08', '2026-06-28 09:00:00+08', '2026-07-29 15:00:00+08'),
    ('a4000000-0000-4000-8000-000000000021', 'QC-2026-021', 2023, 'Mazda', '3', 'Sport A/T', 'released', 1150000.00, '2026-06-20 09:00:00+08', '2026-06-26 09:00:00+08', '2026-07-27 14:00:00+08'),
    ('a4000000-0000-4000-8000-000000000022', 'QC-2026-022', 2021, 'Subaru', 'XV', '2.0i-S EyeSight', 'withdrawn', 1090000.00, '2026-06-18 11:00:00+08', '2026-06-24 09:00:00+08', null),
    ('a4000000-0000-4000-8000-000000000023', 'QC-2026-023', 2023, 'Ford', 'Ranger', 'Sport 4x2 A/T', 'returned_to_supplier', 1320000.00, '2026-06-15 10:00:00+08', null, null),
    ('a4000000-0000-4000-8000-000000000024', 'QC-2026-024', 2022, 'Isuzu', 'D-Max', 'LS 4x2 A/T', 'written_off', 1180000.00, '2026-06-12 09:00:00+08', null, null),
    ('a4000000-0000-4000-8000-000000000025', 'QC-2026-025', 2021, 'Toyota', 'Hilux', 'Conquest 4x2 A/T', 'archived', 1250000.00, '2026-06-10 10:00:00+08', '2026-06-16 09:00:00+08', null)
) as vehicle_seed(
  id,
  stock_number,
  model_year,
  make,
  model,
  variant,
  workflow_status,
  list_price,
  acquired_at,
  listed_at,
  released_at
)
where organization.slug = 'apex-autohaus'
on conflict (organization_id, stock_number) do update
set branch_id = excluded.branch_id,
    model_year = excluded.model_year,
    make = excluded.make,
    model = excluded.model,
    variant = excluded.variant,
    workflow_status = excluded.workflow_status,
    list_price = excluded.list_price,
    acquired_at = excluded.acquired_at,
    listed_at = excluded.listed_at,
    released_at = excluded.released_at,
    updated_at = excluded.updated_at;

insert into public.vehicle_financials (
  id,
  organization_id,
  vehicle_id,
  acquisition_value,
  total_invested_value,
  expected_profit,
  receivables,
  created_at,
  updated_at
)
select
  financial_seed.id,
  organization.id,
  vehicle.id,
  financial_seed.acquisition_value,
  financial_seed.total_invested_value,
  vehicle.list_price - financial_seed.total_invested_value,
  financial_seed.receivables,
  '2026-08-02 09:00:00+08',
  '2026-08-02 09:00:00+08'
from public.organizations organization
join public.vehicles vehicle on vehicle.organization_id = organization.id
cross join (
  values
    ('a5000000-0000-4000-8000-000000000007'::uuid, 'QC-2026-007'::text, 780000.00::numeric, 815000.00::numeric, 0.00::numeric),
    ('a5000000-0000-4000-8000-000000000008', 'QC-2026-008', 710000.00, 745000.00, 0.00),
    ('a5000000-0000-4000-8000-000000000009', 'QC-2026-009', 1700000.00, 1780000.00, 0.00),
    ('a5000000-0000-4000-8000-000000000010', 'QC-2026-010', 1320000.00, 1380000.00, 0.00),
    ('a5000000-0000-4000-8000-000000000011', 'QC-2026-011', 1240000.00, 1300000.00, 0.00),
    ('a5000000-0000-4000-8000-000000000012', 'QC-2026-012', 1160000.00, 1220000.00, 0.00),
    ('a5000000-0000-4000-8000-000000000013', 'QC-2026-013', 1270000.00, 1325000.00, 0.00),
    ('a5000000-0000-4000-8000-000000000014', 'QC-2026-014', 1140000.00, 1190000.00, 0.00),
    ('a5000000-0000-4000-8000-000000000015', 'QC-2026-015', 1080000.00, 1125000.00, 0.00),
    ('a5000000-0000-4000-8000-000000000016', 'QC-2026-016', 890000.00, 930000.00, 0.00),
    ('a5000000-0000-4000-8000-000000000017', 'QC-2026-017', 780000.00, 815000.00, 196000.00),
    ('a5000000-0000-4000-8000-000000000018', 'QC-2026-018', 575000.00, 610000.00, 147000.00),
    ('a5000000-0000-4000-8000-000000000019', 'QC-2026-019', 475000.00, 510000.00, 0.00),
    ('a5000000-0000-4000-8000-000000000020', 'QC-2026-020', 535000.00, 570000.00, 0.00),
    ('a5000000-0000-4000-8000-000000000021', 'QC-2026-021', 900000.00, 950000.00, 230000.00)
) as financial_seed(id, stock_number, acquisition_value, total_invested_value, receivables)
where organization.slug = 'apex-autohaus'
  and vehicle.stock_number = financial_seed.stock_number
on conflict (vehicle_id) do update
set organization_id = excluded.organization_id,
    acquisition_value = excluded.acquisition_value,
    total_invested_value = excluded.total_invested_value,
    expected_profit = excluded.expected_profit,
    receivables = excluded.receivables,
    updated_at = excluded.updated_at;

insert into public.dashboard_snapshots (
  id,
  organization_id,
  branch_id,
  metric_key,
  period_start,
  period_end,
  payload,
  is_sensitive,
  generated_at,
  created_at
)
select
  snapshot_seed.id,
  organization.id,
  case when snapshot_seed.is_organization_wide then null else branch.id end,
  snapshot_seed.metric_key,
  '2026-08-01'::date,
  '2026-08-31'::date,
  snapshot_seed.payload,
  snapshot_seed.is_sensitive,
  '2026-08-02 09:00:00+08',
  '2026-08-02 09:00:00+08'
from public.organizations organization
join public.branches branch
  on branch.organization_id = organization.id
 and branch.code = 'QC-MAIN'
cross join (
  values
    ('a6000000-0000-4000-8000-000000000001'::uuid, 'inventory.overview'::text, '{"total":25,"available":5,"reserved":3,"sold_this_month":5}'::jsonb, false, false),
    ('a6000000-0000-4000-8000-000000000002'::uuid, 'inventory.pipeline'::text, '{"acquired":2,"for_inspection":2,"for_repair_or_preparation":2,"ready_for_listing":2,"available":5,"reserved":3,"sold":3,"released":2,"withdrawn":1,"returned_to_supplier":1,"written_off":1,"archived":1}'::jsonb, false, false),
    ('a6000000-0000-4000-8000-000000000003'::uuid, 'sales.performance'::text, '{"units_sold":5,"target_units":8,"average_days_to_sale":19}'::jsonb, false, false),
    ('a6000000-0000-4000-8000-000000000004'::uuid, 'test_drives.upcoming'::text, '{"count":3,"appointments":[{"stock_number":"QC-2026-009","scheduled_at":"2026-08-03T10:00:00+08:00"},{"stock_number":"QC-2026-011","scheduled_at":"2026-08-03T14:00:00+08:00"},{"stock_number":"QC-2026-013","scheduled_at":"2026-08-04T11:00:00+08:00"}]}'::jsonb, false, false),
    ('a6000000-0000-4000-8000-000000000005'::uuid, 'inventory.oldest_unsold'::text, '{"stock_number":"QC-2026-013","days_in_stock":55}'::jsonb, false, false),
    ('a6000000-0000-4000-8000-000000000006'::uuid, 'financial.summary'::text, '{"currency":"PHP","acquisition_value":14555000,"total_invested_value":15265000,"expected_profit":2960000,"receivables":573000}'::jsonb, true, true)
) as snapshot_seed(id, metric_key, payload, is_sensitive, is_organization_wide)
where organization.slug = 'apex-autohaus'
on conflict (id) do update
set organization_id = excluded.organization_id,
    branch_id = excluded.branch_id,
    metric_key = excluded.metric_key,
    period_start = excluded.period_start,
    period_end = excluded.period_end,
    payload = excluded.payload,
    is_sensitive = excluded.is_sensitive,
    generated_at = excluded.generated_at,
    created_at = excluded.created_at;

insert into public.audit_logs (
  id,
  organization_id,
  actor_id,
  action,
  entity_type,
  entity_id,
  before_data,
  after_data,
  reason,
  request_metadata,
  created_at
)
select
  audit_seed.id,
  organization.id,
  null,
  audit_seed.action,
  audit_seed.entity_type,
  case
    when audit_seed.entity_type = 'organization' then organization.id
    else branch.id
  end,
  null,
  audit_seed.after_data,
  'Installed deterministic fictional Phase 1 demo data.',
  '{"source":"supabase/seed.sql","demo":true}'::jsonb,
  audit_seed.created_at
from public.organizations organization
join public.branches branch
  on branch.organization_id = organization.id
 and branch.code = 'QC-MAIN'
cross join (
  values
    ('aa000000-0000-4000-8000-000000000001'::uuid, 'seed.organization_configured'::text, 'organization'::text, '{"slug":"apex-autohaus","currency":"PHP","timezone":"Asia/Manila"}'::jsonb, '2026-08-02 09:10:00+08'::timestamptz),
    ('aa000000-0000-4000-8000-000000000002'::uuid, 'seed.branch_configured'::text, 'branch'::text, '{"code":"QC-MAIN","name":"Quezon City Main","is_primary":true}'::jsonb, '2026-08-02 09:11:00+08'::timestamptz),
    ('aa000000-0000-4000-8000-000000000003'::uuid, 'seed.modules_configured'::text, 'organization'::text, '{"dealership":true,"fleet_management":false,"vehicle_rental":false}'::jsonb, '2026-08-02 09:12:00+08'::timestamptz),
    ('aa000000-0000-4000-8000-000000000004'::uuid, 'seed.roles_configured'::text, 'organization'::text, '{"system_roles":5,"permission_assignments":8}'::jsonb, '2026-08-02 09:13:00+08'::timestamptz),
    ('aa000000-0000-4000-8000-000000000005'::uuid, 'seed.inventory_installed'::text, 'branch'::text, '{"vehicles":25,"financial_records":15,"dashboard_snapshots":6}'::jsonb, '2026-08-02 09:14:00+08'::timestamptz)
) as audit_seed(id, action, entity_type, after_data, created_at)
where organization.slug = 'apex-autohaus'
on conflict (id) do update
set organization_id = excluded.organization_id,
    actor_id = excluded.actor_id,
    action = excluded.action,
    entity_type = excluded.entity_type,
    entity_id = excluded.entity_id,
    before_data = excluded.before_data,
    after_data = excluded.after_data,
    reason = excluded.reason,
    request_metadata = excluded.request_metadata,
    created_at = excluded.created_at;

-- profiles.id references auth.users.id. The trusted bootstrap script creates or
-- reconciles those identities first, then installs profiles, memberships,
-- branch assignments, notifications, and audit events with these SQL rows in
-- place. No Auth password or privileged credential belongs in this file.
