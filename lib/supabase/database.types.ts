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
      list_admin_applications: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_admin_application: {
        Args: { p_application_id: string };
        Returns: Json;
      };
      admin_update_application_status: {
        Args: {
          p_application_id: string;
          p_status: "draft" | "submitted" | "in_review" | "needs_information" | "ready" | "withdrawn" | "closed";
        };
        Returns: undefined;
      };
      admin_add_internal_note: {
        Args: { p_application_id: string; p_body: string };
        Returns: string;
      };
      admin_set_photo_review: {
        Args: { p_photo_id: string; p_status: "pending" | "approved" | "rejected" };
        Returns: undefined;
      };
      admin_publish_application: {
        Args: { p_application_id: string; p_starts_at: string; p_ends_at: string };
        Returns: Json;
      };
      admin_close_bid_round: {
        Args: { p_bid_round_id: string };
        Returns: undefined;
      };
      get_admin_market_state: {
        Args: { p_application_id: string };
        Returns: Json;
      };
      list_dealer_listings: {
        Args: { p_query: string | null; p_make: string | null; p_round_status: string | null };
        Returns: Json;
      };
      get_dealer_listing: {
        Args: { p_listing_id: string };
        Returns: Json;
      };
      list_my_bids: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      place_bid: {
        Args: { p_bid_round_id: string; p_amount_cents: number; p_idempotency_key: string };
        Returns: Json;
      };
    };
    Enums: {
      company_status: "pending" | "approved" | "blocked";
    };
    CompositeTypes: Record<string, never>;
  };
};
