/**
 * Manual Phase 1 database boundary.
 *
 * Replace this file with `supabase gen types typescript` output after the
 * reviewed migration is applied to the authorized target project. Until then,
 * these types intentionally mirror the checked-in migration without `any`.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ModuleKey =
  | "dealership"
  | "fleet_management"
  | "vehicle_rental";

export type MembershipStatus =
  | "invited"
  | "active"
  | "suspended"
  | "inactive";

export type OrganizationScope = "organization" | "assigned_branches";

export type VehicleWorkflowStatus =
  | "acquired"
  | "for_inspection"
  | "for_repair_or_preparation"
  | "ready_for_listing"
  | "available"
  | "reserved"
  | "sold"
  | "released"
  | "withdrawn"
  | "returned_to_supplier"
  | "written_off"
  | "archived";

export type NotificationPriority = "low" | "normal" | "high" | "urgent";

type UpdateShape<T> = { [Property in keyof T]?: T[Property] };

type Relationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

type TableDefinition<Row, Insert, Relationships extends Relationship[] = []> = {
  Row: Row;
  Insert: Insert;
  Update: UpdateShape<Insert>;
  Relationships: Relationships;
};

export type OrganizationRow = {
  id: string;
  company_name: string;
  slug: string;
  email: string | null;
  mobile: string | null;
  address: Json;
  currency: string;
  timezone: string;
  is_active: boolean;
  branding: Json;
  created_at: string;
  updated_at: string;
};

export type OrganizationInsert = {
  id?: string;
  company_name: string;
  slug: string;
  email?: string | null;
  mobile?: string | null;
  address?: Json;
  currency?: string;
  timezone?: string;
  is_active?: boolean;
  branding?: Json;
  created_at?: string;
  updated_at?: string;
};

export type ModuleRow = {
  id: string;
  key: ModuleKey;
  display_name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type ModuleInsert = {
  id?: string;
  key: ModuleKey;
  display_name: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type OrganizationModuleRow = {
  id: string;
  organization_id: string;
  module_id: string;
  is_enabled: boolean;
  enabled_at: string | null;
  enabled_by: string | null;
  created_at: string;
  updated_at: string;
};

export type OrganizationModuleInsert = {
  id?: string;
  organization_id: string;
  module_id: string;
  is_enabled?: boolean;
  enabled_at?: string | null;
  enabled_by?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type ProfileRow = {
  id: string;
  display_name: string;
  mobile: string | null;
  avatar_path: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfileInsert = {
  id: string;
  display_name: string;
  mobile?: string | null;
  avatar_path?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type RoleRow = {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  description: string | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
};

export type RoleInsert = {
  id?: string;
  organization_id: string;
  code: string;
  name: string;
  description?: string | null;
  is_system?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type PermissionRow = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type PermissionInsert = {
  id?: string;
  key: string;
  name: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type RolePermissionRow = {
  id: string;
  organization_id: string;
  role_id: string;
  permission_id: string;
  created_at: string;
};

export type RolePermissionInsert = {
  id?: string;
  organization_id: string;
  role_id: string;
  permission_id: string;
  created_at?: string;
};

export type OrganizationMembershipRow = {
  id: string;
  organization_id: string;
  user_id: string;
  role_id: string;
  status: MembershipStatus;
  organization_scope: OrganizationScope;
  joined_at: string | null;
  inactivated_at: string | null;
  created_at: string;
  updated_at: string;
};

export type OrganizationMembershipInsert = {
  id?: string;
  organization_id: string;
  user_id: string;
  role_id: string;
  status?: MembershipStatus;
  organization_scope?: OrganizationScope;
  joined_at?: string | null;
  inactivated_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type BranchRow = {
  id: string;
  organization_id: string;
  code: string;
  name: string;
  address: Json;
  is_primary: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type BranchInsert = {
  id?: string;
  organization_id: string;
  code: string;
  name: string;
  address?: Json;
  is_primary?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
};

export type MembershipBranchRow = {
  id: string;
  organization_id: string;
  membership_id: string;
  branch_id: string;
  created_at: string;
};

export type MembershipBranchInsert = {
  id?: string;
  organization_id: string;
  membership_id: string;
  branch_id: string;
  created_at?: string;
};

export type VehicleRow = {
  id: string;
  organization_id: string;
  branch_id: string;
  stock_number: string;
  model_year: number;
  make: string;
  model: string;
  variant: string | null;
  workflow_status: VehicleWorkflowStatus;
  list_price: number;
  acquired_at: string | null;
  listed_at: string | null;
  released_at: string | null;
  created_at: string;
  updated_at: string;
};

export type VehicleInsert = {
  id?: string;
  organization_id: string;
  branch_id: string;
  stock_number: string;
  model_year: number;
  make: string;
  model: string;
  variant?: string | null;
  workflow_status?: VehicleWorkflowStatus;
  list_price?: number;
  acquired_at?: string | null;
  listed_at?: string | null;
  released_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type VehicleFinancialRow = {
  id: string;
  organization_id: string;
  vehicle_id: string;
  acquisition_value: number;
  total_invested_value: number;
  expected_profit: number;
  receivables: number;
  created_at: string;
  updated_at: string;
};

export type VehicleFinancialInsert = {
  id?: string;
  organization_id: string;
  vehicle_id: string;
  acquisition_value?: number;
  total_invested_value?: number;
  expected_profit?: number;
  receivables?: number;
  created_at?: string;
  updated_at?: string;
};

export type DashboardSnapshotRow = {
  id: string;
  organization_id: string;
  branch_id: string | null;
  metric_key: string;
  period_start: string;
  period_end: string;
  payload: Json;
  is_sensitive: boolean;
  generated_at: string;
  created_at: string;
};

export type DashboardSnapshotInsert = {
  id?: string;
  organization_id: string;
  branch_id?: string | null;
  metric_key: string;
  period_start: string;
  period_end: string;
  payload?: Json;
  is_sensitive?: boolean;
  generated_at?: string;
  created_at?: string;
};

export type NotificationRow = {
  id: string;
  organization_id: string;
  recipient_id: string;
  category: string;
  priority: NotificationPriority;
  title: string;
  body: string;
  is_read: boolean;
  read_at: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  created_at: string;
};

export type NotificationInsert = {
  id?: string;
  organization_id: string;
  recipient_id: string;
  category: string;
  priority?: NotificationPriority;
  title: string;
  body: string;
  is_read?: boolean;
  read_at?: string | null;
  related_entity_type?: string | null;
  related_entity_id?: string | null;
  created_at?: string;
};

export type AuditLogRow = {
  id: string;
  organization_id: string;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  before_data: Json | null;
  after_data: Json | null;
  reason: string | null;
  request_metadata: Json;
  created_at: string;
};

export type AuditLogInsert = {
  id?: string;
  organization_id: string;
  actor_id?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  before_data?: Json | null;
  after_data?: Json | null;
  reason?: string | null;
  request_metadata?: Json;
  created_at?: string;
};

export type Database = {
  public: {
    Tables: {
      organizations: TableDefinition<OrganizationRow, OrganizationInsert>;
      modules: TableDefinition<ModuleRow, ModuleInsert>;
      organization_modules: TableDefinition<
        OrganizationModuleRow,
        OrganizationModuleInsert,
        [
          { foreignKeyName: "organization_modules_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
          { foreignKeyName: "organization_modules_module_id_fkey"; columns: ["module_id"]; isOneToOne: false; referencedRelation: "modules"; referencedColumns: ["id"] },
          { foreignKeyName: "organization_modules_enabled_by_fkey"; columns: ["organization_id", "enabled_by"]; isOneToOne: false; referencedRelation: "organization_memberships"; referencedColumns: ["organization_id", "user_id"] },
        ]
      >;
      profiles: TableDefinition<ProfileRow, ProfileInsert>;
      roles: TableDefinition<
        RoleRow,
        RoleInsert,
        [{ foreignKeyName: "roles_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] }]
      >;
      permissions: TableDefinition<PermissionRow, PermissionInsert>;
      role_permissions: TableDefinition<
        RolePermissionRow,
        RolePermissionInsert,
        [
          { foreignKeyName: "role_permissions_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
          { foreignKeyName: "role_permissions_permission_id_fkey"; columns: ["permission_id"]; isOneToOne: false; referencedRelation: "permissions"; referencedColumns: ["id"] },
          { foreignKeyName: "role_permissions_tenant_role_fkey"; columns: ["organization_id", "role_id"]; isOneToOne: false; referencedRelation: "roles"; referencedColumns: ["organization_id", "id"] },
        ]
      >;
      organization_memberships: TableDefinition<
        OrganizationMembershipRow,
        OrganizationMembershipInsert,
        [
          { foreignKeyName: "organization_memberships_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
          { foreignKeyName: "organization_memberships_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "organization_memberships_tenant_role_fkey"; columns: ["organization_id", "role_id"]; isOneToOne: false; referencedRelation: "roles"; referencedColumns: ["organization_id", "id"] },
        ]
      >;
      branches: TableDefinition<
        BranchRow,
        BranchInsert,
        [{ foreignKeyName: "branches_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] }]
      >;
      membership_branches: TableDefinition<
        MembershipBranchRow,
        MembershipBranchInsert,
        [
          { foreignKeyName: "membership_branches_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
          { foreignKeyName: "membership_branches_tenant_membership_fkey"; columns: ["organization_id", "membership_id"]; isOneToOne: false; referencedRelation: "organization_memberships"; referencedColumns: ["organization_id", "id"] },
          { foreignKeyName: "membership_branches_tenant_branch_fkey"; columns: ["organization_id", "branch_id"]; isOneToOne: false; referencedRelation: "branches"; referencedColumns: ["organization_id", "id"] },
        ]
      >;
      vehicles: TableDefinition<
        VehicleRow,
        VehicleInsert,
        [
          { foreignKeyName: "vehicles_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
          { foreignKeyName: "vehicles_tenant_branch_fkey"; columns: ["organization_id", "branch_id"]; isOneToOne: false; referencedRelation: "branches"; referencedColumns: ["organization_id", "id"] },
        ]
      >;
      vehicle_financials: TableDefinition<
        VehicleFinancialRow,
        VehicleFinancialInsert,
        [
          { foreignKeyName: "vehicle_financials_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
          { foreignKeyName: "vehicle_financials_tenant_vehicle_fkey"; columns: ["organization_id", "vehicle_id"]; isOneToOne: true; referencedRelation: "vehicles"; referencedColumns: ["organization_id", "id"] },
        ]
      >;
      dashboard_snapshots: TableDefinition<
        DashboardSnapshotRow,
        DashboardSnapshotInsert,
        [
          { foreignKeyName: "dashboard_snapshots_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
          { foreignKeyName: "dashboard_snapshots_tenant_branch_fkey"; columns: ["organization_id", "branch_id"]; isOneToOne: false; referencedRelation: "branches"; referencedColumns: ["organization_id", "id"] },
        ]
      >;
      notifications: TableDefinition<
        NotificationRow,
        NotificationInsert,
        [
          { foreignKeyName: "notifications_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
          { foreignKeyName: "notifications_tenant_recipient_fkey"; columns: ["organization_id", "recipient_id"]; isOneToOne: false; referencedRelation: "organization_memberships"; referencedColumns: ["organization_id", "user_id"] },
        ]
      >;
      audit_logs: TableDefinition<
        AuditLogRow,
        AuditLogInsert,
        [
          { foreignKeyName: "audit_logs_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
          { foreignKeyName: "audit_logs_tenant_actor_fkey"; columns: ["organization_id", "actor_id"]; isOneToOne: false; referencedRelation: "organization_memberships"; referencedColumns: ["organization_id", "user_id"] },
        ]
      >;
    };
    Views: Record<never, never>;
    Functions: Record<never, never>;
    Enums: {
      module_key: ModuleKey;
      membership_status: MembershipStatus;
      organization_scope: OrganizationScope;
      vehicle_workflow_status: VehicleWorkflowStatus;
      notification_priority: NotificationPriority;
    };
    CompositeTypes: Record<never, never>;
  };
};
