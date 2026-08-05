-- CarSys Phase 1 foundation
-- Multi-tenant dealership core with branch isolation and permission-aware RLS.

create extension if not exists pgcrypto;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create type public.module_key as enum ('dealership', 'fleet_management', 'vehicle_rental');
create type public.membership_status as enum ('invited', 'active', 'suspended', 'inactive');
create type public.organization_scope as enum ('organization', 'assigned_branches');
create type public.organization_status as enum ('active', 'suspended', 'inactive');
create type public.branch_status as enum ('active', 'inactive');
create type public.vehicle_workflow_status as enum (
  'acquired', 'for_inspection', 'for_repair_or_preparation', 'ready_for_listing',
  'available', 'reserved', 'sold', 'released', 'withdrawn',
  'returned_to_supplier', 'written_off', 'archived'
);
create type public.notification_priority as enum ('info', 'warning', 'critical');

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 100),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  email text,
  phone text,
  address text,
  timezone text not null default 'Asia/Manila',
  currency text not null default 'PHP',
  status public.organization_status not null default 'active',
  logo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (timezone = 'Asia/Manila'),
  check (currency = 'PHP')
);

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  key public.module_key not null unique,
  name text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

create table public.organization_modules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  module_id uuid not null references public.modules(id) on delete restrict,
  enabled boolean not null default false,
  enabled_at timestamptz,
  enabled_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, module_id),
  check ((enabled and enabled_at is not null) or (not enabled))
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(trim(display_name)) >= 2),
  email text,
  mobile_number text,
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  code text not null check (code ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null,
  description text not null default '',
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index roles_org_code_unique on public.roles (coalesce(organization_id, '00000000-0000-0000-0000-000000000000'::uuid), code);

create table public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z0-9_]+(?:\.[a-z0-9_]+)+$'),
  name text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

create table public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_id, permission_id)
);

create table public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete restrict,
  status public.membership_status not null default 'invited',
  scope public.organization_scope not null default 'assigned_branches',
  invited_at timestamptz not null default now(),
  joined_at timestamptz,
  suspended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null check (code ~ '^[A-Z0-9]+(?:-[A-Z0-9]+)*$'),
  name text not null,
  address text,
  timezone text not null default 'Asia/Manila',
  status public.branch_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code),
  unique (organization_id, id)
);

create table public.membership_branches (
  membership_id uuid not null references public.organization_memberships(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (membership_id, branch_id)
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid not null,
  stock_number text not null,
  year integer not null check (year between 1900 and 2100),
  make text not null,
  model text not null,
  variant text,
  color text,
  plate_number text,
  vin text,
  workflow_status public.vehicle_workflow_status not null default 'acquired',
  list_price numeric(14,2) not null default 0 check (list_price >= 0),
  acquired_at date,
  listed_at date,
  sold_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, stock_number),
  unique (organization_id, id),
  foreign key (organization_id, branch_id) references public.branches(organization_id, id) on delete restrict
);

-- Sensitive acquisition and profitability values are intentionally separated from
-- the general vehicle record so non-financial roles cannot receive them in payloads.
create table public.vehicle_financials (
  vehicle_id uuid primary key references public.vehicles(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  acquisition_value numeric(14,2) not null default 0 check (acquisition_value >= 0),
  preparation_cost numeric(14,2) not null default 0 check (preparation_cost >= 0),
  minimum_price numeric(14,2) check (minimum_price is null or minimum_price >= 0),
  updated_at timestamptz not null default now(),
  unique (organization_id, vehicle_id),
  foreign key (organization_id, vehicle_id) references public.vehicles(organization_id, id) on delete cascade
);

create table public.dashboard_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  branch_id uuid references public.branches(id) on delete cascade,
  metric_key text not null,
  period_start date,
  period_end date,
  payload jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default now(),
  unique (organization_id, branch_id, metric_key, period_start, period_end),
  foreign key (organization_id, branch_id) references public.branches(organization_id, id) on delete cascade
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  recipient_user_id uuid references auth.users(id) on delete cascade,
  category text not null,
  priority public.notification_priority not null default 'info',
  title text not null,
  body text not null default '',
  related_entity_type text,
  related_entity_id uuid,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  reason text,
  request_metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.validate_membership_role()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1 from public.roles role
    where role.id = new.role_id
      and (role.organization_id is null or role.organization_id = new.organization_id)
  ) then
    raise exception 'Role must belong to the membership organization';
  end if;
  return new;
end;
$$;

create or replace function private.validate_membership_branch()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1
    from public.organization_memberships membership
    join public.branches branch on branch.id = new.branch_id
    where membership.id = new.membership_id
      and branch.organization_id = membership.organization_id
  ) then
    raise exception 'Branch must belong to the membership organization';
  end if;
  return new;
end;
$$;

create or replace function private.storage_organization_id(object_name text)
returns uuid
language plpgsql
stable
security invoker
set search_path = storage, pg_temp
as $$
begin
  return ((storage.foldername(object_name))[1])::uuid;
exception when invalid_text_representation or array_subscript_error then
  return null;
end;
$$;

create trigger organizations_set_updated_at before update on public.organizations for each row execute function private.set_updated_at();
create trigger organization_modules_set_updated_at before update on public.organization_modules for each row execute function private.set_updated_at();
create trigger profiles_set_updated_at before update on public.profiles for each row execute function private.set_updated_at();
create trigger roles_set_updated_at before update on public.roles for each row execute function private.set_updated_at();
create trigger memberships_set_updated_at before update on public.organization_memberships for each row execute function private.set_updated_at();
create trigger memberships_validate_role before insert or update of organization_id, role_id on public.organization_memberships for each row execute function private.validate_membership_role();
create trigger branches_set_updated_at before update on public.branches for each row execute function private.set_updated_at();
create trigger membership_branches_validate before insert or update on public.membership_branches for each row execute function private.validate_membership_branch();
create trigger vehicles_set_updated_at before update on public.vehicles for each row execute function private.set_updated_at();
create trigger vehicle_financials_set_updated_at before update on public.vehicle_financials for each row execute function private.set_updated_at();

create or replace function private.is_active_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.organization_memberships membership
    join public.organizations organization on organization.id = membership.organization_id
    where membership.organization_id = target_organization_id
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'
      and organization.status = 'active'
  );
$$;

create or replace function private.has_permission(target_organization_id uuid, target_permission_key text)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.organization_memberships membership
    join public.role_permissions role_permission on role_permission.role_id = membership.role_id
    join public.permissions permission on permission.id = role_permission.permission_id
    join public.organizations organization on organization.id = membership.organization_id
    where membership.organization_id = target_organization_id
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'
      and organization.status = 'active'
      and permission.key = target_permission_key
  );
$$;

create or replace function private.can_access_branch(target_organization_id uuid, target_branch_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = target_organization_id
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'
      and (
        membership.scope = 'organization'
        or exists (
          select 1 from public.membership_branches assignment
          where assignment.membership_id = membership.id
            and assignment.branch_id = target_branch_id
        )
      )
  );
$$;

revoke all on function private.is_active_member(uuid) from public;
revoke all on function private.has_permission(uuid, text) from public;
revoke all on function private.can_access_branch(uuid, uuid) from public;
revoke all on function private.storage_organization_id(text) from public;
grant execute on function private.is_active_member(uuid) to authenticated;
grant execute on function private.has_permission(uuid, text) to authenticated;
grant execute on function private.can_access_branch(uuid, uuid) to authenticated;
grant execute on function private.storage_organization_id(text) to authenticated;

create index memberships_user_org_status_idx on public.organization_memberships (user_id, organization_id, status);
create index memberships_role_idx on public.organization_memberships (role_id);
create index branches_org_status_idx on public.branches (organization_id, status);
create index membership_branches_branch_idx on public.membership_branches (branch_id, membership_id);
create index vehicles_org_branch_status_idx on public.vehicles (organization_id, branch_id, workflow_status);
create index vehicles_org_created_idx on public.vehicles (organization_id, created_at desc);
create index vehicle_financials_org_idx on public.vehicle_financials (organization_id, vehicle_id);
create index snapshots_org_branch_key_idx on public.dashboard_snapshots (organization_id, branch_id, metric_key);
create index notifications_recipient_unread_idx on public.notifications (recipient_user_id, read_at, created_at desc);
create index audit_logs_org_created_idx on public.audit_logs (organization_id, created_at desc);
create index role_permissions_permission_idx on public.role_permissions (permission_id, role_id);

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

create policy organizations_select on public.organizations for select to authenticated
  using (private.is_active_member(id));
create policy organizations_update on public.organizations for update to authenticated
  using (private.has_permission(id, 'settings.manage'))
  with check (private.has_permission(id, 'settings.manage'));

create policy modules_select on public.modules for select to authenticated using (true);
create policy organization_modules_select on public.organization_modules for select to authenticated
  using (private.is_active_member(organization_id));
create policy organization_modules_update on public.organization_modules for update to authenticated
  using (private.has_permission(organization_id, 'modules.manage'))
  with check (private.has_permission(organization_id, 'modules.manage'));

create policy profiles_select on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or exists (
      select 1 from public.organization_memberships target
      join public.organization_memberships viewer on viewer.organization_id = target.organization_id
      where target.user_id = profiles.id
        and viewer.user_id = (select auth.uid())
        and viewer.status = 'active'
        and target.status in ('active', 'invited', 'suspended')
    )
  );
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy roles_select on public.roles for select to authenticated
  using (organization_id is null or private.is_active_member(organization_id));
create policy roles_manage on public.roles for all to authenticated
  using (organization_id is not null and private.has_permission(organization_id, 'users.manage'))
  with check (organization_id is not null and private.has_permission(organization_id, 'users.manage'));

create policy permissions_select on public.permissions for select to authenticated
  using (exists (select 1 from public.organization_memberships membership where membership.user_id = (select auth.uid()) and membership.status = 'active'));
create policy role_permissions_select on public.role_permissions for select to authenticated
  using (exists (select 1 from public.roles role where role.id = role_id and (role.organization_id is null or private.is_active_member(role.organization_id))));
create policy role_permissions_manage on public.role_permissions for all to authenticated
  using (exists (select 1 from public.roles role where role.id = role_id and role.organization_id is not null and private.has_permission(role.organization_id, 'users.manage')))
  with check (exists (select 1 from public.roles role where role.id = role_id and role.organization_id is not null and private.has_permission(role.organization_id, 'users.manage')));

create policy memberships_select on public.organization_memberships for select to authenticated
  using (user_id = (select auth.uid()) or private.has_permission(organization_id, 'users.manage'));
create policy memberships_insert on public.organization_memberships for insert to authenticated
  with check (private.has_permission(organization_id, 'users.manage'));
create policy memberships_update on public.organization_memberships for update to authenticated
  using (private.has_permission(organization_id, 'users.manage'))
  with check (private.has_permission(organization_id, 'users.manage'));
create policy memberships_delete on public.organization_memberships for delete to authenticated
  using (private.has_permission(organization_id, 'users.manage'));

create policy branches_select on public.branches for select to authenticated
  using (private.can_access_branch(organization_id, id));
create policy branches_manage on public.branches for all to authenticated
  using (private.has_permission(organization_id, 'settings.manage'))
  with check (private.has_permission(organization_id, 'settings.manage'));

create policy membership_branches_select on public.membership_branches for select to authenticated
  using (exists (
    select 1 from public.organization_memberships membership
    where membership.id = membership_id
      and (membership.user_id = (select auth.uid()) or private.has_permission(membership.organization_id, 'users.manage'))
  ));
create policy membership_branches_manage on public.membership_branches for all to authenticated
  using (exists (
    select 1 from public.organization_memberships membership
    join public.branches branch on branch.id = membership_branches.branch_id and branch.organization_id = membership.organization_id
    where membership.id = membership_branches.membership_id
      and private.has_permission(membership.organization_id, 'users.manage')
  ))
  with check (exists (
    select 1 from public.organization_memberships membership
    join public.branches branch on branch.id = membership_branches.branch_id and branch.organization_id = membership.organization_id
    where membership.id = membership_branches.membership_id
      and private.has_permission(membership.organization_id, 'users.manage')
  ));

create policy vehicles_select on public.vehicles for select to authenticated
  using (private.has_permission(organization_id, 'vehicles.read') and private.can_access_branch(organization_id, branch_id));
create policy vehicles_insert on public.vehicles for insert to authenticated
  with check (private.has_permission(organization_id, 'vehicles.manage') and private.can_access_branch(organization_id, branch_id));
create policy vehicles_update on public.vehicles for update to authenticated
  using (private.has_permission(organization_id, 'vehicles.manage') and private.can_access_branch(organization_id, branch_id))
  with check (private.has_permission(organization_id, 'vehicles.manage') and private.can_access_branch(organization_id, branch_id));
create policy vehicles_delete on public.vehicles for delete to authenticated
  using (private.has_permission(organization_id, 'vehicles.manage') and private.can_access_branch(organization_id, branch_id));

create policy vehicle_financials_select on public.vehicle_financials for select to authenticated
  using (private.has_permission(organization_id, 'financials.view_sensitive'));
create policy vehicle_financials_manage on public.vehicle_financials for all to authenticated
  using (private.has_permission(organization_id, 'financials.view_sensitive') and private.has_permission(organization_id, 'vehicles.manage'))
  with check (private.has_permission(organization_id, 'financials.view_sensitive') and private.has_permission(organization_id, 'vehicles.manage'));

create policy snapshots_select on public.dashboard_snapshots for select to authenticated
  using (private.is_active_member(organization_id) and (branch_id is null or private.can_access_branch(organization_id, branch_id)));

create policy notifications_select on public.notifications for select to authenticated
  using (private.is_active_member(organization_id) and (recipient_user_id is null or recipient_user_id = (select auth.uid()) or private.has_permission(organization_id, 'users.manage')));
create policy notifications_update on public.notifications for update to authenticated
  using (recipient_user_id = (select auth.uid()))
  with check (recipient_user_id = (select auth.uid()));

create policy audit_logs_select on public.audit_logs for select to authenticated
  using (private.has_permission(organization_id, 'audit_logs.read'));
create policy audit_logs_insert on public.audit_logs for insert to authenticated
  with check (private.is_active_member(organization_id) and actor_user_id = (select auth.uid()));

revoke all on all tables in schema public from anon;
grant select, insert, update, delete on public.organizations, public.organization_modules, public.profiles, public.roles,
  public.role_permissions, public.organization_memberships, public.branches, public.membership_branches,
  public.vehicles, public.vehicle_financials, public.notifications, public.audit_logs to authenticated;
grant select on public.modules, public.permissions, public.dashboard_snapshots to authenticated;

grant usage on schema public to authenticated;

-- Private organization media. The first path segment must be the organization UUID.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('carsys-private', 'carsys-private', false, 15728640, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy carsys_private_select on storage.objects for select to authenticated
  using (bucket_id = 'carsys-private' and private.is_active_member(private.storage_organization_id(name)));
create policy carsys_private_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'carsys-private' and private.is_active_member(private.storage_organization_id(name)));
create policy carsys_private_update on storage.objects for update to authenticated
  using (bucket_id = 'carsys-private' and private.is_active_member(private.storage_organization_id(name)))
  with check (bucket_id = 'carsys-private' and private.is_active_member(private.storage_organization_id(name)));
create policy carsys_private_delete on storage.objects for delete to authenticated
  using (bucket_id = 'carsys-private' and private.has_permission(private.storage_organization_id(name), 'vehicles.manage'));
