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
          buyer_name: string | null;
          buyer_company: string | null;
          buyer_country: string | null;
          products: Json;
          status: string;
          notes: string | null;
          assigned_to: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['inquiries']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['inquiries']['Insert']>;
      };
      supplier_quotations: {
        Row: {
          id: string;
          rfq_id: string | null;
          rfq_number: string | null;
          supplier_email: string;
          supplier_name: string | null;
          products: Json;
          total_amount: number;
          currency: string;
          price_type: string | null;
          payment_terms: string | null;
          delivery_time: string | null;
          validity_period: string | null;
          status: string;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
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
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}
