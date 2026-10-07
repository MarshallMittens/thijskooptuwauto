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
          is_platform_affiliated: boolean;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      payment_orders: {
        Row: {
          id: string;
          application_id: string;
          company_id: string;
          status: string;
          buyer_charge_cents: number;
          seller_payout_cents: number;
          received_cents: number;
          refunded_cents: number;
          currency: string;
          recipient_reference: string;
          provider_payment_reference: string;
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
        Args: { p_application_id: string };
        Returns: Json;
      };
      admin_close_bid_round: {
        Args: { p_bid_round_id: string };
        Returns: Json;
      };
      admin_restart_bid_round: {
        Args: { p_application_id: string; p_reason: string; p_idempotency_key: string };
        Returns: Json;
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
      close_due_bid_rounds: {
        Args: { p_limit?: number };
        Returns: Json;
      };
      admin_add_contact_event: {
        Args: { p_application_id: string; p_channel: string; p_summary: string; p_occurred_at: string };
        Returns: string;
      };
      admin_update_deal_case: {
        Args: { p_application_id: string; p_status: "not_started" | "discussing" | "agreement_pending" | "agreed" | "completed" | "not_sold" | "withdrawn"; p_selected_bid_id: string | null };
        Returns: Json;
      };
      admin_record_material_change: {
        Args: {
          p_application_id: string;
          p_expected_revision_id: string | null;
          p_mileage_km: number | null;
          p_damage_description: string;
          p_technical_issues: string;
          p_maintenance_description: string;
          p_key_count: number | null;
          p_remarks: string;
          p_reason: string;
        };
        Returns: Json;
      };
      get_admin_case_state: {
        Args: { p_application_id: string };
        Returns: Json;
      };
      prepare_seller_access: {
        Args: { p_reference: string; p_email: string; p_actor_key: string };
        Returns: boolean;
      };
      claim_seller_application: {
        Args: { p_reference: string };
        Returns: string;
      };
      list_my_seller_applications: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      seller_update_application: {
        Args: {
          p_application_id: string;
          p_mileage_km: number;
          p_damage_description: string;
          p_technical_issues: string;
          p_maintenance_description: string;
          p_key_count: number;
          p_remarks: string;
          p_desired_sale_date: string | null;
        };
        Returns: undefined;
      };
      get_admin_seller_verification: {
        Args: { p_application_id: string };
        Returns: Json;
      };
      dealer_propose_appointment: {
        Args: { p_winner_reservation_id: string; p_slots: string[]; p_idempotency_key: string };
        Returns: Json;
      };
      seller_respond_appointment: {
        Args: { p_application_id: string; p_appointment_id: string; p_action: string; p_selected_slot?: string | null; p_note?: string | null };
        Returns: Json;
      };
      dealer_record_inspection: {
        Args: { p_appointment_id: string; p_status: string; p_mileage_km: number | null; p_findings: string; p_deviation_description: string; p_proposed_price_cents: number | null; p_adjustment_reason: string; p_inspected_at: string; p_idempotency_key: string };
        Returns: Json;
      };
      register_inspection_photo: {
        Args: { p_inspection_id: string; p_actor_id: string; p_storage_path: string; p_size_bytes: number; p_sha256: string };
        Returns: string;
      };
      seller_respond_price_adjustment: {
        Args: { p_application_id: string; p_proposal_id: string; p_accept: boolean };
        Returns: Json;
      };
      seller_respond_sale_agreement: {
        Args: { p_application_id: string; p_agreement_id: string; p_accept: boolean };
        Returns: Json;
      };
      dealer_respond_sale_agreement: {
        Args: { p_agreement_id: string; p_accept: boolean };
        Returns: Json;
      };
      get_dealer_won_cases: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_seller_phase4_state: {
        Args: { p_application_id: string };
        Returns: Json;
      };
      get_admin_phase4_state: {
        Args: { p_application_id: string };
        Returns: Json;
      };
      set_test_payment_simulator_enabled: {
        Args: { p_enabled: boolean; p_actor_id: string };
        Returns: undefined;
      };
      seller_start_test_payment_onboarding: {
        Args: { p_application_id: string; p_idempotency_key: string };
        Returns: Json;
      };
      seller_complete_test_payment_onboarding: {
        Args: { p_application_id: string };
        Returns: Json;
      };
      dealer_create_test_payment: {
        Args: { p_agreement_id: string; p_idempotency_key: string };
        Returns: Json;
      };
      process_simulated_payment_event: {
        Args: {
          p_provider_event_id: string;
          p_provider_payment_reference: string;
          p_event_type: string;
          p_amount_cents: number;
          p_currency: string;
          p_recipient_reference: string;
          p_provider_occurred_at: string;
          p_payload_sha256: string;
        };
        Returns: Json;
      };
      seller_confirm_test_handover: {
        Args: { p_payment_order_id: string };
        Returns: Json;
      };
      dealer_confirm_test_handover: {
        Args: { p_payment_order_id: string };
        Returns: Json;
      };
      admin_verify_test_handover: {
        Args: { p_payment_order_id: string };
        Returns: Json;
      };
      admin_request_test_release: {
        Args: { p_payment_order_id: string };
        Returns: Json;
      };
      admin_request_test_refund: {
        Args: { p_payment_order_id: string; p_amount_cents: number; p_reason: string; p_idempotency_key: string };
        Returns: Json;
      };
      run_test_payment_reconciliation: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_dealer_test_payment_cases: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_seller_test_payment_state: {
        Args: { p_application_id: string };
        Returns: Json;
      };
      get_admin_test_payment_state: {
        Args: { p_application_id: string };
        Returns: Json;
      };
      seller_open_complaint: {
        Args: { p_application_id: string; p_category: string; p_summary: string; p_idempotency_key: string };
        Returns: Json;
      };
      dealer_open_complaint: {
        Args: { p_payment_order_id: string; p_category: string; p_summary: string; p_idempotency_key: string };
        Returns: Json;
      };
      dealer_open_complaint_for_reservation: {
        Args: { p_winner_reservation_id: string; p_category: string; p_summary: string; p_idempotency_key: string };
        Returns: Json;
      };
      can_upload_complaint_evidence: {
        Args: { p_complaint_id: string };
        Returns: boolean;
      };
      add_complaint_message: {
        Args: { p_complaint_id: string; p_body: string };
        Returns: string;
      };
      register_complaint_evidence: {
        Args: { p_complaint_id: string; p_actor_id: string; p_storage_path: string; p_size_bytes: number; p_sha256: string };
        Returns: string;
      };
      admin_review_complaint: {
        Args: { p_complaint_id: string; p_notes: string };
        Returns: undefined;
      };
      admin_update_complaint: {
        Args: { p_complaint_id: string; p_status: string; p_resolution: string };
        Returns: undefined;
      };
      admin_set_platform_affiliation: {
        Args: { p_company_id: string; p_affiliated: boolean };
        Returns: undefined;
      };
      admin_create_test_invoice_record: {
        Args: { p_payment_order_id: string; p_document_type: string; p_corrected_invoice_id: string | null; p_reason: string };
        Returns: string;
      };
      admin_create_incident: {
        Args: { p_severity: string; p_summary: string; p_impact: string };
        Returns: string;
      };
      admin_update_incident: {
        Args: { p_incident_id: string; p_status: string; p_resolution: string };
        Returns: undefined;
      };
      claim_notification_batch: {
        Args: { p_worker_id: string; p_limit?: number };
        Returns: Json;
      };
      complete_notification_delivery: {
        Args: { p_notification_id: string; p_worker_id: string; p_sent: boolean; p_error: string | null };
        Returns: undefined;
      };
      start_operation_run: {
        Args: { p_operation_type: string; p_worker_id: string };
        Returns: string;
      };
      finish_operation_run: {
        Args: { p_run_id: string; p_status: string; p_processed: number; p_failed: number; p_details: Json };
        Returns: undefined;
      };
      record_local_recovery_test: {
        Args: { p_status: string; p_database_restored: boolean; p_storage_restored: boolean; p_table_count: number; p_object_count: number; p_evidence: Json; p_started_at: string };
        Returns: string;
      };
      get_seller_complaint_state: {
        Args: { p_application_id: string };
        Returns: Json;
      };
      get_dealer_complaint_state: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      get_admin_complaint_state: {
        Args: { p_application_id: string };
        Returns: Json;
      };
      get_admin_operations_dashboard: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
    };
    Enums: {
      company_status: "pending" | "approved" | "blocked";
    };
    CompositeTypes: Record<string, never>;
  };
};
