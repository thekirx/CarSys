type EmptySchemaRecord = Record<never, never>;

/**
 * Temporary empty Supabase schema boundary.
 *
 * Task 5 replaces this type with types generated from the deployed schema.
 */
export type Database = {
  public: {
    Tables: EmptySchemaRecord;
    Views: EmptySchemaRecord;
    Functions: EmptySchemaRecord;
    Enums: EmptySchemaRecord;
    CompositeTypes: EmptySchemaRecord;
  };
};
