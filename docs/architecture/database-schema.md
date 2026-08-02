# Phase 1 database schema

## Security model

Phase 1 is a shared-schema, row-level multi-tenant design. `organization_id`
is the tenant key on every organization-owned record. PostgreSQL row-level
security (RLS), not frontend filtering, is the final tenant boundary. All
application-table policies target `authenticated`; `anon` receives no business
table grants.

Four authorization functions live in the unexposed `private` schema:

- `private.is_active_member(organization_id)` verifies an authenticated user
  has an active membership in an active organization.
- `private.has_permission(organization_id, permission_key)` resolves the
  active membership's role and stable permission keys.
- `private.can_access_branch(organization_id, branch_id)` grants all branches
  to organization-scope members and only explicit `membership_branches`
  assignments to branch-scoped members.
- `private.can_view_profile(user_id)` permits self access or access between
  active users who share an active organization.

The functions use `security definer` only to avoid recursive RLS while reading
the authorization graph. Each validates `auth.uid()`, fully qualifies every
relation, fixes `search_path` to the empty string, denies execution to `PUBLIC`
and `anon`, and grants execution only to `authenticated`. No authorization data
comes from user-editable JWT metadata.

There are no Phase 1 database views. Any future view exposed through the Data
API must use `security_invoker = true`; otherwise it must remain in an
unexposed schema with API roles revoked.

## Enums

| Enum | Values |
| --- | --- |
| `module_key` | `dealership`, `fleet_management`, `vehicle_rental` |
| `membership_status` | `invited`, `active`, `suspended`, `inactive` |
| `organization_scope` | `organization`, `assigned_branches` |
| `vehicle_workflow_status` | `acquired`, `for_inspection`, `for_repair_or_preparation`, `ready_for_listing`, `available`, `reserved`, `sold`, `released`, `withdrawn`, `returned_to_supplier`, `written_off`, `archived` |
| `notification_priority` | `low`, `normal`, `high`, `urgent` |

## Entities and relationships

All primary keys are UUIDs. Mutable entities include `created_at` and
`updated_at` timestamps; event and snapshot entities use immutable event times.

| Entity | Purpose and important fields | Tenant and relationships | RLS intent |
| --- | --- | --- | --- |
| `organizations` | Company identity (`company_name`, unique `slug`), contact/address, PHP currency, Asia/Manila timezone, active state, and branding JSON. | Tenant root. | Active members can read their organization. `settings.manage` is required to update it. Creation/deletion is not exposed to ordinary authenticated users. |
| `modules` | Global module catalog keyed by `module_key`; the migration idempotently installs all three module entries. | Global, not tenant-owned. Referenced by `organization_modules`. | Any user with an active organization can read the catalog. Ordinary users cannot mutate it. |
| `organization_modules` | Per-organization enablement, timestamp, and enabling actor. Unique organization/module pair. | `organization_id` tenant key; references `modules`; `(organization_id, enabled_by)` must identify a membership in the same tenant. | Active organization members can read. Insert/update/delete requires `modules.manage`. |
| `profiles` | Self-safe identity only: display name, mobile, avatar object path. No role, permission, financial, or private auth fields. | `id` is also an `auth.users(id)` foreign key with cascade-on-user-deletion. | Visible to self or users sharing an active organization. Only the profile owner can insert or update. |
| `roles` | Organization role code/name/description and system-role marker. Code is unique per organization. | `organization_id` tenant key; `(organization_id, id)` supports composite child keys. | Active members can read. Writes require `users.manage`. |
| `permissions` | Stable global permission key, display name, and description. | Global catalog referenced by `role_permissions`. | Active members can read. Ordinary users cannot change the catalog. |
| `role_permissions` | Assigns a global permission to a role within one organization. | `organization_id` tenant key; composite `(organization_id, role_id)` foreign key prevents cross-tenant role assignments. | Active members can read. Assignment/removal requires `users.manage`. |
| `organization_memberships` | Joins an auth profile to one role with status, organization/branch scope, and lifecycle timestamps. One membership per organization/user. | `organization_id` tenant key; composite role foreign key; `(organization_id, id)` and `(organization_id, user_id)` are parent keys for tenant-safe children. | Users see only active memberships in organizations where they are active. Writes require `users.manage`. Inactive/suspended memberships cannot authorize access. |
| `branches` | Organization branch code/name/address, primary marker, and active state. Only one primary branch per organization. | `organization_id` tenant key; `(organization_id, id)` supports composite child keys. | Reads respect organization scope or explicit assignments. `settings.manage` is required for writes; only organization-scope settings managers can create new branches. |
| `membership_branches` | Explicit branch assignments for branch-scoped memberships. Unique organization/membership/branch tuple. | `organization_id` tenant key; composite membership and branch foreign keys enforce one tenant on both sides. | A member can see their assignments; `users.manage` can see/manage assignments for the organization. |
| `vehicles` | General inventory: branch, tenant-unique stock number, plausible model year, make/model/variant, workflow status, list price, and acquisition/listing/release timestamps. | `organization_id` tenant key; composite branch foreign key; `(organization_id, id)` supports financial child integrity. | Active members can read only accessible branches. Writes additionally require `vehicles.manage`. |
| `vehicle_financials` | One-to-one sensitive financial record with nonnegative acquisition value, total invested value, expected profit, and receivables. | `organization_id` tenant key; unique `vehicle_id`; composite vehicle foreign key enforces same-tenant ownership. | Every operation requires `financials.view_sensitive` plus access to the vehicle's branch. |
| `dashboard_snapshots` | Precomputed metric payload by period, optional branch, sensitivity marker, and generation time. | `organization_id` tenant key; optional composite branch foreign key. A null branch means an organization-wide aggregate. | Non-sensitive rows require organization and branch scope. Organization-wide rows require organization scope. Sensitive rows additionally require `financials.view_sensitive`. Phase 1 exposes reads only. |
| `notifications` | Recipient, category, priority, title/body, read state, optional related entity, and creation time. | `organization_id` tenant key; composite recipient foreign key guarantees the recipient belongs to that tenant. | Only the recipient can read or update; column grants restrict updates to `is_read`/`read_at`. Any active member may insert only for an active recipient in the same organization. |
| `audit_logs` | Append-only action record with actor, entity, before/after JSON, reason, request metadata, and event time. | `organization_id` tenant key; composite actor foreign key prevents cross-tenant actors and preserves the organization when a removed actor is nulled. | Reads require `audit_logs.read`. Inserts require active membership and `actor_id = auth.uid()`. Authenticated users have no update/delete grant or policy. |

## Sensitive-data boundary

`vehicles` deliberately contains no acquisition-cost, invested-value, expected
profit, receivable, or margin fields. Those values live only in
`vehicle_financials`, which has its own table grants and RLS permission check.
This separation ensures a query authorized for ordinary inventory never
returns sensitive columns at all. Sensitive dashboard payloads use the same
`financials.view_sensitive` permission.

The schema contains no service-role secret, database password, or application
secret. Service-role access remains a server-only operational concern outside
this migration.

## Storage

`organization-files` is a private Supabase Storage bucket. Every object name
must follow this boundary:

```text
<organization-uuid>/<optional-subfolders>/<filename>
```

For example:

```text
25dc60ad-45b7-42d4-b6dc-3cf23e8b70dc/vehicles/photos/front.jpg
```

SELECT, INSERT, UPDATE, and DELETE policies on `storage.objects` validate that
the bucket is `organization-files`, parse the first folder only when it is a
UUID, and require active membership in that organization. UPDATE has both
`USING` and `WITH CHECK`, so neither an existing foreign-tenant object nor a
renamed destination path can cross the tenant boundary. The bucket is never
made public. Storage upsert consequently has the SELECT + INSERT + UPDATE policy
coverage required by Supabase Storage.

## Index strategy

Primary and unique constraints index all IDs, tenant slugs/codes, membership
pairs, stock numbers, and one-to-one vehicle financial links. Additional
indexes cover:

- every `organization_id`, `user_id`, `role_id`, `branch_id`, `membership_id`,
  module, permission, recipient, and actor path used by RLS;
- membership and organization active/status filters;
- vehicle organization/branch/workflow status plus acquisition, listing,
  release, and creation times;
- dashboard organization/branch/metric, period boundaries, sensitivity, and
  generation time;
- notification recipient/read state, priority, and creation time; and
- audit organization/time, actor, action, and entity lookups.

Composite tenant indexes lead with `organization_id` where organization-scoped
queries are expected. Clients should still include organization and branch
filters in queries; RLS remains the security check while explicit filters give
the planner better access paths.

## Module extension boundary

Phase 1 seeds the global catalog and implements the dealership-neutral tenant,
identity, authorization, branch, vehicle, notification, audit, snapshot, and
storage foundations. It does not create demo organizations or users.

- Dealership behavior can build directly on `vehicles` and
  `vehicle_financials`.
- Fleet Management remains behind the `fleet_management` catalog entry. Future
  fleet assignments, maintenance, telemetry, and utilization tables must carry
  `organization_id` and use tenant-aware vehicle/branch foreign keys.
- Vehicle Rental remains behind the `vehicle_rental` catalog entry. Future
  customers, reservations, agreements, payments, inspections, and returns must
  carry `organization_id`; branch- and vehicle-owned rows must use composite
  tenant foreign keys.

Enabling a module changes entitlement only. It never weakens tenant RLS or
implicitly exposes extension tables.

## Type generation and validation state

`src/lib/supabase/types.ts` manually mirrors this Phase 1 migration so client
work remains type-safe before deployment. It is explicitly temporary: after
the migration is reviewed and applied to the authorized target, replace it with
fresh CLI-generated remote types and review the resulting diff.

The pgTAP suite in `supabase/tests/phase_1_rls.sql` is transaction-scoped and
rolls back deterministic fixtures. Database reset, pgTAP execution, generated
remote types, and database advisors remain required deployment gates; they are
not substituted by application lint/type/build checks.
