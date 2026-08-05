export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Table<Row> = {
  Row: Row;
  Insert: Record<string, unknown>;
  Update: Record<string, unknown>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      organizations: Table<{
        id: string; name: string; slug: string; email: string | null; phone: string | null; address: string | null;
        timezone: string; currency: string; status: string; logo_path: string | null; created_at: string; updated_at: string;
      }>;
      organization_memberships: Table<{
        id: string; organization_id: string; user_id: string; role_id: string; status: string; scope: string;
        invited_at: string; joined_at: string | null; suspended_at: string | null; created_at: string; updated_at: string;
      }>;
      roles: Table<{
        id: string; organization_id: string | null; code: string; name: string; description: string; is_system: boolean;
        created_at: string; updated_at: string;
      }>;
      permissions: Table<{ id: string; key: string; name: string; description: string; created_at: string }>;
      role_permissions: Table<{ role_id: string; permission_id: string; created_at: string }>;
      branches: Table<{
        id: string; organization_id: string; code: string; name: string; address: string | null; timezone: string;
        status: string; created_at: string; updated_at: string;
      }>;
      membership_branches: Table<{ membership_id: string; branch_id: string; created_at: string }>;
      vehicles: Table<{
        id: string; organization_id: string; branch_id: string; stock_number: string; year: number; make: string;
        model: string; variant: string | null; color: string | null; plate_number: string | null; vin: string | null;
        workflow_status: string; list_price: number; acquired_at: string | null; listed_at: string | null;
        sold_at: string | null; created_at: string; updated_at: string;
      }>;
      vehicle_financials: Table<{
        vehicle_id: string; organization_id: string; acquisition_value: number; preparation_cost: number;
        minimum_price: number | null; updated_at: string;
      }>;
      dashboard_snapshots: Table<{
        id: string; organization_id: string; branch_id: string | null; metric_key: string; payload: Json;
        period_start: string | null; period_end: string | null; generated_at: string;
      }>;
      organization_modules: Table<{
        id: string; organization_id: string; module_id: string; enabled: boolean; enabled_at: string | null;
        enabled_by: string | null; created_at: string; updated_at: string;
      }>;
      modules: Table<{ id: string; key: string; name: string; description: string; created_at: string }>;
      profiles: Table<{
        id: string; display_name: string; email: string | null; mobile_number: string | null; avatar_path: string | null;
        created_at: string; updated_at: string;
      }>;
      notifications: Table<{
        id: string; organization_id: string; recipient_user_id: string | null; category: string; priority: string;
        title: string; body: string; related_entity_type: string | null; related_entity_id: string | null;
        read_at: string | null; created_at: string;
      }>;
      audit_logs: Table<{
        id: string; organization_id: string; actor_user_id: string | null; action: string; entity_type: string;
        entity_id: string | null; before_data: Json | null; after_data: Json | null; reason: string | null;
        request_metadata: Json; created_at: string;
      }>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      module_key: "dealership" | "fleet_management" | "vehicle_rental";
      membership_status: "invited" | "active" | "suspended" | "inactive";
      organization_scope: "organization" | "assigned_branches";
      organization_status: "active" | "suspended" | "inactive";
      branch_status: "active" | "inactive";
      vehicle_workflow_status: string;
      notification_priority: "info" | "warning" | "critical";
    };
    CompositeTypes: Record<string, never>;
  };
};
