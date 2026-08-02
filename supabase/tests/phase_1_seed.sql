begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(27);

-- db reset installs the exact seed body as a locked-down private helper. Calling
-- it here works with the CLI's tests-only container mount and exercises every
-- real conflict/upsert path on the second pass without duplicating seed SQL.
select is(
  (
    select count(*)::integer
    from pg_catalog.pg_proc proc
    join pg_catalog.pg_namespace namespace
      on namespace.oid = proc.pronamespace
    where namespace.nspname = 'private'
      and proc.proname = 'seed_phase_1_demo'
      and proc.prokind = 'f'
      and proc.pronargs = 0
  ),
  1,
  'the canonical private Phase 1 seed function exists exactly once'
);

select ok(
  (
    select not proc.prosecdef
    from pg_catalog.pg_proc proc
    join pg_catalog.pg_namespace namespace
      on namespace.oid = proc.pronamespace
    where namespace.nspname = 'private'
      and proc.proname = 'seed_phase_1_demo'
      and proc.pronargs = 0
  ),
  'the seed function executes with caller privileges'
);

select is(
  (
    select pg_catalog.pg_get_userbyid(proc.proowner)
    from pg_catalog.pg_proc proc
    join pg_catalog.pg_namespace namespace
      on namespace.oid = proc.pronamespace
    where namespace.nspname = 'private'
      and proc.proname = 'seed_phase_1_demo'
      and proc.pronargs = 0
  ),
  'postgres'::name,
  'the seed function has the explicit postgres owner expected by reset and tests'
);

select ok(
  (
    select coalesce(
      bool_or(
        pg_catalog.regexp_replace(setting, '^search_path=', '') in ('', '""')
      ),
      false
    )
    from pg_catalog.pg_proc proc
    join pg_catalog.pg_namespace namespace
      on namespace.oid = proc.pronamespace
    cross join lateral unnest(proc.proconfig) setting
    where namespace.nspname = 'private'
      and proc.proname = 'seed_phase_1_demo'
      and proc.pronargs = 0
      and setting like 'search_path=%'
  ),
  'the seed function has an empty fixed search_path'
);

select ok(
  not exists (
    select 1
    from pg_catalog.pg_proc proc
    join pg_catalog.pg_namespace namespace
      on namespace.oid = proc.pronamespace
    cross join lateral pg_catalog.aclexplode(
      coalesce(
        proc.proacl,
        pg_catalog.acldefault('f', proc.proowner)
      )
    ) acl
    where namespace.nspname = 'private'
      and proc.proname = 'seed_phase_1_demo'
      and proc.pronargs = 0
      and acl.privilege_type = 'EXECUTE'
      and acl.grantee <> proc.proowner
  ),
  'no role other than the postgres owner can execute the seed function'
);

select lives_ok(
  $$select private.seed_phase_1_demo()$$,
  'the exact canonical seed body survives a second execution'
);

-- These are the natural conflict targets used by that second seed execution.
select col_is_unique(
  'public',
  'organizations',
  'slug',
  'organization seed conflicts on a unique slug'
);

select col_is_unique(
  'public',
  'branches',
  array['organization_id', 'code'],
  'branch seed conflicts on a tenant-scoped unique code'
);

select col_is_unique(
  'public',
  'organization_modules',
  array['organization_id', 'module_id'],
  'module entitlement seed conflicts on a unique organization/module pair'
);

select col_is_unique(
  'public',
  'roles',
  array['organization_id', 'code'],
  'role seed conflicts on a tenant-scoped unique code'
);

select col_is_unique(
  'public',
  'role_permissions',
  array['organization_id', 'role_id', 'permission_id'],
  'permission mapping seed conflicts on a unique assignment'
);

select col_is_unique(
  'public',
  'vehicles',
  array['organization_id', 'stock_number'],
  'vehicle seed conflicts on a tenant-scoped unique stock number'
);

select col_is_unique(
  'public',
  'vehicle_financials',
  'vehicle_id',
  'financial seed conflicts on one record per vehicle'
);

select results_eq(
  $$
    select company_name, currency, timezone
    from public.organizations
    where slug = 'apex-autohaus'
  $$,
  $$values ('Apex Autohaus'::text, 'PHP'::text, 'Asia/Manila'::text)$$,
  'Apex Autohaus is the one deterministic demo organization'
);

select results_eq(
  $$
    select branch.code, branch.name
    from public.branches branch
    join public.organizations organization
      on organization.id = branch.organization_id
    where organization.slug = 'apex-autohaus'
  $$,
  $$values ('QC-MAIN'::text, 'Quezon City Main'::text)$$,
  'Apex has exactly one Quezon City Main branch'
);

select results_eq(
  $$
    select role.code, role.name
    from public.roles role
    join public.organizations organization
      on organization.id = role.organization_id
    where organization.slug = 'apex-autohaus'
      and role.is_system
    order by role.code
  $$,
  $$
    values
      ('branch_manager'::text, 'Branch Manager'::text),
      ('inventory_staff'::text, 'Inventory Staff'::text),
      ('owner'::text, 'Owner'::text),
      ('sales_agent'::text, 'Sales Agent'::text),
      ('viewer'::text, 'Viewer'::text)
  $$,
  'Apex has exactly the five documented system roles'
);

select results_eq(
  $$
    select module.key::text, organization_module.is_enabled
    from public.organization_modules organization_module
    join public.organizations organization
      on organization.id = organization_module.organization_id
    join public.modules module on module.id = organization_module.module_id
    where organization.slug = 'apex-autohaus'
    order by module.key::text
  $$,
  $$
    values
      ('dealership'::text, true),
      ('fleet_management'::text, false),
      ('vehicle_rental'::text, false)
  $$,
  'only Dealership is enabled for Apex'
);

select results_eq(
  $$
    select role.code, permission.key
    from public.role_permissions role_permission
    join public.organizations organization
      on organization.id = role_permission.organization_id
    join public.roles role on role.id = role_permission.role_id
    join public.permissions permission
      on permission.id = role_permission.permission_id
    where organization.slug = 'apex-autohaus'
      and role.is_system
    order by role.code, permission.key
  $$,
  $$
    values
      ('branch_manager'::text, 'vehicles.manage'::text),
      ('inventory_staff'::text, 'vehicles.manage'::text),
      ('owner'::text, 'audit_logs.read'::text),
      ('owner'::text, 'financials.view_sensitive'::text),
      ('owner'::text, 'modules.manage'::text),
      ('owner'::text, 'settings.manage'::text),
      ('owner'::text, 'users.manage'::text),
      ('owner'::text, 'vehicles.manage'::text)
  $$,
  'system role permissions exactly match the documented least-privilege matrix'
);

select is(
  (
    select count(*)::integer
    from public.vehicles vehicle
    join public.organizations organization
      on organization.id = vehicle.organization_id
    where organization.slug = 'apex-autohaus'
  ),
  25,
  'Apex has exactly 25 demo vehicles'
);

select results_eq(
  $$
    select vehicle.workflow_status::text, count(*)::integer
    from public.vehicles vehicle
    join public.organizations organization
      on organization.id = vehicle.organization_id
    where organization.slug = 'apex-autohaus'
    group by vehicle.workflow_status
    order by vehicle.workflow_status::text
  $$,
  $$
    values
      ('acquired'::text, 2),
      ('archived'::text, 1),
      ('available'::text, 5),
      ('for_inspection'::text, 2),
      ('for_repair_or_preparation'::text, 2),
      ('ready_for_listing'::text, 2),
      ('released'::text, 2),
      ('reserved'::text, 3),
      ('returned_to_supplier'::text, 1),
      ('sold'::text, 3),
      ('withdrawn'::text, 1),
      ('written_off'::text, 1)
  $$,
  'the 25 vehicles cover the representative workflow distribution'
);

select is(
  (
    select count(*)::integer
    from public.vehicles vehicle
    join public.organizations organization
      on organization.id = vehicle.organization_id
    join public.branches branch
      on branch.id = vehicle.branch_id
     and branch.organization_id = vehicle.organization_id
    where organization.slug = 'apex-autohaus'
      and branch.code <> 'QC-MAIN'
  ),
  0,
  'every Apex vehicle remains in the Apex tenant and QC-MAIN branch'
);

select is(
  (
    select count(*)::integer
    from public.vehicle_financials financial
    join public.organizations organization
      on organization.id = financial.organization_id
    where organization.slug = 'apex-autohaus'
  ),
  15,
  'only 15 suitable workflow vehicles have separate financial records'
);

select is(
  (
    select count(*)::integer
    from public.vehicle_financials financial
    join public.organizations organization
      on organization.id = financial.organization_id
    where organization.slug = 'apex-autohaus'
      and financial.receivables > 0
  ),
  3,
  'exactly three demo vehicles have nonzero receivables'
);

select ok(
  not exists (
    select 1
    from public.vehicle_financials financial
    join public.vehicles vehicle
      on vehicle.id = financial.vehicle_id
     and vehicle.organization_id = financial.organization_id
    join public.organizations organization
      on organization.id = financial.organization_id
    join public.branches branch
      on branch.id = vehicle.branch_id
     and branch.organization_id = vehicle.organization_id
    where organization.slug = 'apex-autohaus'
      and (
        branch.code <> 'QC-MAIN'
        or vehicle.workflow_status not in (
          'ready_for_listing',
          'available',
          'reserved',
          'sold',
          'released'
        )
        or financial.total_invested_value < financial.acquisition_value
        or financial.expected_profit <> vehicle.list_price - financial.total_invested_value
        or (vehicle.workflow_status not in ('sold', 'released') and financial.receivables <> 0)
      )
  ),
  'financial rows stay tenant-safe, separate, nonnegative, and workflow-appropriate'
);

select results_eq(
  $$
    select snapshot.metric_key, snapshot.is_sensitive
    from public.dashboard_snapshots snapshot
    join public.organizations organization
      on organization.id = snapshot.organization_id
    left join public.branches branch
      on branch.id = snapshot.branch_id
     and branch.organization_id = snapshot.organization_id
    where organization.slug = 'apex-autohaus'
      and (snapshot.branch_id is null or branch.code = 'QC-MAIN')
    order by snapshot.metric_key
  $$,
  $$
    values
      ('financial.summary'::text, true),
      ('inventory.oldest_unsold'::text, false),
      ('inventory.overview'::text, false),
      ('inventory.pipeline'::text, false),
      ('sales.performance'::text, false),
      ('test_drives.upcoming'::text, false)
  $$,
  'dashboard payloads are tenant-consistent and only the financial summary is sensitive'
);

select ok(
  (
    (
      select count(*) = 0
      from public.organization_memberships membership
      join public.organizations organization
        on organization.id = membership.organization_id
      where organization.slug = 'apex-autohaus'
    )
    and (
      select count(*) = 0
      from public.notifications notification
      join public.organizations organization
        on organization.id = notification.organization_id
      where organization.slug = 'apex-autohaus'
    )
    and (
      select count(*) = 5
      from public.audit_logs audit_log
      join public.organizations organization
        on organization.id = audit_log.organization_id
      where organization.slug = 'apex-autohaus'
    )
  )
  or (
    (
      select count(*) = 5
      from public.organization_memberships membership
      join public.organizations organization
        on organization.id = membership.organization_id
      where organization.slug = 'apex-autohaus'
        and membership.status = 'active'
    )
    and (
      select count(*) = 5
      from public.notifications notification
      join public.organizations organization
        on organization.id = notification.organization_id
      where organization.slug = 'apex-autohaus'
    )
    and (
      select count(*) = 5
      from public.audit_logs audit_log
      join public.organizations organization
        on organization.id = audit_log.organization_id
      where organization.slug = 'apex-autohaus'
    )
  ),
  'SQL-owned audit rows always exist while Auth-dependent memberships and notifications are absent or complete'
);

select results_eq(
  $$
    select
      (select count(*)::integer from public.organizations where slug = 'apex-autohaus'),
      (select count(*)::integer from public.branches branch join public.organizations organization on organization.id = branch.organization_id where organization.slug = 'apex-autohaus'),
      (select count(*)::integer from public.roles role join public.organizations organization on organization.id = role.organization_id where organization.slug = 'apex-autohaus' and role.is_system),
      (select count(*)::integer from public.organization_modules organization_module join public.organizations organization on organization.id = organization_module.organization_id where organization.slug = 'apex-autohaus'),
      (select count(*)::integer from public.role_permissions role_permission join public.organizations organization on organization.id = role_permission.organization_id where organization.slug = 'apex-autohaus'),
      (select count(*)::integer from public.vehicles vehicle join public.organizations organization on organization.id = vehicle.organization_id where organization.slug = 'apex-autohaus'),
      (select count(*)::integer from public.vehicle_financials financial join public.organizations organization on organization.id = financial.organization_id where organization.slug = 'apex-autohaus'),
      (select count(*)::integer from public.dashboard_snapshots snapshot join public.organizations organization on organization.id = snapshot.organization_id where organization.slug = 'apex-autohaus')
  $$,
  $$values (1, 1, 5, 3, 8, 25, 15, 6)$$,
  'every SQL-owned row set has its deterministic exact cardinality after reset'
);

select * from finish();
rollback;
