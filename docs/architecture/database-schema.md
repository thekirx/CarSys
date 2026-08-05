# Phase 1 database schema

## Tenant boundary

`organizations` is the root tenant. Every operational record stores `organization_id`; branch-owned records additionally store `branch_id`. Unique constraints include the organization where identifiers are tenant-local.

`private.is_active_member`, `private.has_permission`, and `private.can_access_branch` are security-definer helpers in a non-exposed schema. They use `auth.uid()`, a fixed search path, and explicit grants to `authenticated`.

## Core entities

| Entity | Purpose | Tenant/branch ownership |
|---|---|---|
| `organizations` | Isolated customer workspace | Root tenant |
| `modules`, `organization_modules` | Global module catalog and tenant enablement | Organization |
| `profiles` | Safe presentation data extending `auth.users` | User identity |
| `roles`, `permissions`, `role_permissions` | Stable authorization contract | Organization role |
| `organization_memberships` | User-to-organization access, status, role, and scope | Organization |
| `branches`, `membership_branches` | Operating locations and branch assignments | Organization/branch |
| `vehicles` | Non-sensitive Phase 1 stock identity and workflow | Organization/branch |
| `vehicle_financials` | Acquisition, preparation, and minimum-price values | Organization/vehicle |
| `dashboard_snapshots` | Temporary dashboard read-model payloads | Organization/optional branch |
| `notifications` | Channel-neutral operational events | Organization/recipient |
| `audit_logs` | Append-oriented mutation evidence | Organization |

## Sensitive-column separation

PostgreSQL RLS filters rows, not individual columns. To ensure sensitive financial values never reach unauthorized clients, Phase 1 stores acquisition value, preparation cost, and minimum price in `vehicle_financials`. Only roles with `financials.view_sensitive` can select this table. This is stronger than fetching the value and hiding it in React.

## RLS intent

- Organizations: active members can read; `settings.manage` can update.
- Modules: authenticated users can read the catalog; organization enablement requires membership and `modules.manage` to update.
- Roles and memberships: self-access is limited; organization management requires `users.manage`.
- Branches and vehicles: reads require active permission plus branch access. Vehicle mutations require `vehicles.manage`.
- Vehicle financials: read requires `financials.view_sensitive`; mutation additionally requires `vehicles.manage`.
- Dashboard snapshots: active members can read records within their branch scope.
- Notifications: recipients can read/update their own notifications; organization administrators can review membership-related events.
- Audit logs: only `audit_logs.read` can select; inserts must identify the current actor.

All exposed business tables have RLS enabled. Update policies include both `USING` and `WITH CHECK`.

## Indexes

Policy and dashboard paths are supported by indexes on membership user/organization/status, role permission relations, branch organization/status, vehicle organization/branch/status, dashboard key, unread notifications, and organization audit timestamps.

## Storage

The private bucket is `carsys-private`. Object paths begin with the organization UUID:

```text
<organization-id>/vehicles/<vehicle-id>/photos/<file>
<organization-id>/vehicles/<vehicle-id>/documents/<file>
<organization-id>/branding/<file>
```

Storage policies validate the first folder segment against active organization membership. Deletion requires `vehicles.manage`.

## Extension boundaries

Later modules reuse organizations, branches, memberships, roles, permissions, notifications, audit logs, and private storage. Fleet and Rental receive separate domain tables and policies rather than overloading dealership vehicle workflow states.

## Integrity hardening

- `vehicle_financials (organization_id, vehicle_id)` references the matching organization-owned vehicle.
- `dashboard_snapshots (organization_id, branch_id)` references a branch in the same organization.
- Membership role assignments are validated so organization-local roles cannot cross tenant boundaries.
- Membership branch assignments are validated so a membership can only reference branches from its own organization.
- Dashboard snapshots have authenticated read access only; backend writers use controlled administrative execution.
