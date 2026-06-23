export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          portal_role: 'admin' | 'customer' | 'supplier';
          rbac_role: string | null;
          name: string | null;
          company: string | null;
          phone: string | null;
          region: string | null;
          country: string | null;
          currency: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      audit_logs: {
        Row: {
          id: string;
          entity_type: string;
          entity_id: string;
          actor_id: string | null;
          actor_email: string;
          actor_role: string;
          action: string;
          changed_fields: Json;
          source: string;
          occurred_at: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'occurred_at' | 'created_at'> & {
          id?: string;
          occurred_at?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['audit_logs']['Insert']>;
      };
      sales_contracts: {
        Row: {
          id: string;
          contract_number: string;
          quotation_number: string | null;
          inquiry_number: string | null;
          customer_name: string;
          customer_email: string;
          customer_company: string | null;
          customer_address: string | null;
          customer_country: string | null;
          contact_person: string | null;
          contact_phone: string | null;
          sales_person: string | null;
          sales_person_name: string | null;
          supervisor: string | null;
          region: string | null;
          products: Json;
          total_amount: number;
          currency: string;
          trade_terms: string | null;
          payment_terms: string | null;
          payment_mode: string | null;
          balance_trigger: string | null;
          sc_type: string | null;
          exceptional_clause_flag: boolean;
          exceptional_clause_notes: string | null;
          special_account_period_flag: boolean;
          strategic_customer_flag: boolean;
          sc_last_approval_at: string | null;
          deposit_percentage: number | null;
          deposit_amount: number | null;
          balance_percentage: number | null;
          balance_amount: number | null;
          delivery_time: string | null;
          port_of_loading: string | null;
          port_of_destination: string | null;
          packing: string | null;
          status: string;
          approval_flow: Json | null;
          approval_history: Json | null;
          approval_notes: string | null;
          rejection_reason: string | null;
          deposit_proof: Json | null;
          deposit_confirmed_by: string | null;
          deposit_confirmed_at: string | null;
          deposit_confirm_notes: string | null;
          purchase_order_numbers: string[] | null;
          seller_signature: Json | null;
          buyer_signature: Json | null;
          remarks: string | null;
          attachments: Json | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          submitted_at: string | null;
          approved_at: string | null;
          sent_to_customer_at: string | null;
          customer_confirmed_at: string | null;
          approval_status: string | null;
          execution_status: string | null;
          payment_status_deposit: string | null;
          payment_status_balance: string | null;
        };
        Insert: Omit<Database['public']['Tables']['sales_contracts']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['sales_contracts']['Insert']>;
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          customer: string;
          customer_email: string | null;
          quotation_id: string | null;
          quotation_number: string | null;
          contract_number: string | null;
          date: string;
          expected_delivery: string | null;
          total_amount: number;
          currency: string;
          status: string;
          progress: number | null;
          products: Json;
          payment_status: string | null;
          payment_terms: string | null;
          shipping_method: string | null;
          delivery_terms: string | null;
          tracking_number: string | null;
          notes: string | null;
          created_from: string | null;
          region: string | null;
          country: string | null;
          delivery_address: string | null;
          contact_person: string | null;
          phone: string | null;
          customer_feedback: Json | null;
          deposit_payment_proof: Json | null;
          deposit_receipt_proof: Json | null;
          balance_payment_proof: Json | null;
          balance_receipt_proof: Json | null;
          contract_terms: Json | null;
          confirmed: boolean | null;
          confirmed_at: string | null;
          confirmed_by: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['orders']['Insert']>;
      };
      purchase_orders: {
        Row: {
          id: string;
          po_number: string;
          requirement_no: string | null;
          xj_number: string | null;
          supplier_code: string;
          supplier_name: string;
          supplier_email: string;
          region_code: string | null;
          items: Json;
          total_amount: number;
          currency: string;
          payment_mode: string | null;
          payment_terms: string | null;
          delivery_terms: string | null;
          expected_delivery_date: string | null;
          status: string;
          notes: string | null;
          created_by: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
          cg_number: string | null;
          display_number: string | null;
          parent_request_po_number: string | null;
          pending_supplier_po_numbers: string[] | null;
          allocated_supplier_count: number | null;
          supplier_allocation_ready: boolean;
          document_type: string | null;
          approval_status: string | null;
          execution_status: string | null;
          procurement_request_status: string | null;
          pr_validation_status: string | null;
          pr_validated_at: string | null;
          pr_validated_by: string | null;
          cg_type: string | null;
          selected_bj_id: string | null;
          bj_locked_at: string | null;
          source_doc_id: string | null;
          sales_contract_id: string | null;
          root_sales_contract_id: string | null;
          template_id: string | null;
          template_version_id: string | null;
          template_snapshot: Json;
          document_data_snapshot: Json;
          document_render_meta: Json;
          owner_user_id: string | null;
          owner_email: string | null;
          owner_name: string | null;
          owner_role: string | null;
          operator_user_id: string | null;
          operator_email: string | null;
          operator_role: string | null;
          acting_user_id: string | null;
          acting_user_email: string | null;
          acting_user_role: string | null;
          authenticated_user_id: string | null;
          authenticated_user_email: string | null;
          authenticated_user_role: string | null;
        };
        Insert: Omit<Database['public']['Tables']['purchase_orders']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['purchase_orders']['Insert']>;
      };
      purchase_order_execution: {
        Row: {
          id: string;
          purchase_order_id: string;
          execution_status: string;
          supplier_confirmed_at: string | null;
          supplier_rejected_at: string | null;
          supplier_reply_notes: string | null;
          sample_required: boolean;
          sample_confirmed_at: string | null;
          production_started_at: string | null;
          estimated_completion_date: string | null;
          production_completed_at: string | null;
          supplier_self_inspection_status: string;
          qc_inspection_status: string;
          qc_release_status: string | null;
          qc_release_block_reason: string | null;
          release_approved_by: string | null;
          finished_goods_confirmed_at: string | null;
          customer_balance_status: string;
          supplier_balance_status: string;
          fulfillment_mode: string | null;
          consolidation_required: boolean;
          shipment_readiness_status: string;
          remarks: string | null;
          created_at: string;
          updated_at: string;
          collection_control_mode: string | null;
          document_release_mode: string | null;
          customer_balance_gate_status: string;
          customer_balance_confirmed_at: string | null;
          lc_type: string | null;
          lc_opened_at: string | null;
          lc_discrepancy_status: string | null;
          lc_discrepancy_notes: string | null;
          lc_discrepancy_recorded_at: string | null;
          lc_discrepancy_recorded_by: string | null;
          lc_discrepancy_approval_status: string;
          lc_discrepancy_approval_requested_at: string | null;
          lc_discrepancy_approval_requested_by: string | null;
          lc_discrepancy_approved_at: string | null;
          lc_discrepancy_approved_by: string | null;
          lc_discrepancy_rejected_at: string | null;
          lc_discrepancy_rejected_by: string | null;
          lc_maturity_date: string | null;
          bank_submission_status: string;
          acceptance_status: string | null;
          acceptance_date: string | null;
          acceptance_maturity_date: string | null;
          document_release_status: string;
          booking_responsibility: string | null;
          freight_confirmation_required: boolean;
          freight_confirmed_by_customer_at: string | null;
          booking_status: string;
          customer_payment_received_at: string | null;
          customer_payment_confirmed_at: string | null;
          finance_confirmed_received_by: string | null;
          customer_inspection_mode: string | null;
          goods_ready_notified_to_customer_at: string | null;
          inspection_method_notified_at: string | null;
          qc_report_shared_to_customer_at: string | null;
          freight_inquiry_status: string;
          selected_booking_quote_id: string | null;
          shipping_order_status: string;
          inspection_execution_mode: string | null;
          customer_designated_inspection_agency: string | null;
          customer_designated_inspection_status: string;
          loading_supervision_mode: string | null;
          loading_supervision_agency_name: string | null;
          loading_supervision_required: boolean;
          loading_supervision_feedback_status: string;
          case_close_status: string;
          case_closed_at: string | null;
          case_closed_by: string | null;
          archive_status: string;
          archived_at: string | null;
          archived_by: string | null;
          pre_production_sample_status: string;
          pre_production_sample_no: string | null;
          sample_round: number;
          pre_production_sample_sent_at: string | null;
          seal_confirmed_at: string | null;
          seal_status: string;
          sealed_sample_ref: string | null;
          sealed_sample_version: string | null;
          sealed_sample_uploaded_at: string | null;
          sealed_sample_uploaded_by: string | null;
          sealed_sample_confirmed_at: string | null;
          sealed_sample_confirmed_by: string | null;
          seal_invalidated_at: string | null;
          seal_invalidated_by: string | null;
          seal_invalidated_reason: string | null;
          supplier_balance_confirmed_at: string | null;
          supplier_balance_confirmed_by: string | null;
          bank_submitted_at: string | null;
          bank_submitted_by: string | null;
          document_released_at: string | null;
          document_released_by: string | null;
        };
        Insert: Omit<Database['public']['Tables']['purchase_order_execution']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['purchase_order_execution']['Insert']>;
      };
      post_contract_task_action_logs: {
        Row: {
          id: string;
          purchase_order_id: string;
          task_key: string;
          task_type: string;
          action_code: string;
          action_label: string;
          status_after: string | null;
          operator_name: string | null;
          operator_role: string | null;
          remarks: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['post_contract_task_action_logs']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['post_contract_task_action_logs']['Insert']>;
      };
      voyage_tracking: {
        Row: {
          id: string;
          tracking_no: string;
          shipment_no: string | null;
          load_plan_id: string | null;
          sales_contract_id: string | null;
          purchase_order_id: string | null;
          bl_no: string | null;
          container_no: string | null;
          carrier_name: string | null;
          vessel_name: string | null;
          voyage_no: string | null;
          etd: string | null;
          eta: string | null;
          ata: string | null;
          current_status: string;
          current_location: string | null;
          last_event_at: string | null;
          tracking_source: string | null;
          remarks: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['voyage_tracking']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['voyage_tracking']['Insert']>;
      };
      arrival_notices: {
        Row: {
          id: string;
          arrival_notice_no: string;
          shipment_no: string | null;
          voyage_id: string | null;
          load_plan_id: string | null;
          bl_no: string | null;
          arrival_port: string | null;
          arrival_at: string | null;
          free_days: number | null;
          demurrage_rule: string | null;
          sent_to_customer_at: string | null;
          sent_to_agent_at: string | null;
          status: string;
          files: Json;
          remarks: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['arrival_notices']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['arrival_notices']['Insert']>;
      };
      voyage_tracking_events: {
        Row: {
          id: string;
          voyage_id: string;
          event_code: string | null;
          event_name: string;
          event_time: string | null;
          location: string | null;
          source: string | null;
          remarks: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['voyage_tracking_events']['Row'], 'created_at'> & {
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['voyage_tracking_events']['Insert']>;
      };
      import_clearance_coordination: {
        Row: {
          id: string;
          clearance_no: string;
          shipment_no: string | null;
          voyage_id: string | null;
          arrival_notice_id: string | null;
          customer_id: string | null;
          destination_country: string | null;
          destination_port: string | null;
          import_broker_name: string | null;
          import_broker_contact: string | null;
          import_clearance_responsibility: string | null;
          destination_delivery_responsibility: string | null;
          clearance_status: string;
          doc_status: string;
          customs_release_at: string | null;
          duty_paid_flag: boolean;
          delivery_order_received: boolean;
          remarks: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['import_clearance_coordination']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['import_clearance_coordination']['Insert']>;
      };
      delivery_confirmations: {
        Row: {
          id: string;
          delivery_confirm_no: string;
          shipment_no: string | null;
          voyage_id: string | null;
          clearance_id: string | null;
          customer_id: string | null;
          delivered_at: string | null;
          received_by: string | null;
          received_quantity: number;
          damage_flag: boolean;
          shortage_flag: boolean;
          claim_flag: boolean;
          pod_files: Json;
          photos: Json;
          remarks: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['delivery_confirmations']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['delivery_confirmations']['Insert']>;
      };
      delivery_exceptions: {
        Row: {
          id: string;
          exception_no: string;
          shipment_no: string | null;
          voyage_id: string | null;
          delivery_confirm_id: string | null;
          exception_type: string;
          reported_by: string | null;
          reported_at: string | null;
          responsible_party: string | null;
          financial_impact: number | null;
          status: string;
          evidence_files: Json;
          resolution_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['delivery_exceptions']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['delivery_exceptions']['Insert']>;
      };
      post_order_feedback: {
        Row: {
          id: string;
          feedback_no: string;
          sales_contract_id: string | null;
          purchase_order_id: string | null;
          shipment_no: string | null;
          voyage_id: string | null;
          delivery_confirmation_id: string | null;
          customer_id: string | null;
          customer_name: string;
          feedback_channel: string;
          feedback_status: string;
          product_rating: number | null;
          packaging_rating: number | null;
          delivery_rating: number | null;
          service_rating: number | null;
          overall_rating: number | null;
          quality_issue_flag: boolean;
          packaging_issue_flag: boolean;
          delivery_issue_flag: boolean;
          reorder_intent: string | null;
          recommend_intent: string | null;
          feedback_text: string | null;
          attachments: Json;
          submitted_at: string;
          submitted_by: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          internal_summary: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['post_order_feedback']['Row'], 'created_at' | 'updated_at' | 'submitted_at'> & {
          created_at?: string;
          updated_at?: string;
          submitted_at?: string;
        };
        Update: Partial<Database['public']['Tables']['post_order_feedback']['Insert']>;
      };
      export_requirement_checks: {
        Row: {
          id: string;
          check_no: string;
          sales_contract_id: string | null;
          purchase_order_id: string | null;
          shipment_no: string | null;
          load_plan_id: string | null;
          destination_country: string | null;
          trade_term: string | null;
          customer_id: string | null;
          requires_customs_declaration: boolean;
          requires_inspection: boolean;
          requires_co: boolean;
          requires_fumigation: boolean;
          requires_loading_inspection_report: boolean;
          requires_health_certificate: boolean;
          requires_other_docs: boolean;
          other_doc_notes: string | null;
          checked_by: string | null;
          checked_at: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['export_requirement_checks']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['export_requirement_checks']['Insert']>;
      };
      shipment_document_sets: {
        Row: {
          id: string;
          document_set_no: string;
          purchase_order_id: string;
          load_plan_id: string | null;
          commercial_invoice_no: string | null;
          packing_list_no: string | null;
          ci_status: string;
          pl_status: string;
          docs_ready_at: string | null;
          prepared_by: string | null;
          remarks: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['shipment_document_sets']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['shipment_document_sets']['Insert']>;
      };
      customs_declarations: {
        Row: {
          id: string;
          customs_decl_no: string;
          purchase_order_id: string;
          load_plan_id: string | null;
          broker_name: string | null;
          declaration_date: string | null;
          declaration_status: string;
          released_at: string | null;
          declaration_files: Json;
          remarks: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['customs_declarations']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['customs_declarations']['Insert']>;
      };
      domestic_transfer_orders: {
        Row: {
          id: string;
          transfer_no: string;
          purchase_order_id: string | null;
          shipment_no: string | null;
          source_party_type: string;
          source_party_id: string | null;
          source_location_id: string | null;
          destination_party_type: string;
          destination_party_id: string | null;
          destination_location_id: string | null;
          carrier_type: string | null;
          carrier_id: string | null;
          carrier_name: string | null;
          driver_name: string | null;
          driver_phone: string | null;
          vehicle_no: string | null;
          transport_mode: string | null;
          pickup_date: string | null;
          planned_arrival_date: string | null;
          actual_departure_at: string | null;
          actual_arrival_at: string | null;
          tracking_no: string | null;
          freight_currency: string;
          freight_amount: number;
          freight_charge_party: string | null;
          freight_advance_party: string | null;
          freight_settlement_party: string | null;
          freight_payment_status: string;
          status: string;
          remarks: string | null;
          created_at: string;
          updated_at: string;
          carrier_contact_name: string | null;
          carrier_contact_phone: string | null;
          carrier_contact_email: string | null;
          receiver_contact_name: string | null;
          receiver_contact_phone: string | null;
          warehouse_name: string | null;
          warehouse_type: string | null;
          warehouse_address: string | null;
          warehouse_settlement_party: string | null;
          warehouse_settlement_currency: string;
          warehouse_settlement_amount: number;
          warehouse_settlement_status: string;
          consolidation_plan_id: string | null;
          consolidation_item_id: string | null;
        };
        Insert: Omit<Database['public']['Tables']['domestic_transfer_orders']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['domestic_transfer_orders']['Insert']>;
      };
      cargo_lots: {
        Row: {
          id: string;
          cargo_lot_no: string;
          purchase_order_id: string | null;
          sales_contract_id: string | null;
          source_supplier_id: string | null;
          source_location_id: string | null;
          current_location_type: string | null;
          current_location_id: string | null;
          final_loading_location_id: string | null;
          product_id: string | null;
          product_name: string;
          model_no: string | null;
          specification: string | null;
          hs_code: string | null;
          packages: number;
          quantity: number;
          unit: string | null;
          gross_weight: number;
          net_weight: number;
          volume_cbm: number;
          packing_type: string | null;
          has_wood_packing: boolean;
          requires_inspection: boolean;
          requires_co: boolean;
          requires_fumigation: boolean;
          status: string;
          ready_date: string | null;
          loaded_at: string | null;
          shipped_at: string | null;
          remarks: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['cargo_lots']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['cargo_lots']['Insert']>;
      };
      cargo_receipts: {
        Row: {
          id: string;
          receipt_no: string;
          transfer_order_id: string;
          receipt_status: string;
          receiver_party_type: string | null;
          receiver_party_id: string | null;
          receiver_location_id: string | null;
          received_at: string | null;
          received_by: string | null;
          contact_phone: string | null;
          expected_packages: number;
          received_packages: number;
          expected_quantity: number;
          received_quantity: number;
          damage_flag: boolean;
          shortage_flag: boolean;
          overage_flag: boolean;
          variance_flag: boolean;
          photo_files: Json;
          signed_files: Json;
          remarks: string | null;
          created_at: string;
          updated_at: string;
          consolidation_plan_id: string | null;
        };
        Insert: Omit<Database['public']['Tables']['cargo_receipts']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['cargo_receipts']['Insert']>;
      };
      booking_quote_requests: {
        Row: {
          id: string;
          request_no: string;
          purchase_order_id: string;
          load_plan_id: string | null;
          destination_port: string | null;
          trade_term: string | null;
          booking_responsibility: string | null;
          freight_confirmation_required: boolean;
          customer_confirmation_required: boolean;
          customer_confirmed_at: string | null;
          cargo_ready_date: string | null;
          container_type: string | null;
          quantity_summary: string | null;
          quote_deadline_at: string | null;
          selected_option_id: string | null;
          status: string;
          remarks: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['booking_quote_requests']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['booking_quote_requests']['Insert']>;
      };
      booking_quote_options: {
        Row: {
          id: string;
          request_id: string;
          option_rank: number;
          forwarder_id: string | null;
          forwarder_name: string;
          carrier_name: string;
          vessel_name: string | null;
          voyage_no: string | null;
          etd: string | null;
          eta: string | null;
          transit_days: number | null;
          freight_currency: string;
          freight_amount: number;
          surcharge_amount: number;
          total_amount: number;
          quote_valid_until: string | null;
          is_selected: boolean;
          remarks: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['booking_quote_options']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['booking_quote_options']['Insert']>;
      };
      shipping_orders: {
        Row: {
          id: string;
          shipping_order_no: string;
          purchase_order_id: string;
          booking_quote_request_id: string | null;
          selected_quote_option_id: string | null;
          load_plan_id: string | null;
          forwarder_id: string | null;
          forwarder_name: string | null;
          carrier_name: string | null;
          vessel_name: string | null;
          voyage_no: string | null;
          booking_no: string | null;
          destination_port: string | null;
          planned_etd: string | null;
          booking_cutoff_at: string | null;
          si_cutoff_at: string | null;
          port_filing_required: boolean;
          port_filing_status: string;
          shipping_order_status: string;
          issued_at: string | null;
          booking_confirmed_at: string | null;
          remarks: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['shipping_orders']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['shipping_orders']['Insert']>;
      };
      third_party_warehouses: {
        Row: {
          id: string;
          warehouse_no: string;
          warehouse_name: string;
          warehouse_type: string;
          contact_name: string | null;
          contact_phone: string | null;
          contact_email: string | null;
          address: string | null;
          city: string | null;
          province: string | null;
          country: string;
          status: string;
          service_scope: Json;
          settlement_terms: string | null;
          remarks: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['third_party_warehouses']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['third_party_warehouses']['Insert']>;
      };
      consolidation_plans: {
        Row: {
          id: string;
          plan_no: string;
          shipment_no: string | null;
          load_plan_id: string | null;
          consolidation_point_type: string;
          consolidation_point_id: string | null;
          consolidation_point_name: string;
          consolidation_point_address: string | null;
          warehouse_contact_name: string | null;
          warehouse_contact_phone: string | null;
          planned_loading_date: string | null;
          status: string;
          remarks: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['consolidation_plans']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['consolidation_plans']['Insert']>;
      };
      consolidation_plan_items: {
        Row: {
          id: string;
          plan_id: string;
          purchase_order_id: string | null;
          supplier_id: string | null;
          supplier_name: string | null;
          product_name: string;
          model_no: string | null;
          planned_container_no: string | null;
          planned_container_slot: string | null;
          planned_packages: number;
          planned_quantity: number;
          received_packages: number;
          received_quantity: number;
          item_status: string;
          remarks: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['consolidation_plan_items']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['consolidation_plan_items']['Insert']>;
      };
      loading_pools: {
        Row: {
          id: string;
          pool_no: string;
          pool_name: string;
          pool_type: string;
          customer_id: string | null;
          customer_name: string | null;
          shipment_batch_no: string | null;
          shipment_split_no: string | null;
          planning_scope: string;
          pool_status: string;
          planned_loading_date: string | null;
          port_of_loading: string | null;
          destination_port: string | null;
          trade_term: string | null;
          currency: string | null;
          total_orders: number;
          total_suppliers: number;
          total_skus: number;
          total_cartons: number;
          total_weight_kg: number;
          total_cbm: number;
          rules_profile_code: string | null;
          business_constraints_snapshot: Json;
          remarks: string | null;
          created_by: string | null;
          approved_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['loading_pools']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['loading_pools']['Insert']>;
      };
      loading_pool_items: {
        Row: {
          id: string;
          pool_id: string;
          source_type: string;
          source_ref_id: string | null;
          sales_contract_id: string | null;
          purchase_order_id: string | null;
          order_id: string | null;
          order_no: string | null;
          customer_id: string | null;
          customer_name: string | null;
          supplier_id: string | null;
          supplier_name: string | null;
          shipment_batch_no: string | null;
          shipment_split_no: string | null;
          sku_id: string | null;
          sku_code: string | null;
          product_name: string;
          model_no: string | null;
          category_code: string | null;
          cargo_category: string | null;
          packaging_unit_type: string;
          is_palletized: boolean;
          units_per_handling_group: number;
          carton_count: number;
          quantity: number;
          carton_length_cm: number;
          carton_width_cm: number;
          carton_height_cm: number;
          carton_gross_weight_kg: number;
          single_carton_cbm: number;
          total_weight_kg: number;
          total_cbm: number;
          rotation_allowed: boolean;
          rotation_modes: Json;
          stackable: boolean;
          max_stack_layers: number | null;
          fragile: boolean;
          mixable: boolean;
          must_same_container: boolean;
          manual_lock_container_key: string | null;
          preferred_container_type: string | null;
          forbidden_container_types: Json;
          must_near_door: boolean;
          must_bottom: boolean;
          must_top: boolean;
          loading_priority: number;
          unloading_priority: number;
          item_status: string;
          manual_override_flag: boolean;
          constraint_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['loading_pool_items']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['loading_pool_items']['Insert']>;
      };
      container_type_specs: {
        Row: {
          id: string;
          container_type_code: string;
          container_type_name: string;
          inner_length_cm: number;
          inner_width_cm: number;
          inner_height_cm: number;
          door_width_cm: number | null;
          door_height_cm: number | null;
          max_payload_kg: number;
          max_volume_cbm: number;
          tare_weight_kg: number | null;
          usable_volume_ratio: number;
          usable_weight_ratio: number;
          default_for_export: boolean;
          status: string;
          remarks: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['container_type_specs']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['container_type_specs']['Insert']>;
      };
      container_loading_solutions: {
        Row: {
          id: string;
          solution_no: string;
          pool_id: string;
          planning_mode: string;
          solution_status: string;
          is_baseline: boolean;
          parent_solution_id: string | null;
          version_no: number;
          algorithm_version: string | null;
          estimation_summary: Json;
          recommended_container_mix: Json;
          utilization_summary: Json;
          risk_summary: Json;
          total_weight_kg: number;
          total_cbm: number;
          total_cartons: number;
          container_count: number;
          manual_adjustment_count: number;
          confirmed_at: string | null;
          confirmed_by: string | null;
          executed_at: string | null;
          executed_by: string | null;
          remarks: string | null;
          created_by: string | null;
          approved_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['container_loading_solutions']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['container_loading_solutions']['Insert']>;
      };
      container_loading_solution_containers: {
        Row: {
          id: string;
          solution_id: string;
          container_index: number;
          planned_container_no: string | null;
          actual_container_no: string | null;
          container_type_spec_id: string | null;
          container_type_code: string;
          door_side: string;
          planning_status: string;
          manual_locked: boolean;
          planned_weight_kg: number;
          planned_cbm: number;
          planned_cartons: number;
          weight_utilization: number;
          volume_utilization: number;
          supplier_grouping_score: number;
          loading_risk_score: number;
          unloading_risk_score: number;
          weight_risk: Json;
          volume_risk: Json;
          stacking_risk: Json;
          fragile_risk: Json;
          unloading_risk: Json;
          grouping_risk: Json;
          near_door_item_count: number;
          blocked_access_risk: Json;
          planned_loading_sequence_summary: Json;
          actual_weight_kg: number;
          actual_cbm: number;
          actual_cartons: number;
          actual_seal_no: string | null;
          variance_flag: boolean;
          variance_reason: string | null;
          manual_adjustment_notes: string | null;
          executed_at: string | null;
          executed_by: string | null;
          remarks: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['container_loading_solution_containers']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['container_loading_solution_containers']['Insert']>;
      };
      container_loading_solution_items: {
        Row: {
          id: string;
          solution_container_id: string;
          pool_item_id: string;
          line_no: number;
          item_seq: number;
          sales_contract_id: string | null;
          purchase_order_id: string | null;
          order_id: string | null;
          order_no: string | null;
          customer_id: string | null;
          customer_name: string | null;
          supplier_id: string | null;
          supplier_name: string | null;
          shipment_batch_no: string | null;
          shipment_split_no: string | null;
          sku_id: string | null;
          sku_code: string | null;
          product_name: string;
          model_no: string | null;
          category_code: string | null;
          cargo_category: string | null;
          packaging_unit_type: string;
          is_palletized: boolean;
          units_per_handling_group: number;
          planned_carton_count: number;
          planned_quantity: number;
          planned_weight_kg: number;
          planned_cbm: number;
          actual_carton_count: number;
          actual_quantity: number;
          actual_weight_kg: number;
          actual_cbm: number;
          must_same_container: boolean;
          mixable: boolean;
          loading_priority: number;
          unloading_priority: number;
          fragile: boolean;
          stackable: boolean;
          max_stack_layers: number | null;
          rotation_allowed: boolean;
          rotation_modes: Json;
          preferred_container_type: string | null;
          forbidden_container_types: Json;
          must_near_door: boolean;
          must_bottom: boolean;
          must_top: boolean;
          near_door_flag: boolean;
          blocked_access_risk: Json;
          allocation_status: string;
          manual_override_flag: boolean;
          manual_override_reason: string | null;
          variance_flag: boolean;
          variance_reason: string | null;
          remarks: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['container_loading_solution_items']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['container_loading_solution_items']['Insert']>;
      };
      container_loading_placements: {
        Row: {
          id: string;
          solution_container_id: string;
          solution_item_id: string;
          placement_unit_no: string;
          carton_serial_no: string | null;
          packaging_unit_type: string;
          is_palletized: boolean;
          units_per_handling_group: number;
          handling_group_no: string | null;
          x_cm: number;
          y_cm: number;
          z_cm: number;
          length_cm: number;
          width_cm: number;
          height_cm: number;
          weight_kg: number;
          cbm: number;
          rotation_mode: string;
          layer_index: number;
          face_to_door: boolean;
          near_door_flag: boolean;
          loading_sequence: number;
          unloading_sequence: number;
          placement_status: string;
          blocked_access_risk: Json;
          fragile_risk: Json;
          is_manual_adjusted: boolean;
          manual_adjustment_reason: string | null;
          remarks: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['container_loading_placements']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['container_loading_placements']['Insert']>;
      };
      container_load_plans: {
        Row: {
          id: string;
          load_plan_no: string;
          shipment_no: string | null;
          sales_contract_id: string | null;
          status: string;
          container_type: string;
          container_count: number;
          loading_mode: string | null;
          consolidation_mode: string | null;
          port_of_loading: string | null;
          port_of_destination: string | null;
          forwarder_id: string | null;
          truck_company_id: string | null;
          customs_broker_id: string | null;
          planned_etd: string | null;
          booking_cutoff_at: string | null;
          planned_customs_cutoff_at: string | null;
          planned_loading_date: string | null;
          seal_required: boolean;
          final_seal_no: string | null;
          remarks: string | null;
          created_at: string;
          updated_at: string;
          loading_pool_id: string | null;
          solution_id: string | null;
          solution_container_id: string | null;
        };
        Insert: Omit<Database['public']['Tables']['container_load_plans']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['container_load_plans']['Insert']>;
      };
      loading_tasks: {
        Row: {
          id: string;
          loading_task_no: string;
          load_plan_id: string;
          sequence_no: number;
          task_status: string;
          loading_point_type: string | null;
          loading_point_id: string | null;
          loading_point_name: string | null;
          truck_company_id: string | null;
          container_no: string | null;
          seal_status: string;
          seal_no: string | null;
          driver_name: string | null;
          driver_phone: string | null;
          vehicle_no: string | null;
          supervisor_name: string | null;
          scheduled_arrival_at: string | null;
          actual_arrival_at: string | null;
          loading_start_at: string | null;
          loading_finish_at: string | null;
          departed_at: string | null;
          loaded_packages: number;
          loaded_quantity: number;
          loaded_weight: number;
          loaded_cbm: number;
          container_condition_ok: boolean | null;
          container_clean_ok: boolean | null;
          container_dry_ok: boolean | null;
          odor_check_ok: boolean | null;
          door_lock_ok: boolean | null;
          floor_check_ok: boolean | null;
          empty_container_photos: Json;
          half_loaded_inner_photos: Json;
          full_loaded_both_doors_open_photos: Json;
          left_door_open_photos: Json;
          both_doors_closed_photos: Json;
          remarks: string | null;
          created_at: string;
          updated_at: string;
          solution_id: string | null;
          solution_container_id: string | null;
        };
        Insert: Omit<Database['public']['Tables']['loading_tasks']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['loading_tasks']['Insert']>;
      };
      loading_task_items: {
        Row: {
          id: string;
          loading_task_id: string;
          cargo_lot_id: string | null;
          loaded_packages: number;
          loaded_quantity: number;
          remarks: string | null;
          created_at: string;
          solution_item_id: string | null;
        };
        Insert: Omit<Database['public']['Tables']['loading_task_items']['Row'], 'created_at'> & {
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['loading_task_items']['Insert']>;
      };
      accounts_receivable: {
        Row: {
          id: string;
          ar_number: string;
          order_number: string;
          quotation_number: string | null;
          contract_number: string | null;
          customer_name: string;
          customer_email: string;
          region: string | null;
          invoice_date: string;
          due_date: string;
          total_amount: number;
          paid_amount: number;
          remaining_amount: number;
          currency: string;
          credit_limit_usd: number | null;
          overdue_risk_level: string | null;
          credit_release_approved_by: string | null;
          status: string;
          payment_terms: string | null;
          products: Json;
          payment_history: Json;
          deposit_proof: Json | null;
          deposit_receipt_proof: Json | null;
          balance_proof: Json | null;
          balance_receipt_proof: Json | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['accounts_receivable']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['accounts_receivable']['Insert']>;
      };
      sales_quotations: {
        Row: {
          id: string;
          quotation_number: string;
          inquiry_number: string | null;
          customer_name: string;
          customer_email: string;
          customer_company: string | null;
          sales_person: string | null;
          sales_person_name: string | null;
          supervisor: string | null;
          region: string | null;
          products: Json;
          total_amount: number;
          currency: string;
          price_type: string | null;
          profit_margin: number | null;
          payment_terms: string | null;
          payment_mode: string | null;
          balance_trigger: string | null;
          qt_type: string | null;
          special_price_flag: boolean;
          special_price_reason: string | null;
          special_payment_terms_flag: boolean;
          strategic_customer_flag: boolean;
          qt_last_approval_at: string | null;
          delivery_time: string | null;
          validity_period: string | null;
          status: string;
          approval_status: string | null;
          sent_to_customer: boolean;
          customer_response: string | null;
          customer_decline_reason: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          sent_at: string | null;
          responded_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['sales_quotations']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['sales_quotations']['Insert']>;
      };
      inquiries: {
        Row: {
          id: string;
          inquiry_number: string;
          user_email: string;
          date: string | null;
          buyer_name: string | null;
          buyer_company: string | null;
          buyer_country: string | null;
          company_id: string | null;
          region_code: string | null;
          products: Json;
          status: string;
          is_submitted: boolean | null;
          total_price: number | null;
          message: string | null;
          notes: string | null;
          assigned_to: string | null;
          buyer_info: Json | null;
          shipping_info: Json | null;
          container_info: Json | null;
          submitted_at: string | null;
          template_id: string | null;
          template_version_id: string | null;
          template_snapshot: Json | null;
          document_data_snapshot: Json | null;
          document_render_meta: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['inquiries']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['inquiries']['Insert']>;
      };
      product_main_categories: {
        Row: {
          id: string;
          name: string;
          icon: string | null;
          description: string | null;
          sort_order: number | null;
          region_code: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['product_main_categories']['Row'], 'created_at'> & {
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['product_main_categories']['Insert']>;
      };
      product_sub_categories: {
        Row: {
          id: string;
          main_category_id: string;
          name: string;
          description: string | null;
          sort_order: number | null;
          region_code: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['product_sub_categories']['Row'], 'created_at'> & {
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['product_sub_categories']['Insert']>;
      };
      product_categories: {
        Row: {
          id: string;
          sub_category_id: string;
          name: string;
          description: string | null;
          sort_order: number | null;
          region_code: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['product_categories']['Row'], 'created_at'> & {
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['product_categories']['Insert']>;
      };
      products: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          model: string | null;
          image: string | null;
          price: number | null;
          net_weight: number | null;
          gross_weight: number | null;
          units_per_carton: number | null;
          carton_length: number | null;
          carton_width: number | null;
          carton_height: number | null;
          carton_net_weight: number | null;
          carton_gross_weight: number | null;
          specifications: Json | null;
          region_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
      };
      supplier_quotations: {
        Row: {
          id: string;
          quotation_number: string | null;
          supplier_code: string | null;
          supplier_name: string | null;
          supplier_email: string;
          source_xj_number: string | null;
          source_xj_id: string | null;
          region_code: string | null;
          products: Json;
          total_amount: number;
          currency: string;
          valid_until: string | null;
          status: string;
          notes: string | null;
          created_by: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
          bj_number: string | null;
          display_number: string | null;
          source_doc_id: string | null;
          sales_contract_id: string | null;
          root_sales_contract_id: string | null;
        };
        Insert: Omit<Database['public']['Tables']['supplier_quotations']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['supplier_quotations']['Insert']>;
      };
      approval_records: {
        Row: {
          id: string;
          record_type: 'sales_quotation' | 'sales_contract' | 'purchase_order';
          reference_id: string;
          reference_number: string;
          title: string;
          description: string | null;
          requested_by: string;
          requested_by_name: string | null;
          approver: string;
          status: 'pending' | 'approved' | 'rejected';
          notes: string | null;
          created_at: string;
          updated_at: string;
          approved_at: string | null;
        };
        Insert: Omit<Database['public']['Tables']['approval_records']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['approval_records']['Insert']>;
      };
      notifications: {
        Row: {
          id: string;
          recipient_email: string;
          title: string;
          message: string;
          type: string;
          reference_id: string | null;
          reference_type: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'created_at'> & {
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
      };

      // ─── 采购流转表 ──────────────────────────────────────────────────────────
      supplier_xjs: {
        Row: {
          id: string;
          tenant_id: string;
          xj_number: string;
          supplier_xj_no: string | null;
          supplier_quotation_no: string | null;
          source_qr_number: string | null;
          source_inquiry_id: string | null;
          source_inquiry_number: string | null;
          requirement_no: string | null;
          region_code: string | null;
          customer_name: string | null;
          customer_region: string | null;
          supplier_company_id: string | null;
          supplier_code: string;
          supplier_name: string;
          supplier_contact: string | null;
          supplier_email: string;
          products: Json;
          product_name: string | null;
          model_no: string | null;
          specification: string | null;
          quantity: number | null;
          unit: string | null;
          target_price: number | null;
          currency: string;
          expected_date: string | null;
          quotation_deadline: string | null;
          due_date: string | null;
          priority: string;
          status: string;
          quotes: Json;
          document_data: Json | null;
          remarks: string | null;
          created_by: string;
          created_by_uid: string | null;
          source_ref: string | null;
          display_number: string | null;
          source_doc_id: string | null;
          sales_contract_id: string | null;
          root_sales_contract_id: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
          updated_by: string | null;
          updated_date: string | null;
        };
        Insert: Omit<Database['public']['Tables']['supplier_xjs']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['supplier_xjs']['Insert']>;
      };

      purchase_requirements: {
        Row: {
          id: string;
          tenant_id: string | null;
          requirement_no: string | null;
          source_inquiry_number: string | null;
          source_so_number: string | null;
          region: string | null;
          urgency: string | null;
          required_date: string | null;
          items: Json;
          status: string;
          notes: string | null;
          created_by: string | null;
          assigned_to: string | null;
          qr_number: string | null;
          display_number: string | null;
          source_doc_id: string | null;
          sales_contract_id: string | null;
          root_sales_contract_id: string | null;
          customer_info: Json | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['purchase_requirements']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['purchase_requirements']['Insert']>;
      };

      companies: {
        Row: {
          id: string;
          tenant_id: string;
          party_type: 'customer' | 'supplier' | 'partner';
          code: string | null;
          name: string;
          name_en: string | null;
          name_cn: string | null;
          short_name: string | null;
          country: string | null;
          state_province: string | null;
          city: string | null;
          region: string | null;
          address: string | null;
          postal_code: string | null;
          website: string | null;
          main_email: string;
          main_phone: string | null;
          logo_url: string | null;
          industry: string | null;
          business_types: string[];
          currency: string;
          customer_level: string | null;
          customer_source: string | null;
          assigned_to: string | null;
          supplier_level: string | null;
          supplier_category: string | null;
          certifications: string[];
          production_capacity: string | null;
          on_time_rate: number | null;
          quality_rate: number | null;
          cooperation_years: number;
          bg_checked: boolean;
          bg_data: Json;
          linked_user_id: string | null;
          status: string;
          notes: string | null;
          deleted_at: string | null;
          created_at: string;
          created_by: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: Omit<Database['public']['Tables']['companies']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['companies']['Insert']>;
      };

      customer_organizations: {
        Row: {
          id: string;
          auth_user_id: string;
          company_name: string;
          contact_person: string;
          email: string;
          phone: string;
          mobile: string;
          address: string;
          website: string;
          business_type: string;
          logo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['customer_organizations']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['customer_organizations']['Insert']>;
      };

      customer_portal_profiles: {
        Row: {
          id: string;
          auth_user_id: string;
          display_name: string;
          login_email: string;
          portal_role: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['customer_portal_profiles']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['customer_portal_profiles']['Insert']>;
      };

      customer_enterprise_members: {
        Row: {
          id: string;
          enterprise_auth_user_id: string;
          linked_auth_user_id: string | null;
          name: string;
          title: string;
          business_email: string;
          login_email: string;
          role: string;
          status: string;
          can_login: boolean;
          last_login_at: string;
          permissions: any;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['customer_enterprise_members']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['customer_enterprise_members']['Insert']>;
      };

      customer_enterprise_invitations: {
        Row: {
          id: string;
          enterprise_auth_user_id: string;
          member_id: string;
          login_email: string;
          business_email: string;
          role: string;
          status: string;
          invite_token: string;
          invited_by_email: string;
          invite_url: string;
          expires_at: string | null;
          last_sent_at: string | null;
          accepted_at: string | null;
          linked_auth_user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['customer_enterprise_invitations']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['customer_enterprise_invitations']['Insert']>;
      };

      number_sequences: {
        Row: {
          id: string;
          doc_type: string;
          scope_type: string;
          scope_id: string;
          last_seq: number;
          prefix: string | null;
          region_code: string | null;
          date_key: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['number_sequences']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['number_sequences']['Insert']>;
      };

      supplier_organizations: {
        Row: {
          id: string;
          auth_user_id: string;
          name_cn: string;
          name_en: string;
          description: string;
          phone: string;
          address: string;
          website: string;
          contact_person: string;
          logo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['supplier_organizations']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['supplier_organizations']['Insert']>;
      };

      supplier_portal_profiles: {
        Row: {
          id: string;
          auth_user_id: string;
          display_name: string;
          login_email: string;
          portal_role: string;
          role_label: string;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['supplier_portal_profiles']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['supplier_portal_profiles']['Insert']>;
      };

      user_profiles: {
        Row: {
          id: string;
          email: string | null;
          name: string | null;
          portal_role: string | null;
          rbac_role: string | null;
          region: string | null;
          company: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_profiles']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['user_profiles']['Insert']>;
      };
    };
    Views: {};
    Functions: {
      next_number_ex: {
        Args: {
          p_doc_type: string;
          p_scope_type: string;
          p_scope_id: string;
          p_customer_id?: string | null;
        };
        Returns: string;
      };
      next_inquiry_number: {
        Args: {
          p_region_code: string;
          p_customer_id?: string | null;
        };
        Returns: string;
      };
    };
    Enums: {
      party_type: 'customer' | 'supplier' | 'partner';
      xj_status: 'pending' | 'sent' | 'quoted' | 'cancelled' | 'completed';
    };
  };
}
