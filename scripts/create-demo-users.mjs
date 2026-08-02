import { createHmac, timingSafeEqual } from "node:crypto";
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";

const REQUIRED_ENVIRONMENT = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "DEMO_USER_PASSWORD",
  "DEMO_IDENTITY_MARKER_SECRET",
];

const ORGANIZATION_SLUG = "apex-autohaus";
const BRANCH_CODE = "QC-MAIN";
const SEED_TIMESTAMP = "2026-08-02T01:00:00.000Z";
const USER_PAGE_SIZE = 200;
const DEMO_IDENTITY_METADATA_KEY = "carsys_demo_identity";
const DEMO_IDENTITY_MARKER_VERSION = 1;
const DEMO_IDENTITY_MARKER_ISSUER = "carsys-demo-bootstrap";
const MINIMUM_MARKER_SECRET_BYTES = 32;

const demoUsers = [
  {
    identityKey: "apex-owner",
    email: "owner@apex-autohaus.example",
    displayName: "Mara Santos",
    roleCode: "owner",
    scope: "organization",
    membershipId: "a7000000-0000-4000-8000-000000000001",
    assignmentId: null,
  },
  {
    identityKey: "apex-branch-manager",
    email: "branch.manager@apex-autohaus.example",
    displayName: "Rafael Dela Cruz",
    roleCode: "branch_manager",
    scope: "assigned_branches",
    membershipId: "a7000000-0000-4000-8000-000000000002",
    assignmentId: "a8000000-0000-4000-8000-000000000002",
  },
  {
    identityKey: "apex-sales-agent",
    email: "sales.agent@apex-autohaus.example",
    displayName: "Bianca Reyes",
    roleCode: "sales_agent",
    scope: "assigned_branches",
    membershipId: "a7000000-0000-4000-8000-000000000003",
    assignmentId: "a8000000-0000-4000-8000-000000000003",
  },
  {
    identityKey: "apex-inventory-staff",
    email: "inventory.staff@apex-autohaus.example",
    displayName: "Noel Bautista",
    roleCode: "inventory_staff",
    scope: "assigned_branches",
    membershipId: "a7000000-0000-4000-8000-000000000004",
    assignmentId: "a8000000-0000-4000-8000-000000000004",
  },
  {
    identityKey: "apex-viewer",
    email: "viewer@apex-autohaus.example",
    displayName: "Ana Lim",
    roleCode: "viewer",
    scope: "assigned_branches",
    membershipId: "a7000000-0000-4000-8000-000000000005",
    assignmentId: "a8000000-0000-4000-8000-000000000005",
  },
];

const notificationSeeds = [
  {
    id: "a9000000-0000-4000-8000-000000000001",
    recipientRoleCode: "owner",
    category: "financial",
    priority: "high",
    title: "Receivables require review",
    body: "Three sold or released demo units have outstanding receivables.",
    stockNumber: "QC-2026-021",
    createdAt: "2026-08-02T01:05:00.000Z",
  },
  {
    id: "a9000000-0000-4000-8000-000000000002",
    recipientRoleCode: "branch_manager",
    category: "inventory",
    priority: "high",
    title: "Reservations need follow-up",
    body: "Three demo vehicles are currently reserved.",
    stockNumber: "QC-2026-014",
    createdAt: "2026-08-02T01:06:00.000Z",
  },
  {
    id: "a9000000-0000-4000-8000-000000000003",
    recipientRoleCode: "sales_agent",
    category: "schedule",
    priority: "normal",
    title: "Upcoming demo test drives",
    body: "Three fictional test-drive appointments are scheduled.",
    stockNumber: "QC-2026-009",
    createdAt: "2026-08-02T01:07:00.000Z",
  },
  {
    id: "a9000000-0000-4000-8000-000000000004",
    recipientRoleCode: "inventory_staff",
    category: "preparation",
    priority: "high",
    title: "Preparation queue updated",
    body: "Two demo vehicles require repair or preparation.",
    stockNumber: "QC-2026-005",
    createdAt: "2026-08-02T01:08:00.000Z",
  },
  {
    id: "a9000000-0000-4000-8000-000000000005",
    recipientRoleCode: "viewer",
    category: "inventory",
    priority: "low",
    title: "Inventory snapshot ready",
    body: "The fictional Apex Autohaus inventory snapshot is available.",
    stockNumber: null,
    createdAt: "2026-08-02T01:09:00.000Z",
  },
];

function validateMarkerSecret(markerSecret) {
  if (
    typeof markerSecret !== "string" ||
    Buffer.byteLength(markerSecret, "utf8") < MINIMUM_MARKER_SECRET_BYTES
  ) {
    throw new Error(
      `DEMO_IDENTITY_MARKER_SECRET must contain at least ${MINIMUM_MARKER_SECRET_BYTES} bytes`,
    );
  }
}

function markerPayload(demoUser) {
  return JSON.stringify([
    DEMO_IDENTITY_MARKER_VERSION,
    DEMO_IDENTITY_MARKER_ISSUER,
    ORGANIZATION_SLUG,
    demoUser.identityKey,
    demoUser.email.toLowerCase(),
    demoUser.roleCode,
  ]);
}

export function createDemoIdentityMarker(demoUser, markerSecret) {
  validateMarkerSecret(markerSecret);

  return {
    version: DEMO_IDENTITY_MARKER_VERSION,
    issuer: DEMO_IDENTITY_MARKER_ISSUER,
    organization_slug: ORGANIZATION_SLUG,
    identity_key: demoUser.identityKey,
    email: demoUser.email.toLowerCase(),
    role_code: demoUser.roleCode,
    signature: createHmac("sha256", markerSecret)
      .update(markerPayload(demoUser), "utf8")
      .digest("base64url"),
  };
}

function signaturesMatch(actualSignature, expectedSignature) {
  if (typeof actualSignature !== "string") {
    return false;
  }

  const actual = Buffer.from(actualSignature, "utf8");
  const expected = Buffer.from(expectedSignature, "utf8");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function isExpectedDemoIdentity(authUser, demoUser, markerSecret) {
  const marker = authUser?.app_metadata?.[DEMO_IDENTITY_METADATA_KEY];
  if (!marker || typeof marker !== "object" || Array.isArray(marker)) {
    return false;
  }

  const expected = createDemoIdentityMarker(demoUser, markerSecret);
  return (
    marker.version === expected.version &&
    marker.issuer === expected.issuer &&
    marker.organization_slug === expected.organization_slug &&
    marker.identity_key === expected.identity_key &&
    marker.email === expected.email &&
    marker.role_code === expected.role_code &&
    signaturesMatch(marker.signature, expected.signature)
  );
}

export function mergeDemoUserMetadata(existingMetadata, displayName) {
  return {
    ...(existingMetadata ?? {}),
    display_name: displayName,
  };
}

function requireEnvironment() {
  const missing = REQUIRED_ENVIRONMENT.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  return {
    supabaseUrl: process.env.SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    demoPassword: process.env.DEMO_USER_PASSWORD,
    markerSecret: process.env.DEMO_IDENTITY_MARKER_SECRET,
  };
}

function assertSucceeded(error, operation) {
  if (!error) {
    return;
  }

  const code = typeof error.code === "string" ? ` (${error.code})` : "";
  throw new Error(`${operation} failed${code}`);
}

async function findAuthUserByEmail(supabase, email) {
  for (let page = 1; ; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: USER_PAGE_SIZE,
    });
    assertSucceeded(error, "Auth user lookup");

    const matchingUser = data.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase(),
    );

    if (matchingUser) {
      return matchingUser;
    }

    if (data.users.length < USER_PAGE_SIZE) {
      return null;
    }
  }
}

async function reconcileAuthUser(supabase, demoUser, password, markerSecret) {
  const existingUser = await findAuthUserByEmail(supabase, demoUser.email);
  const identityMarker = createDemoIdentityMarker(demoUser, markerSecret);

  if (existingUser) {
    if (!isExpectedDemoIdentity(existingUser, demoUser, markerSecret)) {
      throw new Error(
        `Refusing unmarked or mismatched Auth email collision for ${demoUser.email}`,
      );
    }

    const { data, error } = await supabase.auth.admin.updateUserById(
      existingUser.id,
      {
        email_confirm: true,
        user_metadata: mergeDemoUserMetadata(
          existingUser.user_metadata,
          demoUser.displayName,
        ),
        app_metadata: {
          ...existingUser.app_metadata,
          [DEMO_IDENTITY_METADATA_KEY]: identityMarker,
        },
      },
    );
    assertSucceeded(error, `Auth reconciliation for ${demoUser.email}`);
    return { user: data.user, status: "reconciled" };
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: demoUser.email,
    password,
    email_confirm: true,
    user_metadata: { display_name: demoUser.displayName },
    app_metadata: { [DEMO_IDENTITY_METADATA_KEY]: identityMarker },
  });
  assertSucceeded(error, `Auth creation for ${demoUser.email}`);
  return { user: data.user, status: "created" };
}

async function reconcileMembership(
  supabase,
  { organizationId, branchId, roleId, authUserId, demoUser },
) {
  const { data: existingMembership, error: membershipLookupError } =
    await supabase
      .from("organization_memberships")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("user_id", authUserId)
      .maybeSingle();
  assertSucceeded(membershipLookupError, "Membership lookup");

  const membershipId = existingMembership?.id ?? demoUser.membershipId;
  const { error: membershipError } = await supabase
    .from("organization_memberships")
    .upsert(
      {
        id: membershipId,
        organization_id: organizationId,
        user_id: authUserId,
        role_id: roleId,
        status: "active",
        organization_scope: demoUser.scope,
        joined_at: SEED_TIMESTAMP,
        inactivated_at: null,
        created_at: SEED_TIMESTAMP,
        updated_at: SEED_TIMESTAMP,
      },
      { onConflict: "organization_id,user_id" },
    );
  assertSucceeded(membershipError, "Membership upsert");

  const { error: assignmentCleanupError } = await supabase
    .from("membership_branches")
    .delete()
    .eq("organization_id", organizationId)
    .eq("membership_id", membershipId);
  assertSucceeded(assignmentCleanupError, "Branch assignment reconciliation");

  if (demoUser.scope === "assigned_branches") {
    const { error: assignmentError } = await supabase
      .from("membership_branches")
      .upsert(
        {
          id: demoUser.assignmentId,
          organization_id: organizationId,
          membership_id: membershipId,
          branch_id: branchId,
          created_at: SEED_TIMESTAMP,
        },
        { onConflict: "organization_id,membership_id,branch_id" },
      );
    assertSucceeded(assignmentError, "Branch assignment upsert");
  }

  return membershipId;
}

async function main() {
  const { supabaseUrl, serviceRoleKey, demoPassword, markerSecret } =
    requireEnvironment();
  validateMarkerSecret(markerSecret);
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  const { data: organization, error: organizationError } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", ORGANIZATION_SLUG)
    .single();
  assertSucceeded(organizationError, "Apex organization lookup");

  const { data: branch, error: branchError } = await supabase
    .from("branches")
    .select("id")
    .eq("organization_id", organization.id)
    .eq("code", BRANCH_CODE)
    .single();
  assertSucceeded(branchError, "QC-MAIN branch lookup");

  const { data: roles, error: rolesError } = await supabase
    .from("roles")
    .select("id,code")
    .eq("organization_id", organization.id)
    .in(
      "code",
      demoUsers.map((demoUser) => demoUser.roleCode),
    );
  assertSucceeded(rolesError, "System role lookup");

  const roleIds = new Map(roles.map((role) => [role.code, role.id]));
  if (roleIds.size !== demoUsers.length) {
    throw new Error("The five Apex system roles must be seeded before Auth bootstrap");
  }

  const { data: vehicles, error: vehiclesError } = await supabase
    .from("vehicles")
    .select("id,stock_number")
    .eq("organization_id", organization.id)
    .in(
      "stock_number",
      notificationSeeds
        .map((notification) => notification.stockNumber)
        .filter(Boolean),
    );
  assertSucceeded(vehiclesError, "Notification vehicle lookup");
  const vehicleIds = new Map(
    vehicles.map((vehicle) => [vehicle.stock_number, vehicle.id]),
  );

  const reconciledUsers = new Map();

  for (const demoUser of demoUsers) {
    const { user, status } = await reconcileAuthUser(
      supabase,
      demoUser,
      demoPassword,
      markerSecret,
    );

    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        display_name: demoUser.displayName,
        mobile: null,
        avatar_path: null,
        created_at: SEED_TIMESTAMP,
        updated_at: SEED_TIMESTAMP,
      },
      { onConflict: "id" },
    );
    assertSucceeded(profileError, `Profile upsert for ${demoUser.email}`);

    const roleId = roleIds.get(demoUser.roleCode);
    await reconcileMembership(supabase, {
      organizationId: organization.id,
      branchId: branch.id,
      roleId,
      authUserId: user.id,
      demoUser,
    });

    reconciledUsers.set(demoUser.roleCode, user.id);
    console.log(`${status}: ${demoUser.email}`);
  }

  const notifications = notificationSeeds.map((notification) => ({
    id: notification.id,
    organization_id: organization.id,
    recipient_id: reconciledUsers.get(notification.recipientRoleCode),
    category: notification.category,
    priority: notification.priority,
    title: notification.title,
    body: notification.body,
    is_read: false,
    read_at: null,
    related_entity_type: notification.stockNumber ? "vehicle" : "branch",
    related_entity_id: notification.stockNumber
      ? vehicleIds.get(notification.stockNumber)
      : branch.id,
    created_at: notification.createdAt,
  }));

  if (notifications.some((notification) => !notification.related_entity_id)) {
    throw new Error("All notification demo entities must exist before Auth bootstrap");
  }

  const { error: notificationsError } = await supabase
    .from("notifications")
    .upsert(notifications, { onConflict: "id" });
  assertSucceeded(notificationsError, "Notification upsert");

  console.log(`ready: ${demoUsers.length} Apex Autohaus demo identities`);
}

const entryPoint = process.argv[1];
if (entryPoint && import.meta.url === pathToFileURL(entryPoint).href) {
  main().catch((error) => {
    const message =
      error instanceof Error ? error.message : "Unknown bootstrap error";
    console.error(`Demo user bootstrap failed: ${message}`);
    process.exitCode = 1;
  });
}
