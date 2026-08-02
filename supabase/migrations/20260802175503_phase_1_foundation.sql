create type public.module_key as enum (
  'dealership',
  'fleet_management',
  'vehicle_rental'
);

create type public.membership_status as enum (
  'invited',
  'active',
  'suspended',
  'inactive'
);

create type public.organization_scope as enum (
  'organization',
  'assigned_branches'
);

create type public.vehicle_workflow_status as enum (
  'acquired',
  'for_inspection',
  'for_repair_or_preparation',
  'ready_for_listing',
  'available',
  'reserved',
  'sold',
  'released',
  'withdrawn',
  'returned_to_supplier',
  'written_off',
  'archived'
);

create type public.notification_priority as enum (
  'low',
  'normal',
  'high',
  'urgent'
);

create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;
grant usage on schema private to authenticated;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  company_name text not null check (btrim(company_name) <> ''),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  email text,
  mobile text,
  address jsonb not null default '{}'::jsonb,
  currency text not null default 'PHP' check (currency ~ '^[A-Z]{3}$'),
  timezone text not null default 'Asia/Manila',
  is_active boolean not null default true,
  branding jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  key public.module_key not null unique,
  display_name text not null check (btrim(display_name) <> ''),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (btrim(display_name) <> ''),
  mobile text,
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null check (code ~ '^[a-z0-9]+([._-][a-z0-9]+)*$'),
  name text not null check (btrim(name) <> ''),
  description text,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint roles_organization_code_key unique (organization_id, code),
  constraint roles_organization_id_id_key unique (organization_id, id)
);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z0-9_]+([.][a-z0-9_]+)+$'),
  name text not null check (btrim(name) <> ''),
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null,
  status public.membership_status not null default 'invited',
  organization_scope public.organization_scope not null default 'assigned_branches',
  joined_at timestamptz,
  inactivated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_memberships_organization_user_key unique (organization_id, user_id),
  constraint organization_memberships_organization_id_id_key unique (organization_id, id),
  constraint organization_memberships_tenant_role_fkey
    foreign key (organization_id, role_id)
    references public.roles(organization_id, id)
    on delete restrict,
  constraint organization_memberships_inactivated_check check (
    status not in ('suspended', 'inactive') or inactivated_at is not null
  )
);

create table public.organization_modules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete restrict,
  is_enabled boolean not null default true,
  enabled_at timestamptz,
  enabled_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint organization_modules_organization_module_key unique (organization_id, module_id),
  constraint organization_modules_enabled_by_fkey
    foreign key (organization_id, enabled_by)
    references public.organization_memberships(organization_id, user_id)
    on delete set null (enabled_by)
);

create table public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  role_id uuid not null,
  permission_id uuid not null references public.permissions(id) on delete restrict,
  created_at timestamptz not null default now(),
  constraint role_permissions_assignment_key unique (organization_id, role_id, permission_id),
  constraint role_permissions_tenant_role_fkey
    foreign key (organization_id, role_id)
    references public.roles(organization_id, id)
    on delete cascade
);

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null check (btrim(code) <> ''),
  name text not null check (btrim(name) <> ''),
  address jsonb not null default '{}'::jsonb,
  is_primary boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint branches_organization_code_key unique (organization_id, code),
  constraint branches_organization_id_id_key unique (organization_id, id)
);

create unique index branches_one_primary_per_organization_idx
  on public.branches (organization_id)
  where is_primary;

create table public.membership_branches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  membership_id uuid not null,
  branch_id uuid not null,
  created_at timestamptz not null default now(),
  constraint membership_branches_assignment_key unique (organization_id, membership_id, branch_id),
  constraint membership_branches_tenant_membership_fkey
    foreign key (organization_id, membership_id)
    references public.organization_memberships(organization_id, id)
    on delete cascade,
  constraint membership_branches_tenant_branch_fkey
    foreign key (organization_id, branch_id)
    references public.branches(organization_id, id)
    on delete cascade
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid not null,
  stock_number text not null check (btrim(stock_number) <> ''),
  model_year smallint not null check (model_year between 1886 and 2100),
  make text not null check (btrim(make) <> ''),
  model text not null check (btrim(model) <> ''),
  variant text,
  workflow_status public.vehicle_workflow_status not null default 'acquired',
  list_price numeric(14, 2) not null default 0 check (list_price >= 0),
  acquired_at timestamptz,
  listed_at timestamptz,
  released_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vehicles_organization_stock_number_key unique (organization_id, stock_number),
  constraint vehicles_organization_id_id_key unique (organization_id, id),
  constraint vehicles_tenant_branch_fkey
    foreign key (organization_id, branch_id)
    references public.branches(organization_id, id)
    on delete restrict
);

create table public.vehicle_financials (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  vehicle_id uuid not null unique,
  acquisition_value numeric(14, 2) not null default 0 check (acquisition_value >= 0),
  total_invested_value numeric(14, 2) not null default 0 check (total_invested_value >= 0),
  expected_profit numeric(14, 2) not null default 0 check (expected_profit >= 0),
  receivables numeric(14, 2) not null default 0 check (receivables >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint vehicle_financials_tenant_vehicle_fkey
    foreign key (organization_id, vehicle_id)
    references public.vehicles(organization_id, id)
    on delete cascade
);

create table public.dashboard_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid,
  metric_key text not null check (btrim(metric_key) <> ''),
  period_start date not null,
  period_end date not null,
  payload jsonb not null default '{}'::jsonb,
  is_sensitive boolean not null default false,
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint dashboard_snapshots_period_check check (period_end >= period_start),
  constraint dashboard_snapshots_tenant_branch_fkey
    foreign key (organization_id, branch_id)
    references public.branches(organization_id, id)
    on delete restrict
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  recipient_id uuid not null,
  category text not null check (btrim(category) <> ''),
  priority public.notification_priority not null default 'normal',
  title text not null check (btrim(title) <> ''),
  body text not null,
  is_read boolean not null default false,
  read_at timestamptz,
  related_entity_type text,
  related_entity_id uuid,
  created_at timestamptz not null default now(),
  constraint notifications_tenant_recipient_fkey
    foreign key (organization_id, recipient_id)
    references public.organization_memberships(organization_id, user_id)
    on delete cascade,
  constraint notifications_read_state_check check (
    (is_read and read_at is not null) or (not is_read and read_at is null)
  )
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid,
  action text not null check (btrim(action) <> ''),
  entity_type text not null check (btrim(entity_type) <> ''),
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  reason text,
  request_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint audit_logs_tenant_actor_fkey
    foreign key (organization_id, actor_id)
    references public.organization_memberships(organization_id, user_id)
    on delete set null (actor_id)
);

-- Tenant, authorization, dashboard, and recency access paths.
create index organizations_active_idx on public.organizations (is_active);
create index organizations_created_at_idx on public.organizations (created_at desc);
create index modules_created_at_idx on public.modules (created_at desc);
create index profiles_created_at_idx on public.profiles (created_at desc);
create index roles_organization_id_idx on public.roles (organization_id);
create index roles_created_at_idx on public.roles (created_at desc);
create index permissions_created_at_idx on public.permissions (created_at desc);
create index organization_memberships_user_status_idx on public.organization_memberships (user_id, status);
create index organization_memberships_organization_status_idx on public.organization_memberships (organization_id, status);
create index organization_memberships_role_id_idx on public.organization_memberships (role_id);
create index organization_memberships_joined_at_idx on public.organization_memberships (joined_at desc);
create index organization_modules_organization_id_idx on public.organization_modules (organization_id);
create index organization_modules_module_id_idx on public.organization_modules (module_id);
create index organization_modules_enabled_by_idx on public.organization_modules (enabled_by);
create index organization_modules_enabled_at_idx on public.organization_modules (enabled_at desc);
create index role_permissions_organization_role_idx on public.role_permissions (organization_id, role_id);
create index role_permissions_permission_id_idx on public.role_permissions (permission_id);
create index branches_organization_active_idx on public.branches (organization_id, is_active);
create index branches_created_at_idx on public.branches (created_at desc);
create index membership_branches_membership_idx on public.membership_branches (membership_id);
create index membership_branches_branch_idx on public.membership_branches (branch_id);
create index vehicles_organization_branch_idx on public.vehicles (organization_id, branch_id);
create index vehicles_organization_status_idx on public.vehicles (organization_id, workflow_status);
create index vehicles_branch_status_idx on public.vehicles (branch_id, workflow_status);
create index vehicles_created_at_idx on public.vehicles (organization_id, created_at desc);
create index vehicles_acquired_at_idx on public.vehicles (organization_id, acquired_at desc);
create index vehicles_listed_at_idx on public.vehicles (organization_id, listed_at desc);
create index vehicles_released_at_idx on public.vehicles (organization_id, released_at desc);
create index vehicle_financials_organization_idx on public.vehicle_financials (organization_id);
create index vehicle_financials_updated_at_idx on public.vehicle_financials (organization_id, updated_at desc);
create index dashboard_snapshots_org_branch_metric_idx on public.dashboard_snapshots (organization_id, branch_id, metric_key);
create index dashboard_snapshots_org_period_idx on public.dashboard_snapshots (organization_id, period_start, period_end);
create index dashboard_snapshots_generated_at_idx on public.dashboard_snapshots (organization_id, generated_at desc);
create index dashboard_snapshots_sensitive_idx on public.dashboard_snapshots (organization_id, is_sensitive);
create index notifications_org_recipient_idx on public.notifications (organization_id, recipient_id);
create index notifications_recipient_unread_idx on public.notifications (recipient_id, is_read, created_at desc);
create index notifications_priority_idx on public.notifications (organization_id, priority);
create index notifications_created_at_idx on public.notifications (organization_id, created_at desc);
create index audit_logs_organization_created_at_idx on public.audit_logs (organization_id, created_at desc);
create index audit_logs_actor_id_idx on public.audit_logs (actor_id);
create index audit_logs_entity_idx on public.audit_logs (organization_id, entity_type, entity_id);
create index audit_logs_action_idx on public.audit_logs (organization_id, action);

insert into public.modules (id, key, display_name, description)
values
  ('d0000000-0000-0000-0000-000000000001', 'dealership', 'Dealership', 'Vehicle acquisition, preparation, listing, sale, and release workflows.'),
  ('d0000000-0000-0000-0000-000000000002', 'fleet_management', 'Fleet Management', 'Reserved extension boundary for owned or managed vehicle fleets.'),
  ('d0000000-0000-0000-0000-000000000003', 'vehicle_rental', 'Vehicle Rental', 'Reserved extension boundary for rental agreements and rental operations.')
on conflict (key) do update
set display_name = excluded.display_name,
    description = excluded.description,
    updated_at = now();

insert into public.permissions (id, key, name, description)
values
  ('e0000000-0000-0000-0000-000000000001', 'settings.manage', 'Manage settings', 'Manage organization and branch settings.'),
  ('e0000000-0000-0000-0000-000000000002', 'modules.manage', 'Manage modules', 'Enable or disable organization modules.'),
  ('e0000000-0000-0000-0000-000000000003', 'users.manage', 'Manage users', 'Manage roles, memberships, permissions, and branch assignments.'),
  ('e0000000-0000-0000-0000-000000000004', 'vehicles.manage', 'Manage vehicles', 'Create and maintain vehicle inventory.'),
  ('e0000000-0000-0000-0000-000000000005', 'financials.view_sensitive', 'View sensitive financials', 'Read vehicle financials and sensitive dashboard metrics.'),
  ('e0000000-0000-0000-0000-000000000006', 'audit_logs.read', 'Read audit logs', 'Read organization audit history.')
on conflict (key) do update
set name = excluded.name,
    description = excluded.description,
    updated_at = now();

-- These SECURITY DEFINER functions are private solely to avoid recursive RLS
-- while reading the authorization graph. Each validates auth.uid(), fully
-- qualifies every relation, and fixes search_path to the empty string.
create function private.is_active_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.organization_memberships membership
      join public.organizations organization
        on organization.id = membership.organization_id
      where membership.organization_id = target_organization_id
        and membership.user_id = (select auth.uid())
        and membership.status = 'active'
        and organization.is_active
    );
$$;

create function private.has_permission(target_organization_id uuid, target_permission_key text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.organization_memberships membership
      join public.organizations organization
        on organization.id = membership.organization_id
      join public.role_permissions role_permission
        on role_permission.organization_id = membership.organization_id
       and role_permission.role_id = membership.role_id
      join public.permissions permission
        on permission.id = role_permission.permission_id
      where membership.organization_id = target_organization_id
        and membership.user_id = (select auth.uid())
        and membership.status = 'active'
        and organization.is_active
        and permission.key = target_permission_key
    );
$$;

create function private.can_access_branch(target_organization_id uuid, target_branch_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and exists (
      select 1
      from public.organization_memberships membership
      join public.organizations organization
        on organization.id = membership.organization_id
      join public.branches branch
        on branch.organization_id = membership.organization_id
       and branch.id = target_branch_id
      where membership.organization_id = target_organization_id
        and membership.user_id = (select auth.uid())
        and membership.status = 'active'
        and organization.is_active
        and (
          membership.organization_scope = 'organization'
          or exists (
            select 1
            from public.membership_branches assignment
            where assignment.organization_id = membership.organization_id
              and assignment.membership_id = membership.id
              and assignment.branch_id = target_branch_id
          )
        )
    );
$$;

create function private.can_view_profile(target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null
    and (
      target_user_id = (select auth.uid())
      or exists (
        select 1
        from public.organization_memberships viewer_membership
        join public.organization_memberships target_membership
          on target_membership.organization_id = viewer_membership.organization_id
        join public.organizations organization
          on organization.id = viewer_membership.organization_id
        where viewer_membership.user_id = (select auth.uid())
          and viewer_membership.status = 'active'
          and target_membership.user_id = target_user_id
          and target_membership.status = 'active'
          and organization.is_active
      )
    );
$$;

revoke all on function private.is_active_member(uuid) from public;
revoke all on function private.is_active_member(uuid) from anon;
revoke all on function private.has_permission(uuid, text) from public;
revoke all on function private.has_permission(uuid, text) from anon;
revoke all on function private.can_access_branch(uuid, uuid) from public;
revoke all on function private.can_access_branch(uuid, uuid) from anon;
revoke all on function private.can_view_profile(uuid) from public;
revoke all on function private.can_view_profile(uuid) from anon;

grant execute on function private.is_active_member(uuid) to authenticated;
grant execute on function private.has_permission(uuid, text) to authenticated;
grant execute on function private.can_access_branch(uuid, uuid) to authenticated;
grant execute on function private.can_view_profile(uuid) to authenticated;

alter table public.organizations enable row level security;
alter table public.modules enable row level security;
alter table public.organization_modules enable row level security;
alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.branches enable row level security;
alter table public.membership_branches enable row level security;
alter table public.vehicles enable row level security;
alter table public.vehicle_financials enable row level security;
alter table public.dashboard_snapshots enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

revoke all on public.organizations, public.modules, public.organization_modules,
  public.profiles, public.roles, public.permissions, public.role_permissions,
  public.organization_memberships, public.branches, public.membership_branches,
  public.vehicles, public.vehicle_financials, public.dashboard_snapshots,
  public.notifications, public.audit_logs from anon, authenticated;

grant usage on schema public to authenticated;
grant select, update on public.organizations to authenticated;
grant select on public.modules to authenticated;
grant select, insert, update, delete on public.organization_modules to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.roles to authenticated;
grant select on public.permissions to authenticated;
grant select, insert, delete on public.role_permissions to authenticated;
grant select, insert, update, delete on public.organization_memberships to authenticated;
grant select, insert, update, delete on public.branches to authenticated;
grant select, insert, update, delete on public.membership_branches to authenticated;
grant select, insert, update, delete on public.vehicles to authenticated;
grant select, insert, update, delete on public.vehicle_financials to authenticated;
grant select on public.dashboard_snapshots to authenticated;
grant select, insert on public.notifications to authenticated;
grant update (is_read, read_at) on public.notifications to authenticated;
grant select, insert on public.audit_logs to authenticated;

create policy organizations_select_active_members
on public.organizations for select to authenticated
using (private.is_active_member(id));

create policy organizations_update_settings_managers
on public.organizations for update to authenticated
using (private.has_permission(id, 'settings.manage'))
with check (private.has_permission(id, 'settings.manage'));

create policy modules_select_active_members
on public.modules for select to authenticated
using (
  exists (
    select 1
    from public.organization_memberships membership
    where membership.user_id = (select auth.uid())
      and membership.status = 'active'
      and private.is_active_member(membership.organization_id)
  )
);

create policy organization_modules_select_members
on public.organization_modules for select to authenticated
using (private.is_active_member(organization_id));

create policy organization_modules_insert_managers
on public.organization_modules for insert to authenticated
with check (private.has_permission(organization_id, 'modules.manage'));

create policy organization_modules_update_managers
on public.organization_modules for update to authenticated
using (private.has_permission(organization_id, 'modules.manage'))
with check (private.has_permission(organization_id, 'modules.manage'));

create policy organization_modules_delete_managers
on public.organization_modules for delete to authenticated
using (private.has_permission(organization_id, 'modules.manage'));

create policy profiles_select_shared_members
on public.profiles for select to authenticated
using (private.can_view_profile(id));

create policy profiles_insert_self
on public.profiles for insert to authenticated
with check ((select auth.uid()) is not null and id = (select auth.uid()));

create policy profiles_update_self
on public.profiles for update to authenticated
using ((select auth.uid()) is not null and id = (select auth.uid()))
with check ((select auth.uid()) is not null and id = (select auth.uid()));

create policy roles_select_members
on public.roles for select to authenticated
using (private.is_active_member(organization_id));

create policy roles_insert_user_managers
on public.roles for insert to authenticated
with check (private.has_permission(organization_id, 'users.manage'));

create policy roles_update_user_managers
on public.roles for update to authenticated
using (private.has_permission(organization_id, 'users.manage'))
with check (private.has_permission(organization_id, 'users.manage'));

create policy roles_delete_user_managers
on public.roles for delete to authenticated
using (private.has_permission(organization_id, 'users.manage'));

create policy permissions_select_active_members
on public.permissions for select to authenticated
using (
  exists (
    select 1
    from public.organization_memberships membership
    where membership.user_id = (select auth.uid())
      and membership.status = 'active'
      and private.is_active_member(membership.organization_id)
  )
);

create policy role_permissions_select_members
on public.role_permissions for select to authenticated
using (private.is_active_member(organization_id));

create policy role_permissions_insert_user_managers
on public.role_permissions for insert to authenticated
with check (private.has_permission(organization_id, 'users.manage'));

create policy role_permissions_delete_user_managers
on public.role_permissions for delete to authenticated
using (private.has_permission(organization_id, 'users.manage'));

create policy organization_memberships_select_active_members
on public.organization_memberships for select to authenticated
using (status = 'active' and private.is_active_member(organization_id));

create policy organization_memberships_insert_user_managers
on public.organization_memberships for insert to authenticated
with check (private.has_permission(organization_id, 'users.manage'));

create policy organization_memberships_update_user_managers
on public.organization_memberships for update to authenticated
using (private.has_permission(organization_id, 'users.manage'))
with check (private.has_permission(organization_id, 'users.manage'));

create policy organization_memberships_delete_user_managers
on public.organization_memberships for delete to authenticated
using (private.has_permission(organization_id, 'users.manage'));

create policy branches_select_scoped_members
on public.branches for select to authenticated
using (private.can_access_branch(organization_id, id));

create policy branches_insert_settings_managers
on public.branches for insert to authenticated
with check (
  private.has_permission(organization_id, 'settings.manage')
  and exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = branches.organization_id
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'
      and membership.organization_scope = 'organization'
  )
);

create policy branches_update_settings_managers
on public.branches for update to authenticated
using (
  private.has_permission(organization_id, 'settings.manage')
  and private.can_access_branch(organization_id, id)
)
with check (
  private.has_permission(organization_id, 'settings.manage')
  and private.can_access_branch(organization_id, id)
);

create policy branches_delete_settings_managers
on public.branches for delete to authenticated
using (
  private.has_permission(organization_id, 'settings.manage')
  and private.can_access_branch(organization_id, id)
);

create policy membership_branches_select_members
on public.membership_branches for select to authenticated
using (
  private.is_active_member(organization_id)
  and (
    exists (
      select 1
      from public.organization_memberships membership
      where membership.id = membership_branches.membership_id
        and membership.user_id = (select auth.uid())
        and membership.status = 'active'
    )
    or private.has_permission(organization_id, 'users.manage')
  )
);

create policy membership_branches_insert_user_managers
on public.membership_branches for insert to authenticated
with check (private.has_permission(organization_id, 'users.manage'));

create policy membership_branches_update_user_managers
on public.membership_branches for update to authenticated
using (private.has_permission(organization_id, 'users.manage'))
with check (private.has_permission(organization_id, 'users.manage'));

create policy membership_branches_delete_user_managers
on public.membership_branches for delete to authenticated
using (private.has_permission(organization_id, 'users.manage'));

create policy vehicles_select_scoped_members
on public.vehicles for select to authenticated
using (
  private.is_active_member(organization_id)
  and private.can_access_branch(organization_id, branch_id)
);

create policy vehicles_insert_managers
on public.vehicles for insert to authenticated
with check (
  private.has_permission(organization_id, 'vehicles.manage')
  and private.can_access_branch(organization_id, branch_id)
);

create policy vehicles_update_managers
on public.vehicles for update to authenticated
using (
  private.has_permission(organization_id, 'vehicles.manage')
  and private.can_access_branch(organization_id, branch_id)
)
with check (
  private.has_permission(organization_id, 'vehicles.manage')
  and private.can_access_branch(organization_id, branch_id)
);

create policy vehicles_delete_managers
on public.vehicles for delete to authenticated
using (
  private.has_permission(organization_id, 'vehicles.manage')
  and private.can_access_branch(organization_id, branch_id)
);

create policy vehicle_financials_select_authorized
on public.vehicle_financials for select to authenticated
using (
  private.has_permission(organization_id, 'financials.view_sensitive')
  and exists (
    select 1
    from public.vehicles vehicle
    where vehicle.id = vehicle_financials.vehicle_id
      and vehicle.organization_id = vehicle_financials.organization_id
      and private.can_access_branch(vehicle.organization_id, vehicle.branch_id)
  )
);

create policy vehicle_financials_insert_authorized
on public.vehicle_financials for insert to authenticated
with check (
  private.has_permission(organization_id, 'financials.view_sensitive')
  and exists (
    select 1
    from public.vehicles vehicle
    where vehicle.id = vehicle_financials.vehicle_id
      and vehicle.organization_id = vehicle_financials.organization_id
      and private.can_access_branch(vehicle.organization_id, vehicle.branch_id)
  )
);

create policy vehicle_financials_update_authorized
on public.vehicle_financials for update to authenticated
using (
  private.has_permission(organization_id, 'financials.view_sensitive')
  and exists (
    select 1
    from public.vehicles vehicle
    where vehicle.id = vehicle_financials.vehicle_id
      and vehicle.organization_id = vehicle_financials.organization_id
      and private.can_access_branch(vehicle.organization_id, vehicle.branch_id)
  )
)
with check (
  private.has_permission(organization_id, 'financials.view_sensitive')
  and exists (
    select 1
    from public.vehicles vehicle
    where vehicle.id = vehicle_financials.vehicle_id
      and vehicle.organization_id = vehicle_financials.organization_id
      and private.can_access_branch(vehicle.organization_id, vehicle.branch_id)
  )
);

create policy vehicle_financials_delete_authorized
on public.vehicle_financials for delete to authenticated
using (
  private.has_permission(organization_id, 'financials.view_sensitive')
  and exists (
    select 1
    from public.vehicles vehicle
    where vehicle.id = vehicle_financials.vehicle_id
      and vehicle.organization_id = vehicle_financials.organization_id
      and private.can_access_branch(vehicle.organization_id, vehicle.branch_id)
  )
);

create policy dashboard_snapshots_select_scoped_members
on public.dashboard_snapshots for select to authenticated
using (
  private.is_active_member(organization_id)
  and (
    (branch_id is not null and private.can_access_branch(organization_id, branch_id))
    or (
      branch_id is null
      and exists (
        select 1
        from public.organization_memberships membership
        where membership.organization_id = dashboard_snapshots.organization_id
          and membership.user_id = (select auth.uid())
          and membership.status = 'active'
          and membership.organization_scope = 'organization'
      )
    )
  )
  and (
    not is_sensitive
    or private.has_permission(organization_id, 'financials.view_sensitive')
  )
);

create policy notifications_select_recipient
on public.notifications for select to authenticated
using ((select auth.uid()) is not null and recipient_id = (select auth.uid()));

create policy notifications_insert_members
on public.notifications for insert to authenticated
with check (
  private.is_active_member(organization_id)
  and exists (
    select 1
    from public.organization_memberships recipient_membership
    where recipient_membership.organization_id = notifications.organization_id
      and recipient_membership.user_id = notifications.recipient_id
      and recipient_membership.status = 'active'
  )
);

create policy notifications_update_recipient
on public.notifications for update to authenticated
using ((select auth.uid()) is not null and recipient_id = (select auth.uid()))
with check ((select auth.uid()) is not null and recipient_id = (select auth.uid()));

create policy audit_logs_select_readers
on public.audit_logs for select to authenticated
using (private.has_permission(organization_id, 'audit_logs.read'));

create policy audit_logs_insert_members
on public.audit_logs for insert to authenticated
with check (
  private.is_active_member(organization_id)
  and (select auth.uid()) is not null
  and actor_id = (select auth.uid())
);

insert into storage.buckets (id, name, public)
values ('organization-files', 'organization-files', false)
on conflict (id) do update
set name = excluded.name,
    public = false;

create policy organization_files_select_members
on storage.objects for select to authenticated
using (
  bucket_id = 'organization-files'
  and private.is_active_member(
    case
      when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        then ((storage.foldername(name))[1])::uuid
      else null
    end
  )
);

create policy organization_files_insert_members
on storage.objects for insert to authenticated
with check (
  bucket_id = 'organization-files'
  and private.is_active_member(
    case
      when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        then ((storage.foldername(name))[1])::uuid
      else null
    end
  )
);

create policy organization_files_update_members
on storage.objects for update to authenticated
using (
  bucket_id = 'organization-files'
  and private.is_active_member(
    case
      when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        then ((storage.foldername(name))[1])::uuid
      else null
    end
  )
)
with check (
  bucket_id = 'organization-files'
  and private.is_active_member(
    case
      when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        then ((storage.foldername(name))[1])::uuid
      else null
    end
  )
);

create policy organization_files_delete_members
on storage.objects for delete to authenticated
using (
  bucket_id = 'organization-files'
  and private.is_active_member(
    case
      when (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        then ((storage.foldername(name))[1])::uuid
      else null
    end
  )
);
