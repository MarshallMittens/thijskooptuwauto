export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          legal_name: string;
          trade_name: string | null;
          kvk_number: string;
          status: "pending" | "approved" | "blocked";
          email: string;
          phone: string;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_my_access_context: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      register_company: {
        Args: {
          p_legal_name: string;
          p_trade_name: string | null;
          p_kvk_number: string;
          p_street: string;
          p_house_number: string;
          p_postal_code: string;
          p_city: string;
          p_contact_name: string;
          p_email: string;
          p_phone: string;
        };
        Returns: string;
      };
      set_company_status: {
        Args: {
          p_company_id: string;
          p_status: "approved" | "blocked";
        };
        Returns: undefined;
      };
    };
    Enums: {
      company_status: "pending" | "approved" | "blocked";
    };
    CompositeTypes: Record<string, never>;
  };
};
