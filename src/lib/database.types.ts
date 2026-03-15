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
          status: string;
          payment_terms: string | null;
          products: Json;
          payment_history: Json;
          deposit_proof: Json | null;
          balance_proof: Json | null;
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
