# CarSys Phase 1 Foundation Design

## Status

Approved conversational design, prepared for written-spec review.

## Objective

Build the secure, client-demo-ready foundation for a multi-tenant vehicle operations platform. Phase 1 delivers the shared application shell, Supabase authentication, tenant and branch boundaries, role-based access, module configuration, realistic demo identities, a database-backed dashboard preview, and the contracts that later dealership workflows will extend.

Phase 1 does not attempt the complete dealership workflow. Vehicle inventory depth begins in Phase 2, customer matching and profitability in Phase 3, transactional sales workflows in Phase 4, and full reporting and operational polish in Phase 5.

## Current Repository

The repository is greenfield. At approval time it contains Git metadata, a `.gitignore`, and ignored visual-brainstorming artifacts. There is no application code or working implementation to preserve.

## Chosen Approach

Use a Supabase-first vertical slice. Build the real schema, Row Level Security, authentication, permission system, seeded organization, and polished shell together so the riskiest security and architectural decisions are validated before dealership feature development.

Rejected alternatives:

- A frontend-first mock prototype would reach visuals sooner but could force tenant and data-contract rework.
- A database-first build of the entire eventual schema would delay the demo surface and overbuild future phases before workflows are validated.

## Product Boundary

The platform uses a shared core with dealership-first extensions.

Phase 1 shared-core domains:

- Organizations
- Organization modules
- Profiles and organization memberships
- Roles and permissions
- Branches and user branch assignments
- Minimal vehicle identity and status records for dashboard data
- Notifications contract
- Audit-log contract
- Private organization-scoped storage conventions

Module configuration supports `dealership`, `fleet_management`, and `vehicle_rental`. The seeded organization enables only `dealership`. Fleet and Rental are visible only to Owners on the module settings screen as disabled future upgrades. They do not appear in ordinary navigation and do not receive empty client-facing pages.

## Architecture

### Application

Use Next.js App Router with TypeScript, Tailwind CSS, and shadcn/ui. Server Components perform protected initial reads. Server Actions and Route Handlers perform mutations and callback handling. Client Components are limited to interactions that require browser state.

Feature folders own their validation schemas, queries, actions, components, and tests. General-purpose visual primitives stay in `components/ui`; application chrome stays in `components/app-shell`; Supabase clients and shared infrastructure stay in `lib`.

### Authentication and authorization

Use `@supabase/ssr` with cookie-backed browser and server clients. Protected routes require an authenticated Supabase user and an active organization membership.

Every protected operation is checked twice:

1. Application authorization resolves the active membership, role, permissions, and branch scope to provide useful redirects and errors.
2. Supabase Row Level Security is the final data boundary and rejects unauthorized access regardless of the client.

Authorization never trusts editable user metadata. Role and branch decisions come from database membership records. Authorization-critical JWT metadata is avoided where freshness could create stale access; active membership is checked against the database for protected operations.

### Data access

Reads are organization-scoped and, for branch-scoped members, limited to assigned branches. Owner access spans all branches in the organization. Sensitive financial data is queried through explicitly authorized server-side paths rather than fetched and hidden in the UI.

All exposed business tables have RLS enabled. Policies target explicit Postgres roles, include an active-membership predicate, use both `USING` and `WITH CHECK` for updates, and receive indexes on organization, membership, user, and branch columns used by policies.

Views exposed to authenticated users use `security_invoker = true`. Any privileged helper that is genuinely required lives in a non-exposed schema, has explicit execution grants, validates `auth.uid()`, and receives security review. No service-role key is shipped to browser code.

### Mutations and auditability

Server Actions validate with Zod, re-check permissions, perform mutations, and return typed success, field errors, or form errors. Significant mutations write audit entries in the same transaction where practical. Audit entries are append-only to ordinary organization users.

## Proposed Repository Structure

```text
src/
  app/
    (auth)/sign-in/
    (app)/dashboard/
    (app)/settings/company/
    (app)/settings/modules/
    (app)/settings/users/
    (app)/unauthorized/
    auth/callback/
  components/
    ui/
    app-shell/
  features/
    auth/
    organizations/
    permissions/
    branches/
    dashboard/
    settings/
  lib/
    supabase/
    validation/
    formatting/
supabase/
  migrations/
  seed.sql
tests/
  unit/
  integration/
  e2e/
docs/
  architecture/
  superpowers/
```

Files remain focused. Database code is grouped by feature contract rather than placed in page components. Pages compose feature components and do not contain large amounts of unrelated domain logic.

## Database Entities and Relationships

### Tenancy and modules

`organizations`

- Represents an isolated client workspace.
- Stores company name, slug, contact details, Philippine locale defaults, currency, timezone, status, and branding metadata.

`modules`

- Global catalog containing `dealership`, `fleet_management`, and `vehicle_rental`.

`organization_modules`

- Joins an organization to a module.
- Stores enabled state, enablement timestamp, and actor.
- Unique on organization and module.

### Identity and permissions

`profiles`

- One-to-one extension of `auth.users` using the Auth user primary key.
- Stores display name, mobile number, avatar path, and safe presentation data only.

`organization_memberships`

- Joins a user to an organization and a role.
- Stores active/inactive status, membership dates, and organization-level scope.
- Supports future membership in more than one organization without duplicating the Auth identity.

`roles`

- Organization-scoped or system-template role definitions.
- Seeds Owner, Branch Manager, Sales Agent, Inventory Staff, and Viewer.
- Supports later custom roles without exposing a custom-role editor in this MVP.

`permissions`

- Stable permission catalog such as `settings.manage`, `users.manage`, `financials.view_sensitive`, `vehicles.read`, and `reports.read`.

`role_permissions`

- Many-to-many relationship between roles and permissions.

### Branches

`branches`

- Organization-owned operating locations.
- The seeded organization has one active main branch.

`membership_branches`

- Assigns branch-scoped memberships to one or more branches.
- Owners use organization-wide scope and do not depend on enumerating every branch.

Phase 2 adds full vehicle transfer records and transfer history using these branch identifiers.

### Shared operational contracts

`vehicles`

- Phase 1 stores organization, branch, stock number, basic display identity, workflow status, list price, acquisition value, and timestamps needed for the dashboard preview.
- Phase 2 expands vehicle specifications, workflow history, inspections, tasks, media, documents, and validation rules.

`notifications`

- Organization-scoped, channel-neutral event records with recipient, category, priority, read state, related entity, and timestamps.
- Phase 1 establishes the contract; later phases create operational notification producers and the full notification center.

`audit_logs`

- Stores organization, actor, action, entity type and identifier, before and after JSON, required reason, timestamp, and request metadata when practical.

Storage objects use private buckets and organization-prefixed paths. Storage policies validate active membership and organization path ownership.

## Route Structure

```text
/(auth)/sign-in
/(app)/dashboard
/(app)/unauthorized
/(app)/settings/company
/(app)/settings/modules
/(app)/settings/users
/auth/callback
```

The `(app)` route group owns the protected shell and organization context. Later phases add dealership routes beneath this shell. Route availability and navigation visibility derive from permissions and enabled modules, but server-side authorization remains mandatory even when a link is hidden.

## Visual Design

The approved concept is the Apex Autohaus command-center dashboard generated during brainstorming. Its local source is:

`C:\Users\Kirk\.codex\generated_images\019fc2eb-c3b5-7a23-b442-a7a9eeb4aa98\exec-8a3e7f58-4aa9-44cb-a5ee-5bde6563a2df.png`

Design characteristics:

- Dark graphite fixed desktop navigation with restrained amber active accent
- White working canvas with cool-gray surfaces
- Graphite or navy text and semantic status colors used sparingly
- Compact operational typography similar to Geist or Inter
- Fine borders, minimal shadows, medium radii, and efficient spacing
- Asymmetric dashboard composition rather than an equal-card template grid
- Clear priority alerts with icons and text, never color alone
- Responsive sidebar collapse and mobile card alternatives for dense tables
- Light mode is the primary polished experience

The Phase 1 shell includes the full eventual dealership navigation structure, but routes not implemented in the active phase appear only when they lead to a deliberate preview or enabled workflow. Fleet and Rental remain absent outside Owner module settings.

## Dashboard Preview

The database-backed Phase 1 dashboard demonstrates the shell and security model with seeded summary records. It includes:

- Total inventory, available, reserved, and sold-this-month metrics
- Inventory pipeline summary
- Sales-performance preview
- Priority alerts
- Upcoming test-drive preview
- Oldest-unsold-vehicle preview
- Financial summary for roles with `financials.view_sensitive`

The Phase 1 dashboard may use simplified aggregate queries over minimal seeded records. Later phases replace or expand those queries as complete operational tables arrive. Unauthorized roles never receive sensitive values in payloads.

## Demo Organization and Roles

Seed the fictional Philippine dealership `Apex Autohaus` with its primary branch `Quezon City Main`.

Default roles:

- Owner: organization-wide access, settings, users, module configuration, financials, reports, and audit visibility.
- Branch Manager: assigned-branch operational access and branch reporting, without organization module configuration.
- Sales Agent: inventory viewing and future customer/sales workflows, without acquisition cost, minimum price, or profitability.
- Inventory Staff: vehicle preparation and record-management permissions, without sensitive profitability.
- Viewer: permitted read-only views and reports, without editing or sensitive profitability.

Demo credentials are documented in the README. Auth users are created through a secure administrative seed path that never exposes service credentials to the application client.

## Error and State Design

- Invalid credentials produce a clear sign-in error without leaking account existence details.
- Expired sessions redirect to sign-in and preserve a safe return destination.
- Missing membership or permission returns the dedicated unauthorized state.
- Zod validation errors map to accessible field errors and a concise form summary.
- Database and network failures show recoverable error states with retry actions where appropriate.
- Empty datasets show purposeful empty states, not blank cards.
- Loading routes and data regions use skeleton components.
- Successful mutations show toast feedback and refresh affected server data.
- Destructive actions require confirmation and remain unavailable to read-only users.

## Accessibility and Responsiveness

Use semantic landmarks, labeled inputs, keyboard-accessible menus and dialogs, visible focus states, sufficient contrast, descriptive controls, and status text in addition to color. Desktop navigation collapses appropriately on tablets and becomes an accessible drawer on mobile. Dense tables use responsive card representations when horizontal compression would harm readability.

## Testing Strategy

Follow red-green-refactor for production behavior.

Unit tests cover:

- Permission resolution
- Default role capabilities
- Role-aware navigation visibility
- Branch-scope helpers
- Philippine peso and date formatting
- Validation schemas introduced in Phase 1

Database integration tests cover:

- Cross-organization reads and writes are rejected
- Inactive memberships have no organization access
- Branch-scoped users cannot read another branch
- Owners can read all branches in their organization
- Viewers cannot mutate records
- Sales Agents and Inventory Staff cannot retrieve sensitive financial data
- Organization module changes require Owner permission

End-to-end tests cover:

- Owner sign-in, dashboard, settings access, and sign-out
- Sales Agent navigation and financial restrictions
- Viewer read-only behavior
- Unauthenticated protected-route redirect
- Unauthorized settings-route handling

Each phase concludes with linting, type checking, relevant tests, a production build, and browser verification at desktop and mobile sizes. Frontend completion includes direct comparison of the implementation screenshot with the approved concept.

## Phase 1 Delivery Order

1. Scaffold Next.js, TypeScript, Tailwind, shadcn/ui, linting, Vitest, and Playwright.
2. Establish design tokens and implement the approved responsive shell.
3. Create tenancy, identity, module, branch, role, and permission schema.
4. Add RLS, grants, indexes, private storage policies, and database security tests.
5. Add Supabase SSR authentication, protected routes, sign-in/out, and unauthorized handling.
6. Seed Apex Autohaus, Quezon City Main, default roles, permissions, demo users, and dashboard-preview data.
7. Implement role-aware navigation and branch-aware organization context.
8. Implement company, module, and user-management settings.
9. Implement the database-backed dashboard preview with role-sensitive values.
10. Run full Phase 1 verification and complete documentation.

## Overall Product Roadmap

- Phase 1: project foundation, design system, Supabase schema baseline, authentication, organizations, roles, seed identities, shell, settings, and dashboard preview.
- Phase 2: complete vehicle inventory, details, workflow, inspections, preparation tasks, media, and documents.
- Phase 3: expenses, profitability, customers, requests, deterministic matching, and operational notifications.
- Phase 4: test drives, reservations, deals, payment schedules, payments, and receivables.
- Phase 5: complete dashboard metrics, reports, audit-log experience, responsive polish, full demo-flow testing, and production documentation.

Each phase receives its own specification, implementation plan, tests, verification, and completion summary.

## Assumptions and Constraints

- The supplied Supabase project URL and publishable key are stored only in local environment configuration and are never committed.
- The supplied PostgreSQL URL still contains a password placeholder. Remote schema deployment and remote demo-user creation require an authenticated Supabase connection or the actual database password.
- Local setup, migration files, UI development, and unit tests may proceed before remote database credentials are available.
- Phase 1 seeds minimal vehicle and dashboard data for a coherent demonstration; the full requirement of at least 25 rich vehicle records is completed in Phase 2.
- Phase 1 settings provide practical company, module, and user-management experiences without a custom-role editor or SaaS billing.
- Philippine pesos, Asia/Manila timezone behavior, fictional Philippine addresses, and fictional Filipino demo identities are used throughout.
- The project targets Vercel-compatible deployment and keeps secrets server-only.

## Phase 1 Acceptance Criteria

Phase 1 is complete when:

- The application builds and runs as a Next.js App Router project.
- Apex Autohaus demo users can sign in through Supabase Auth.
- Protected routes reject unauthenticated users.
- Organization, role, and branch boundaries are enforced by tested RLS policies.
- Owner, Branch Manager, Sales Agent, Inventory Staff, and Viewer receive correct navigation and permissions.
- The approved dashboard and shell are implemented responsively and verified against the accepted concept.
- Company, module, and user settings are functional for authorized users.
- Dealership is enabled while Fleet and Rental appear only as disabled Owner settings options.
- Sensitive dashboard values never reach unauthorized roles.
- Linting, type checking, unit tests, integration tests, E2E smoke tests, and the production build pass.
- README, environment template, schema documentation, permission matrix, setup instructions, security considerations, limitations, and future-module roadmap are present.
