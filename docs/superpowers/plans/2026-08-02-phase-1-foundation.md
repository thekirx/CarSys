# CarSys Phase 1 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a secure, database-backed, responsive Phase 1 foundation for Apex Autohaus with Supabase authentication, tenant and branch isolation, role-aware navigation, Owner settings, and the approved dashboard experience.

**Architecture:** Next.js App Router Server Components load protected organization data through cookie-backed Supabase SSR clients. Server Actions validate input and permissions before mutations, while PostgreSQL Row Level Security independently enforces active organization membership, branch scope, and sensitive-data boundaries. Feature folders own domain contracts; shared UI and application chrome stay separate.

**Tech Stack:** Next.js App Router, TypeScript, React, Tailwind CSS, shadcn/ui, Supabase PostgreSQL/Auth/Storage/RLS, React Hook Form, Zod, Recharts, Lucide, Vitest, Testing Library, Playwright, pnpm.

## Global Constraints

- Use the approved Apex Autohaus dashboard concept at `C:\Users\Kirk\.codex\generated_images\019fc2eb-c3b5-7a23-b442-a7a9eeb4aa98\exec-8a3e7f58-4aa9-44cb-a5ee-5bde6563a2df.png` as the visual specification.
- Use Server Components for protected initial reads and Client Components only for browser interaction.
- Keep every exposed Supabase business table protected by RLS; frontend hiding is never an authorization boundary.
- Never use editable user metadata for authorization and never expose a service-role or secret key to client code.
- Store the supplied project URL and publishable key only in `.env.local`; commit only `.env.example`.
- Use Philippine pesos, `Asia/Manila`, fictional Philippine data, semantic HTML, keyboard access, and status text in addition to color.
- Dealership is enabled. Fleet Management and Vehicle Rental appear only as disabled options in Owner module settings.
- Follow red-green-refactor for production behavior and run lint, type checking, tests, production build, browser verification, and concept comparison before completion.
- Use the Supabase CLI `migration new` command to create migration filenames; never invent migration timestamps.
- Commit the pnpm lockfile and keep dependency versions reproducible.

---

## File Responsibility Map

```text
src/app/                         Route composition, protected layouts, loading/error states
src/components/ui/               shadcn/ui source components
src/components/app-shell/        Sidebar, mobile navigation, header, breadcrumbs, user menu
src/features/auth/               Sign-in actions, session-to-context resolution
src/features/permissions/        Permission types, role checks, navigation policy
src/features/organizations/      Organization context and company actions
src/features/branches/           Branch selection and scope helpers
src/features/dashboard/          Dashboard query contract and visual sections
src/features/settings/           Company, module, and user settings forms/actions
src/lib/supabase/                Browser, server, middleware clients
src/lib/formatting/              Philippine currency/date formatting
src/lib/validation/              Shared Zod primitives
supabase/migrations/              Schema, grants, RLS, indexes, storage policies
supabase/tests/                   SQL tenant and permission assertions
tests/unit/                       Pure business and component policy tests
tests/e2e/                        Critical role-aware browser flows
docs/architecture/               Schema, permissions, security, extension boundaries
```

### Task 1: Scaffold the application and verification toolchain

**Files:**
- Create: `package.json`
- Create: `pnpm-lock.yaml`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `postcss.config.mjs`
- Create: `eslint.config.mjs`
- Create: `vitest.config.ts`
- Create: `playwright.config.ts`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx`
- Create: `src/app/globals.css`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: approved Phase 1 specification and the repository-local pnpm runtime.
- Produces: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, `pnpm build`, and the `@/*` import alias.

- [ ] **Step 1: Create the package manifest and exact scripts**

```json
{
  "name": "carsys",
  "version": "0.1.0",
  "private": true,
  "packageManager": "pnpm@10",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  }
}
```

- [ ] **Step 2: Install application and test dependencies with exact lockfile resolution**

Run:

```powershell
pnpm add --save-exact next react react-dom @supabase/ssr @supabase/supabase-js react-hook-form zod @hookform/resolvers @tanstack/react-table recharts lucide-react next-themes sonner date-fns clsx tailwind-merge class-variance-authority
pnpm add --save-dev --save-exact typescript @types/node @types/react @types/react-dom tailwindcss @tailwindcss/postcss eslint eslint-config-next vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event vite-tsconfig-paths @playwright/test
```

Expected: `package.json` and `pnpm-lock.yaml` contain resolved dependencies without installation warnings that require action.

- [ ] **Step 3: Configure TypeScript, ESLint, Vitest, Playwright, and the minimal App Router root**

Use these core settings:

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    coverage: { reporter: ["text", "html"] },
  },
});
```

```ts
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  use: { baseURL: "http://127.0.0.1:3000", trace: "retain-on-failure" },
  webServer: { command: "pnpm dev", url: "http://127.0.0.1:3000", reuseExistingServer: true },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } }
  ],
});
```

- [ ] **Step 4: Verify the scaffold**

Run:

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Expected: every command exits 0; Vitest may report zero tests only for this scaffold step.

- [ ] **Step 5: Commit the scaffold**

```powershell
git add package.json pnpm-lock.yaml next.config.ts tsconfig.json postcss.config.mjs eslint.config.mjs vitest.config.ts playwright.config.ts src/app .gitignore
git commit -m "chore: scaffold phase 1 application"
```

### Task 2: Add shared formatting and validation contracts with TDD

**Files:**
- Create: `tests/setup.ts`
- Create: `tests/unit/formatting/philippines.test.ts`
- Create: `src/lib/formatting/philippines.ts`
- Create: `tests/unit/validation/shared.test.ts`
- Create: `src/lib/validation/shared.ts`

**Interfaces:**
- Consumes: Vitest from Task 1.
- Produces: `formatPeso(value: number): string`, `formatManilaDate(value: Date | string): string`, `requiredText`, `positiveMoney`, and `organizationSlug`.

- [ ] **Step 1: Write failing formatting tests**

```ts
import { describe, expect, it } from "vitest";
import { formatManilaDate, formatPeso } from "@/lib/formatting/philippines";

describe("Philippine formatting", () => {
  it("formats whole pesos without decimal noise", () => {
    expect(formatPeso(21800000)).toBe("₱21,800,000");
  });

  it("formats dates in the Manila timezone", () => {
    expect(formatManilaDate("2026-08-01T16:30:00.000Z")).toBe("Aug 2, 2026");
  });
});
```

- [ ] **Step 2: Run the formatting tests and confirm RED**

Run: `pnpm test tests/unit/formatting/philippines.test.ts`

Expected: FAIL because `@/lib/formatting/philippines` does not exist.

- [ ] **Step 3: Implement the formatting functions**

```ts
const peso = new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  maximumFractionDigits: 0,
});

const manilaDate = new Intl.DateTimeFormat("en-PH", {
  timeZone: "Asia/Manila",
  month: "short",
  day: "numeric",
  year: "numeric",
});

export const formatPeso = (value: number) => peso.format(value);
export const formatManilaDate = (value: Date | string) =>
  manilaDate.format(typeof value === "string" ? new Date(value) : value);
```

- [ ] **Step 4: Write failing shared-validation tests**

```ts
import { describe, expect, it } from "vitest";
import { organizationSlug, positiveMoney, requiredText } from "@/lib/validation/shared";

describe("shared validation", () => {
  it("trims required text", () => expect(requiredText.parse("  Apex  ")).toBe("Apex"));
  it("rejects negative money", () => expect(positiveMoney.safeParse(-1).success).toBe(false));
  it("accepts a lowercase organization slug", () => expect(organizationSlug.parse("apex-autohaus")).toBe("apex-autohaus"));
});
```

- [ ] **Step 5: Run validation tests, implement the schemas, and verify GREEN**

```ts
import { z } from "zod";

export const requiredText = z.string().trim().min(1, "This field is required");
export const positiveMoney = z.number().finite().nonnegative();
export const organizationSlug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
```

Run: `pnpm test tests/unit/formatting/philippines.test.ts tests/unit/validation/shared.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit shared contracts**

```powershell
git add tests/setup.ts tests/unit src/lib/formatting src/lib/validation
git commit -m "feat: add shared locale and validation contracts"
```

### Task 3: Initialize shadcn/ui and extract the approved design system

**Files:**
- Create: `components.json`
- Modify: `src/app/globals.css`
- Create via shadcn CLI: `src/components/ui/*`
- Create: `src/components/theme-provider.tsx`

**Interfaces:**
- Consumes: Task 1 App Router root and the approved dashboard image.
- Produces: semantic design tokens and installed `button`, `card`, `badge`, `avatar`, `breadcrumb`, `dropdown-menu`, `sheet`, `sidebar`, `skeleton`, `alert`, `separator`, `table`, `select`, `input`, `field`, `dialog`, `alert-dialog`, `tabs`, `chart`, and `sonner` components.

- [ ] **Step 1: Inspect current shadcn project context and component documentation**

Run:

```powershell
pnpm dlx shadcn@latest info --json
pnpm dlx shadcn@latest docs button card sidebar sheet breadcrumb dropdown-menu chart table field dialog sonner
```

Expected: project information or a clear not-initialized response, plus official documentation URLs for every planned component.

- [ ] **Step 2: Initialize shadcn/ui and add the approved component set**

Run:

```powershell
pnpm dlx shadcn@latest init --defaults
pnpm dlx shadcn@latest add button card badge avatar breadcrumb dropdown-menu sheet sidebar skeleton alert separator table select input field dialog alert-dialog tabs chart sonner
```

Expected: `components.json`, semantic CSS variables, and readable component source files under the alias reported by `shadcn info`.

- [ ] **Step 3: Extract approved visual tokens into the existing global CSS file**

Define light-mode tokens for white canvas, cool-gray surfaces, graphite text/sidebar, restrained amber primary, meaningful destructive/warning/success states, medium radii, and compact typography. Keep shadcn semantic variable names and avoid raw component-level color overrides.

- [ ] **Step 4: Verify installed component composition**

Read every added file and confirm titles exist for overlays, Avatars include fallbacks at usage sites, icons inherit component sizing, and no third-party imports use an incorrect alias.

- [ ] **Step 5: Run static checks and commit**

Run each command separately:

```powershell
pnpm lint
pnpm typecheck
pnpm build
```

Expected: all commands exit 0.

```powershell
git add components.json src/app/globals.css src/components
git commit -m "feat: establish dealership design system"
```

### Task 4: Create Supabase clients and environment validation

**Files:**
- Create: `.env.example`
- Create locally only: `.env.local`
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/middleware.ts`
- Create: `src/lib/supabase/types.ts`
- Create: `tests/unit/supabase/environment.test.ts`
- Create: `src/lib/env.ts`

**Interfaces:**
- Consumes: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Produces: `createBrowserSupabaseClient()`, asynchronous `createServerSupabaseClient()`, `updateSession(request)`, and validated `publicEnv`.

- [ ] **Step 1: Write the failing environment tests**

```ts
import { describe, expect, it } from "vitest";
import { parsePublicEnv } from "@/lib/env";

describe("public Supabase environment", () => {
  it("accepts a project URL and publishable key", () => {
    expect(parsePublicEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
    })).toEqual({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example",
    });
  });

  it("rejects a missing publishable key", () => {
    expect(() => parsePublicEnv({ NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co" })).toThrow();
  });
});
```

- [ ] **Step 2: Run the test and confirm RED**

Run: `pnpm test tests/unit/supabase/environment.test.ts`

Expected: FAIL because `parsePublicEnv` does not exist.

- [ ] **Step 3: Implement environment parsing and Supabase clients using current official SSR docs**

```ts
// src/lib/env.ts
import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

export const parsePublicEnv = (env: Record<string, string | undefined>) => publicEnvSchema.parse(env);
export const publicEnv = parsePublicEnv(process.env);
```

Implement browser and server clients with `createBrowserClient` and `createServerClient` from `@supabase/ssr`, using Next.js cookies in the server client and request/response cookies in `updateSession`.

- [ ] **Step 4: Add safe environment files**

```dotenv
# .env.example
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

Place the supplied project URL and publishable key in `.env.local`; confirm `.gitignore` excludes it with `git check-ignore .env.local`.

- [ ] **Step 5: Generate the initial database type file after schema deployment becomes available**

Run `supabase gen types typescript --project-id yukdgdvremgwkcomvrsf --schema public`, capture the generated output, and place that exact output in `src/lib/supabase/types.ts` with `apply_patch`.

Expected: generated types contain the Phase 1 public tables. Before remote deployment, use an explicit empty `Database` interface so application compilation remains type-safe and replace it immediately after deployment.

- [ ] **Step 6: Verify and commit**

Run each command separately:

```powershell
pnpm test tests/unit/supabase/environment.test.ts
pnpm lint
pnpm typecheck
```

Expected: all commands pass and `.env.local` remains untracked.

```powershell
git add .env.example src/lib/env.ts src/lib/supabase tests/unit/supabase/environment.test.ts
git commit -m "feat: configure Supabase SSR clients"
```

### Task 5: Build the Phase 1 database schema, RLS, and SQL security tests

**Files:**
- Create via CLI: migration returned by `supabase migration new phase_1_foundation`
- Create: `supabase/tests/phase_1_rls.sql`
- Create: `docs/architecture/database-schema.md`

**Interfaces:**
- Consumes: Supabase Auth `auth.users` and authenticated JWT user IDs.
- Produces: organizations, modules, organization_modules, profiles, roles, permissions, role_permissions, organization_memberships, branches, membership_branches, vehicles, dashboard_snapshots, notifications, audit_logs, helper functions, grants, indexes, and RLS policies.

- [ ] **Step 1: Check CLI capabilities and create the migration through the CLI**

Run:

```powershell
supabase --version
supabase --help
supabase migration --help
supabase migration new phase_1_foundation
```

Expected: the CLI prints the generated migration path; edit exactly that file.

- [ ] **Step 2: Write failing SQL assertions before the schema**

Add pgTAP assertions that expect the tables and RLS state:

```sql
begin;
select plan(9);
select has_table('public', 'organizations');
select has_table('public', 'organization_memberships');
select has_table('public', 'roles');
select has_table('public', 'branches');
select has_table('public', 'vehicles');
select has_table('public', 'dashboard_snapshots');
select has_table('public', 'notifications');
select has_table('public', 'audit_logs');
select isnt_empty(
  $$select 1 from pg_class where relname = 'organizations' and relrowsecurity$$,
  'organizations has RLS enabled'
);
select * from finish();
rollback;
```

- [ ] **Step 3: Run SQL tests and confirm RED**

Run each command separately:

```powershell
supabase db start
supabase test db supabase/tests/phase_1_rls.sql
```

Expected: FAIL because the Phase 1 tables do not exist.

- [ ] **Step 4: Implement schema types and tables**

Use UUID primary keys, `organization_id` foreign keys on business tables, tenant-aware unique constraints, nonnegative monetary checks, explicit timestamps, and these stable enums:

```sql
create type public.module_key as enum ('dealership', 'fleet_management', 'vehicle_rental');
create type public.membership_status as enum ('invited', 'active', 'suspended', 'inactive');
create type public.organization_scope as enum ('organization', 'assigned_branches');
create type public.vehicle_workflow_status as enum (
  'acquired', 'for_inspection', 'for_repair_or_preparation', 'ready_for_listing',
  'available', 'reserved', 'sold', 'released', 'withdrawn',
  'returned_to_supplier', 'written_off', 'archived'
);
```

Create unique constraints on organization slug, `(organization_id, module_id)`, `(organization_id, user_id)`, `(organization_id, code)` for roles and branches, and `(organization_id, stock_number)` for vehicles.

Create `dashboard_snapshots` with organization, optional branch, metric key, period start/end, JSON payload, and generated timestamp. It is a temporary read-model boundary for Phase 1 sales series, upcoming test-drive previews, and receivables summaries before the source workflow tables arrive. Later phases replace snapshot producers with live aggregates without changing dashboard component contracts.

- [ ] **Step 5: Implement authorization helpers and RLS policies**

Create `private.is_active_member(target_organization_id uuid)`, `private.has_permission(target_organization_id uuid, permission_key text)`, and `private.can_access_branch(target_organization_id uuid, target_branch_id uuid)`. Each function validates `(select auth.uid())`, has a fixed `search_path`, lives outside the exposed schema, and has explicit execution grants only to `authenticated`.

Every policy uses `to authenticated`. Update policies use both `using` and `with check`. Owner-level mutation policies require stable permissions; branch data policies require active membership plus `private.can_access_branch`.

- [ ] **Step 6: Add RLS behavior tests**

Extend `phase_1_rls.sql` with fixture UUIDs and `set local role authenticated` plus JWT claims to prove:

```sql
select set_config('request.jwt.claims', json_build_object('sub', :'owner_user_id', 'role', 'authenticated')::text, true);
select results_eq(
  $$select slug from public.organizations order by slug$$,
  $$values ('apex-autohaus'::text)$$,
  'owner sees only the active organization'
);
```

Add equivalent assertions for a different organization, inactive membership, branch-scoped membership, Viewer mutation denial, and sensitive finance access denial.

- [ ] **Step 7: Run tests and database advisors**

Run:

```powershell
supabase db reset
supabase test db supabase/tests/phase_1_rls.sql
supabase db advisors
```

Expected: all pgTAP assertions pass; advisors report no unresolved security or performance findings introduced by the migration.

- [ ] **Step 8: Document and commit the database contract**

Document entity purpose, keys, tenant ownership, branch ownership, RLS policy intent, storage path format, and future Fleet/Rental extension points in `docs/architecture/database-schema.md`.

```powershell
git add supabase/migrations supabase/tests docs/architecture/database-schema.md
git commit -m "feat: add tenant-secure phase 1 schema"
```

### Task 6: Seed Apex Autohaus, roles, permissions, and demo identities

**Files:**
- Create: `supabase/seed.sql`
- Create: `scripts/create-demo-users.mjs`
- Create: `docs/architecture/role-permission-matrix.md`
- Test: `supabase/tests/phase_1_seed.sql`

**Interfaces:**
- Consumes: Task 5 schema and secure server-only administrative credentials when creating remote Auth users.
- Produces: one organization, one branch, three module records, five default roles, permission mappings, demo memberships, minimal dashboard vehicles, notifications, and audit entries.

- [ ] **Step 1: Write failing seed assertions**

```sql
begin;
select plan(5);
select results_eq($$select count(*)::int from public.organizations where slug = 'apex-autohaus'$$, array[1]);
select results_eq($$select count(*)::int from public.branches where code = 'QC-MAIN'$$, array[1]);
select results_eq($$select count(*)::int from public.roles where is_system = true$$, array[5]);
select results_eq($$select count(*)::int from public.organization_modules om join public.modules m on m.id = om.module_id where om.enabled and m.key = 'dealership'$$, array[1]);
select results_eq($$select count(*)::int from public.organization_modules om join public.modules m on m.id = om.module_id where om.enabled and m.key in ('fleet_management', 'vehicle_rental')$$, array[0]);
select * from finish();
rollback;
```

- [ ] **Step 2: Run the seed test and confirm RED**

Run each command separately:

```powershell
supabase db reset
supabase test db supabase/tests/phase_1_seed.sql
```

Expected: FAIL because seed rows are absent.

- [ ] **Step 3: Add idempotent fictional Philippine seed data**

Seed `Apex Autohaus`, `Quezon City Main`, module settings, permission catalog, Owner, Branch Manager, Sales Agent, Inventory Staff, Viewer roles, 25 minimal vehicle rows across workflow statuses, dashboard snapshot payloads, dashboard notifications, and audit entries. Use deterministic UUIDs and `insert ... on conflict ... do update` so reset and reseed are repeatable.

- [ ] **Step 4: Create the secure Auth user script**

The script reads `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` only from the server process, calls `supabase.auth.admin.createUser`, sets `email_confirm: true`, and upserts matching profiles and memberships. It prints demo email addresses but never prints passwords or keys. The service key is used only for local/administrative seeding and never imported by `src/`.

- [ ] **Step 5: Verify seed behavior and document the role matrix**

Run each command separately:

```powershell
supabase db reset
supabase test db supabase/tests/phase_1_seed.sql supabase/tests/phase_1_rls.sql
```

Expected: all seed and RLS tests pass.

- [ ] **Step 6: Commit**

```powershell
git add supabase/seed.sql supabase/tests/phase_1_seed.sql scripts/create-demo-users.mjs docs/architecture/role-permission-matrix.md
git commit -m "feat: seed Apex Autohaus demo tenancy"
```

### Task 7: Implement permission resolution and role-aware navigation with TDD

**Files:**
- Create: `src/features/permissions/types.ts`
- Create: `src/features/permissions/permissions.ts`
- Create: `src/features/permissions/navigation.ts`
- Create: `tests/unit/permissions/permissions.test.ts`
- Create: `tests/unit/permissions/navigation.test.ts`

**Interfaces:**
- Consumes: membership role, permissions, organization scope, assigned branch IDs, and enabled module keys.
- Produces: `PermissionKey`, `OrganizationAccessContext`, `hasPermission(context, key)`, `canAccessBranch(context, branchId)`, and `getVisibleNavigation(context)`.

- [ ] **Step 1: Write failing permission tests**

```ts
import { describe, expect, it } from "vitest";
import { canAccessBranch, hasPermission } from "@/features/permissions/permissions";
import type { OrganizationAccessContext } from "@/features/permissions/types";

const owner: OrganizationAccessContext = {
  organizationId: "org-1",
  userId: "user-1",
  scope: "organization",
  branchIds: [],
  permissions: ["settings.manage", "financials.view_sensitive", "vehicles.read"],
  enabledModules: ["dealership"],
};

describe("permission resolution", () => {
  it("allows an explicit permission", () => expect(hasPermission(owner, "settings.manage")).toBe(true));
  it("denies an absent permission", () => expect(hasPermission(owner, "users.manage")).toBe(false));
  it("allows organization scope across branches", () => expect(canAccessBranch(owner, "branch-2")).toBe(true));
});
```

- [ ] **Step 2: Write failing navigation tests**

```ts
import { expect, it } from "vitest";
import { getVisibleNavigation } from "@/features/permissions/navigation";

it("never shows disabled Fleet or Rental navigation", () => {
  const labels = getVisibleNavigation({
    organizationId: "org-1", userId: "user-1", scope: "organization", branchIds: [],
    permissions: ["settings.manage", "vehicles.read"], enabledModules: ["dealership"],
  }).map((item) => item.label);
  expect(labels).not.toContain("Fleet Management");
  expect(labels).not.toContain("Vehicle Rental");
});
```

- [ ] **Step 3: Run tests and confirm RED**

Run: `pnpm test tests/unit/permissions`

Expected: FAIL because permission modules do not exist.

- [ ] **Step 4: Implement exact permission and navigation contracts**

```ts
export const permissionKeys = [
  "settings.manage",
  "users.manage",
  "modules.manage",
  "financials.view_sensitive",
  "vehicles.read",
  "vehicles.manage",
  "reports.read",
  "audit_logs.read",
] as const;

export type PermissionKey = (typeof permissionKeys)[number];
export type ModuleKey = "dealership" | "fleet_management" | "vehicle_rental";

export type OrganizationAccessContext = {
  organizationId: string;
  userId: string;
  scope: "organization" | "assigned_branches";
  branchIds: string[];
  permissions: PermissionKey[];
  enabledModules: ModuleKey[];
};
```

Use a readonly navigation registry whose entries declare required permission and module. Filter entries through both conditions. `canAccessBranch` returns true for organization scope and otherwise requires membership in `branchIds`.

- [ ] **Step 5: Verify GREEN and commit**

Run each command separately:

```powershell
pnpm test tests/unit/permissions
pnpm lint
pnpm typecheck
```

Expected: PASS.

```powershell
git add src/features/permissions tests/unit/permissions
git commit -m "feat: add role and navigation policy"
```

### Task 8: Implement authentication and protected organization context

**Files:**
- Create: `src/features/auth/schemas.ts`
- Create: `src/features/auth/actions.ts`
- Create: `src/features/auth/get-access-context.ts`
- Create: `src/features/auth/sign-in-form.tsx`
- Create: `src/app/(auth)/sign-in/page.tsx`
- Create: `src/app/(auth)/layout.tsx`
- Create: `src/app/auth/callback/route.ts`
- Create: `src/app/(app)/layout.tsx`
- Create: `src/app/(app)/unauthorized/page.tsx`
- Create: `src/proxy.ts`
- Create: `tests/unit/auth/sign-in-schema.test.ts`
- Create: `tests/e2e/auth.spec.ts`

**Interfaces:**
- Consumes: Task 4 Supabase clients and Task 7 `OrganizationAccessContext`.
- Produces: `signInAction`, `signOutAction`, `getRequiredAccessContext()`, protected `(app)` routes, and safe redirect behavior.

- [ ] **Step 1: Write failing sign-in validation tests**

```ts
import { expect, it } from "vitest";
import { signInSchema } from "@/features/auth/schemas";

it("rejects malformed sign-in data", () => {
  const result = signInSchema.safeParse({ email: "not-email", password: "" });
  expect(result.success).toBe(false);
});
```

- [ ] **Step 2: Run the unit test and confirm RED**

Run: `pnpm test tests/unit/auth/sign-in-schema.test.ts`

Expected: FAIL because the schema does not exist.

- [ ] **Step 3: Implement validation and typed actions**

```ts
import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});
```

`signInAction` validates, calls `signInWithPassword`, returns a generic invalid-credentials message, and redirects only to an allowlisted internal path. `signOutAction` signs out and redirects to `/sign-in`.

- [ ] **Step 4: Implement access-context loading and route protection**

`getRequiredAccessContext()` gets the authenticated user, queries one active membership with its role permissions and branches, and returns the Task 7 context. No user or membership redirects to the correct sign-in or unauthorized route. `src/proxy.ts` refreshes SSR cookies and excludes static assets.

- [ ] **Step 5: Implement the accessible sign-in page**

Use shadcn Field composition, labeled email/password inputs, a submit button with Spinner while pending, generic errors, Apex Autohaus branding, and a compact demo-account reference panel sourced from README-safe fixture data.

- [ ] **Step 6: Write and run E2E auth tests**

```ts
import { expect, test } from "@playwright/test";

test("redirects an unauthenticated visitor from the dashboard", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/sign-in/);
});
```

Run each command separately:

```powershell
pnpm test
pnpm test:e2e --project=chromium tests/e2e/auth.spec.ts
```

Expected: unit and browser tests pass against the configured Supabase environment.

- [ ] **Step 7: Commit**

```powershell
git add src/features/auth src/app src/proxy.ts tests/unit/auth tests/e2e/auth.spec.ts
git commit -m "feat: add Supabase authentication"
```

### Task 9: Build the responsive application shell faithfully

**Files:**
- Create: `src/components/app-shell/app-sidebar.tsx`
- Create: `src/components/app-shell/app-header.tsx`
- Create: `src/components/app-shell/mobile-navigation.tsx`
- Create: `src/components/app-shell/user-menu.tsx`
- Create: `src/components/app-shell/organization-provider.tsx`
- Modify: `src/app/(app)/layout.tsx`
- Create: `src/app/(app)/loading.tsx`
- Create: `tests/unit/app-shell/sidebar.test.tsx`

**Interfaces:**
- Consumes: `OrganizationAccessContext`, `getVisibleNavigation`, profile, organization, and branch data.
- Produces: responsive desktop sidebar, mobile Sheet navigation, header, breadcrumb area, branch selector, notifications entry, and user menu.

- [ ] **Step 1: Write the failing sidebar behavior test**

```tsx
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { AppSidebar } from "@/components/app-shell/app-sidebar";

it("renders permitted Dealership navigation without disabled modules", () => {
  render(<AppSidebar items={[{ label: "Dashboard", href: "/dashboard", icon: () => null }]} />);
  expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
  expect(screen.queryByText("Fleet Management")).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test and confirm RED**

Run: `pnpm test tests/unit/app-shell/sidebar.test.tsx`

Expected: FAIL because `AppSidebar` does not exist.

- [ ] **Step 3: Implement shell components from the approved concept**

Use the shadcn Sidebar and Sheet components, graphite semantic sidebar tokens, amber active state, exact navigation labels, Avatar fallback, Breadcrumb, SelectGroup/SelectItem composition, and icons from Lucide passed as icon objects. Keep desktop density and collapse behavior faithful to the concept.

- [ ] **Step 4: Add responsive and loading states**

Desktop uses the fixed collapsible sidebar; tablet and mobile use a keyboard-accessible Sheet. The loading route renders Skeletons matching header and dashboard geometry without custom animation markup.

- [ ] **Step 5: Verify component tests and static checks**

Run each command separately:

```powershell
pnpm test tests/unit/app-shell
pnpm lint
pnpm typecheck
pnpm build
```

Expected: all commands pass.

- [ ] **Step 6: Commit**

```powershell
git add src/components/app-shell src/app/\(app\)
git commit -m "feat: add responsive dealership shell"
```

### Task 10: Implement the role-sensitive dashboard vertical slice

**Files:**
- Create: `src/features/dashboard/types.ts`
- Create: `src/features/dashboard/queries.ts`
- Create: `src/features/dashboard/dashboard-view.tsx`
- Create: `src/features/dashboard/summary-band.tsx`
- Create: `src/features/dashboard/inventory-pipeline.tsx`
- Create: `src/features/dashboard/sales-chart.tsx`
- Create: `src/features/dashboard/priority-alerts.tsx`
- Create: `src/features/dashboard/upcoming-test-drives.tsx`
- Create: `src/features/dashboard/oldest-vehicles.tsx`
- Create: `src/features/dashboard/financial-summary.tsx`
- Create: `src/app/(app)/dashboard/page.tsx`
- Create: `src/app/(app)/dashboard/error.tsx`
- Create: `tests/unit/dashboard/dashboard-visibility.test.tsx`
- Create: `tests/fixtures/dashboard.ts`

**Interfaces:**
- Consumes: server Supabase client and `OrganizationAccessContext`.
- Produces: `getDashboardData(context): Promise<DashboardData>` with `financialSummary: FinancialSummary | null`, plus the approved dashboard screen.

- [ ] **Step 1: Write the failing financial-visibility test**

```tsx
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { DashboardView } from "@/features/dashboard/dashboard-view";
import { dashboardFixture } from "../../fixtures/dashboard";

it("does not render sensitive finance labels when data is absent", () => {
  render(<DashboardView data={{ ...dashboardFixture, financialSummary: null }} />);
  expect(screen.queryByText("Invested inventory")).not.toBeInTheDocument();
  expect(screen.queryByText("Expected profit")).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run the test and confirm RED**

Run: `pnpm test tests/unit/dashboard/dashboard-visibility.test.tsx`

Expected: FAIL because dashboard components and fixture do not exist.

- [ ] **Step 3: Implement the server query contract**

```ts
export type DashboardData = {
  summary: { total: number; available: number; reserved: number; soldThisMonth: number };
  pipeline: Array<{ status: string; label: string; count: number }>;
  sales: Array<{ month: string; sold: number; grossProfit: number }>;
  alerts: Array<{ id: string; label: string; detail: string; priority: "low" | "normal" | "high" | "urgent" }>;
  upcomingTestDrives: Array<{ id: string; scheduledAt: string; customer: string; vehicle: string; agent: string; status: string }>;
  oldestVehicles: Array<{ id: string; stockNumber: string; vehicle: string; ageDays: number; listedPrice: number; imageUrl: string | null }>;
  financialSummary: null | { investedInventory: number; expectedProfit: number; receivables: number; estimatedMargin: number };
};

export async function getDashboardData(context: OrganizationAccessContext): Promise<DashboardData>;
```

Query organization- and branch-scoped vehicle counts and lists, notification alerts, and Phase 1 `dashboard_snapshots` for sales, upcoming test drives, and receivables. Only query acquisition value, invested value, expected profit, and receivables when `hasPermission(context, "financials.view_sensitive")` is true. Return `financialSummary: null` otherwise so sensitive values never enter unauthorized payloads.

- [ ] **Step 4: Implement the approved dashboard composition**

Match the concept: modest greeting, period control, four-part summary band, asymmetric pipeline/chart/alert composition, test-drive table, oldest-vehicle list, and narrow financial rail. Use shadcn Card composition, Chart wrapper around Recharts, semantic badges, and responsive cards for mobile table content.

- [ ] **Step 5: Add error, loading, and empty states**

The error boundary provides a retry button. Empty data renders shadcn Empty with operational copy. Alerts include icon, label, count, and time information so meaning is not color-only.

- [ ] **Step 6: Verify unit behavior and build**

Run each command separately:

```powershell
pnpm test tests/unit/dashboard
pnpm lint
pnpm typecheck
pnpm build
```

Expected: all commands pass.

- [ ] **Step 7: Commit**

```powershell
git add src/features/dashboard src/app/\(app\)/dashboard tests/unit/dashboard tests/fixtures/dashboard.ts
git commit -m "feat: add role-sensitive dealership dashboard"
```

### Task 11: Implement company and module settings

**Files:**
- Create: `src/features/settings/company-schema.ts`
- Create: `src/features/settings/company-actions.ts`
- Create: `src/features/settings/company-form.tsx`
- Create: `src/features/settings/module-actions.ts`
- Create: `src/features/settings/module-settings.tsx`
- Create: `src/app/(app)/settings/company/page.tsx`
- Create: `src/app/(app)/settings/modules/page.tsx`
- Create: `tests/unit/settings/company-schema.test.ts`
- Create: `tests/unit/settings/module-settings.test.tsx`

**Interfaces:**
- Consumes: `settings.manage` permission, Supabase server client, and organization/module tables.
- Produces: validated company update action and Owner-only module settings display.

- [ ] **Step 1: Write failing company-schema tests**

```ts
import { expect, it } from "vitest";
import { companySettingsSchema } from "@/features/settings/company-schema";

it("requires a Philippine company name and valid contact email", () => {
  const result = companySettingsSchema.safeParse({ name: "", email: "bad", timezone: "Asia/Manila", currency: "PHP" });
  expect(result.success).toBe(false);
});
```

- [ ] **Step 2: Write failing module-display tests**

```tsx
import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { ModuleSettings } from "@/features/settings/module-settings";

it("shows Fleet and Rental as disabled upgrades", () => {
  render(<ModuleSettings modules={[
    { key: "dealership", name: "Dealership", enabled: true },
    { key: "fleet_management", name: "Fleet Management", enabled: false },
    { key: "vehicle_rental", name: "Vehicle Rental", enabled: false },
  ]} />);
  expect(screen.getByText("Fleet Management")).toBeInTheDocument();
  expect(screen.getAllByText("Available upgrade")).toHaveLength(2);
});
```

- [ ] **Step 3: Run tests and confirm RED**

Run: `pnpm test tests/unit/settings`

Expected: FAIL because settings modules do not exist.

- [ ] **Step 4: Implement forms and server actions**

Use React Hook Form with Zod, FieldGroup/Field composition, explicit required indicators, accessible errors, pending Spinner, and Sonner success feedback. Server Actions require `settings.manage`, update only the active organization, and append audit logs with before/after values.

- [ ] **Step 5: Keep future modules noninteractive in the MVP**

Dealership displays Enabled. Fleet Management and Vehicle Rental display Available upgrade with explanatory text and no activation control, because billing and upgrade fulfillment are excluded from the MVP.

- [ ] **Step 6: Verify and commit**

Run each command separately:

```powershell
pnpm test tests/unit/settings
pnpm lint
pnpm typecheck
pnpm build
```

Expected: all commands pass.

```powershell
git add src/features/settings src/app/\(app\)/settings tests/unit/settings
git commit -m "feat: add company and module settings"
```

### Task 12: Implement Owner user management and branch assignments

**Files:**
- Create: `src/features/settings/users/user-schema.ts`
- Create: `src/features/settings/users/user-actions.ts`
- Create: `src/features/settings/users/user-table.tsx`
- Create: `src/features/settings/users/invite-user-dialog.tsx`
- Create: `src/app/(app)/settings/users/page.tsx`
- Create: `tests/unit/settings/users/user-schema.test.ts`
- Create: `tests/unit/settings/users/user-table.test.tsx`
- Create: `tests/e2e/role-access.spec.ts`

**Interfaces:**
- Consumes: `users.manage`, role and branch records, membership schema, and a secure server-side invitation endpoint.
- Produces: organization membership list, validated invitation request, activation/suspension controls, role assignment, and branch assignment.

- [ ] **Step 1: Write failing user validation and read-only behavior tests**

```ts
import { expect, it } from "vitest";
import { inviteUserSchema } from "@/features/settings/users/user-schema";

it("requires branch assignments for branch-scoped roles", () => {
  const result = inviteUserSchema.safeParse({
    email: "agent@apexautohaus.demo",
    fullName: "Paolo Reyes",
    roleId: "sales-agent",
    scope: "assigned_branches",
    branchIds: [],
  });
  expect(result.success).toBe(false);
});
```

- [ ] **Step 2: Run tests and confirm RED**

Run: `pnpm test tests/unit/settings/users`

Expected: FAIL because user-management modules do not exist.

- [ ] **Step 3: Implement Owner-only user management**

Render a TanStack Table with name, email, role, scope, branches, status, and actions. The invite dialog uses accessible DialogTitle and FieldGroup. Server actions require `users.manage`, validate organization-local role/branch IDs, mutate membership records, and append audit entries. Remote Auth invitations use a server-only administrative path; absence of the required server credential produces a clear setup error without exposing secrets.

- [ ] **Step 4: Add role-access E2E coverage**

Cover Owner settings access, Sales Agent denial of financial and settings surfaces, and Viewer read-only navigation. Use project-specific authenticated storage states created by a setup test from documented demo credentials.

- [ ] **Step 5: Verify and commit**

Run each command separately:

```powershell
pnpm test
pnpm test:e2e --project=chromium tests/e2e/role-access.spec.ts
pnpm lint
pnpm typecheck
pnpm build
```

Expected: all commands pass.

```powershell
git add src/features/settings/users src/app/\(app\)/settings/users tests/unit/settings/users tests/e2e/role-access.spec.ts
git commit -m "feat: add Owner user management"
```

### Task 13: Complete documentation, responsive QA, and Phase 1 verification

**Files:**
- Create: `README.md`
- Create: `docs/architecture/security.md`
- Create: `docs/architecture/core-workflow.md`
- Modify: `docs/architecture/database-schema.md`
- Modify: `docs/architecture/role-permission-matrix.md`
- Create: `tests/e2e/dashboard.spec.ts`
- Create: `tests/e2e/settings.spec.ts`

**Interfaces:**
- Consumes: every Phase 1 deliverable and the approved visual concept.
- Produces: reproducible setup documentation, verified critical flows, and a clean Phase 1 handoff.

- [ ] **Step 1: Add end-to-end dashboard and settings assertions**

```ts
import { expect, test } from "@playwright/test";

test("Owner sees dashboard financial summary", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: /Good morning/ })).toBeVisible();
  await expect(page.getByText("Invested inventory")).toBeVisible();
});

test("disabled future modules stay inside Owner settings", async ({ page }) => {
  await page.goto("/settings/modules");
  await expect(page.getByText("Fleet Management")).toBeVisible();
  await expect(page.getByRole("link", { name: "Fleet Management" })).toHaveCount(0);
});
```

- [ ] **Step 2: Run the E2E tests and confirm any missing behavior fails before fixing it**

Run: `pnpm test:e2e --project=chromium tests/e2e/dashboard.spec.ts tests/e2e/settings.spec.ts`

Expected: each newly exposed omission fails for the intended assertion; implement only the missing behavior, then rerun until PASS.

- [ ] **Step 3: Write complete setup and architecture documentation**

README sections: product overview, stack, prerequisites, local setup, environment variables, Supabase linking and migration process, storage setup, seed process, demo accounts, tests, development server, production build, Vercel deployment, security considerations, MVP limitations, and Fleet/Rental extension roadmap.

Security documentation: RLS model, active-membership checks, branch scoping, sensitive-column separation, storage paths, service-key handling, SSR session behavior, and audit strategy.

- [ ] **Step 4: Run complete automated verification**

```powershell
pnpm lint
pnpm typecheck
pnpm test
supabase test db
pnpm test:e2e
pnpm build
```

Expected: every command exits 0 with no actionable warning.

- [ ] **Step 5: Perform Browser/IAB verification**

Run the application and verify sign-in, dashboard, branch selector, responsive navigation, company settings, module settings, user management, sign-out, Sales Agent restrictions, and Viewer read-only behavior in the in-app browser at desktop and Pixel 7 mobile sizes.

- [ ] **Step 6: Capture and compare screenshots**

Capture the implemented dashboard at the approved concept's native 1440×1024 dimensions when possible. Use `view_image` on both the approved concept and implementation screenshot. Record at least five comparison points: information hierarchy, sidebar geometry, summary band, chart/alert composition, typography, color tokens, density, and responsive behavior. Fix all agency-signoff mismatches.

- [ ] **Step 7: Run the above-the-fold copy and accessibility audit**

Confirm exact approved navigation labels, greeting, period control, metric labels, and priority-alert labels. Verify keyboard focus, dialog titles, field labels, contrast, status text, table/card alternatives, and reduced-motion behavior.

- [ ] **Step 8: Commit Phase 1 completion**

```powershell
git add README.md docs tests/e2e
git commit -m "docs: complete phase 1 handoff"
```

## Phase Completion Report

After Task 13, report:

- Phase 1 features completed.
- Exact files created or changed, grouped by application, database, tests, and documentation.
- Results of lint, type checking, unit tests, SQL tests, E2E tests, and production build.
- Browser viewports and core flows verified.
- Approved concept path, implementation screenshot path, comparison ledger, copy-diff result, and remaining intentional deviations.
- Remote Supabase limitations if database credentials or administrative seeding access remain unavailable.
- Phase 2 boundary: complete vehicle inventory, workflow, inspections, preparation tasks, media, and documents.
