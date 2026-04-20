export type UserRole = "superadmin" | "member";
export type SubscriptionStatus = "active" | "expired" | "blocked" | "pending_payment";
export type PlanType = "monthly" | "semester" | "yearly";
export type NotificationType = "success" | "error" | "info" | "warning";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          phone: string | null;
          role: UserRole;
          qr_code: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          phone?: string | null;
          role?: UserRole;
          qr_code: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          start_date: string;
          end_date: string;
          status: SubscriptionStatus;
          plan_type: PlanType;
          amount_paid: number;
          remaining_balance: number;
          promo_code_id: string | null;
          payment_date: string | null;
          payment_request_date: string | null;
          receipt_number: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          start_date: string;
          end_date: string;
          status?: SubscriptionStatus;
          plan_type: PlanType;
          amount_paid: number;
          remaining_balance?: number;
          promo_code_id?: string | null;
          payment_date?: string | null;
          payment_request_date?: string | null;
          receipt_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>;
      };
      attendances: {
        Row: {
          id: string;
          user_id: string;
          check_in_date: string;
          validated_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          check_in_date?: string;
          validated_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["attendances"]["Insert"]>;
      };
      promotions: {
        Row: {
          id: string;
          code: string;
          discount_percent: number;
          valid_until: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          discount_percent: number;
          valid_until: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["promotions"]["Insert"]>;
      };
      payment_transactions: {
        Row: {
          id: string;
          user_id: string;
          subscription_id: string;
          amount: number;
          payment_date: string;
          receipt_number: string;
          validated_by: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subscription_id: string;
          amount: number;
          payment_date?: string;
          receipt_number: string;
          validated_by?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payment_transactions"]["Insert"]>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string | null;
          title: string;
          message: string;
          type: NotificationType;
          metadata: Json | null;
          is_read: boolean;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          title: string;
          message: string;
          type?: NotificationType;
          metadata?: Json | null;
          is_read?: boolean;
          read_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
      };
      audit_log: {
        Row: {
          id: string;
          entity_type: string;
          entity_id: string;
          action: string;
          details: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          entity_type: string;
          entity_id: string;
          action: string;
          details?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_log"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      generate_receipt_number: {
        Args: Record<string, never>;
        Returns: string;
      };
    };
    Enums: {
      notification_type: NotificationType;
    };
    CompositeTypes: Record<string, never>;
  };
}
