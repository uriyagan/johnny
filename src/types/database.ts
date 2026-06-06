/**
 * Typed schema for the Johnny Supabase database.
 *
 * Hand-authored to match supabase/migrations/0001_init.sql + 0002_storage.sql
 * (the live schema). Once Docker/Supabase CLI is available locally, this can be
 * regenerated 1:1 with:  npm run db:types
 */

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
      profiles: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["user_role"];
          full_name: string | null;
          business_name: string | null;
          phone: string | null;
          locale: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: Database["public"]["Enums"]["user_role"];
          full_name?: string | null;
          business_name?: string | null;
          phone?: string | null;
          locale?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: Database["public"]["Enums"]["user_role"];
          full_name?: string | null;
          business_name?: string | null;
          phone?: string | null;
          locale?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          tier: Database["public"]["Enums"]["subscription_tier"];
          status: Database["public"]["Enums"]["subscription_status"];
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          tier?: Database["public"]["Enums"]["subscription_tier"];
          status?: Database["public"]["Enums"]["subscription_status"];
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          tier?: Database["public"]["Enums"]["subscription_tier"];
          status?: Database["public"]["Enums"]["subscription_status"];
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ad_accounts: {
        Row: {
          id: string;
          user_id: string;
          provider: Database["public"]["Enums"]["ad_provider"];
          external_account_id: string;
          name: string | null;
          status: Database["public"]["Enums"]["ad_account_status"];
          access_token_secret_id: string | null;
          token_expires_at: string | null;
          metadata: Json;
          connected_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider?: Database["public"]["Enums"]["ad_provider"];
          external_account_id: string;
          name?: string | null;
          status?: Database["public"]["Enums"]["ad_account_status"];
          access_token_secret_id?: string | null;
          token_expires_at?: string | null;
          metadata?: Json;
          connected_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          provider?: Database["public"]["Enums"]["ad_provider"];
          external_account_id?: string;
          name?: string | null;
          status?: Database["public"]["Enums"]["ad_account_status"];
          access_token_secret_id?: string | null;
          token_expires_at?: string | null;
          metadata?: Json;
          connected_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      campaigns: {
        Row: {
          id: string;
          ad_account_id: string;
          external_campaign_id: string | null;
          name: string;
          status: Database["public"]["Enums"]["campaign_status"];
          objective: string | null;
          daily_budget: number | null;
          lifetime_budget: number | null;
          spend_to_date: number;
          currency: string;
          rejection_reason: string | null;
          rejection_reason_he: string | null;
          last_synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ad_account_id: string;
          external_campaign_id?: string | null;
          name: string;
          status?: Database["public"]["Enums"]["campaign_status"];
          objective?: string | null;
          daily_budget?: number | null;
          lifetime_budget?: number | null;
          spend_to_date?: number;
          currency?: string;
          rejection_reason?: string | null;
          rejection_reason_he?: string | null;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          ad_account_id?: string;
          external_campaign_id?: string | null;
          name?: string;
          status?: Database["public"]["Enums"]["campaign_status"];
          objective?: string | null;
          daily_budget?: number | null;
          lifetime_budget?: number | null;
          spend_to_date?: number;
          currency?: string;
          rejection_reason?: string | null;
          rejection_reason_he?: string | null;
          last_synced_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      budget_caps: {
        Row: {
          id: string;
          user_id: string;
          ad_account_id: string | null;
          monthly_cap_ils: number;
          spend_current_period: number;
          threshold_pct: number;
          hard_pause_enabled: boolean;
          period_start: string;
          period_end: string;
          triggered_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          ad_account_id?: string | null;
          monthly_cap_ils: number;
          spend_current_period?: number;
          threshold_pct?: number;
          hard_pause_enabled?: boolean;
          period_start: string;
          period_end: string;
          triggered_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          ad_account_id?: string | null;
          monthly_cap_ils?: number;
          spend_current_period?: number;
          threshold_pct?: number;
          hard_pause_enabled?: boolean;
          period_start?: string;
          period_end?: string;
          triggered_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      chat_sessions: {
        Row: {
          id: string;
          user_id: string;
          title: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      chat_messages: {
        Row: {
          id: string;
          session_id: string;
          role: Database["public"]["Enums"]["message_role"];
          content: string;
          intent: Json | null;
          model: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          role: Database["public"]["Enums"]["message_role"];
          content: string;
          intent?: Json | null;
          model?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          role?: Database["public"]["Enums"]["message_role"];
          content?: string;
          intent?: Json | null;
          model?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      assets: {
        Row: {
          id: string;
          user_id: string;
          storage_path: string;
          original_filename: string | null;
          mime_type: string | null;
          kind: Database["public"]["Enums"]["asset_kind"];
          status: Database["public"]["Enums"]["asset_status"];
          ai_analysis: Json | null;
          generated_copy: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          storage_path: string;
          original_filename?: string | null;
          mime_type?: string | null;
          kind?: Database["public"]["Enums"]["asset_kind"];
          status?: Database["public"]["Enums"]["asset_status"];
          ai_analysis?: Json | null;
          generated_copy?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          storage_path?: string;
          original_filename?: string | null;
          mime_type?: string | null;
          kind?: Database["public"]["Enums"]["asset_kind"];
          status?: Database["public"]["Enums"]["asset_status"];
          ai_analysis?: Json | null;
          generated_copy?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      crm_feedback: {
        Row: {
          id: string;
          user_id: string;
          session_id: string | null;
          question: string | null;
          response_text: string | null;
          gemini_analysis: Json | null;
          applied_adjustments: Json | null;
          scheduled_for: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id?: string | null;
          question?: string | null;
          response_text?: string | null;
          gemini_analysis?: Json | null;
          applied_adjustments?: Json | null;
          scheduled_for?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          session_id?: string | null;
          question?: string | null;
          response_text?: string | null;
          gemini_analysis?: Json | null;
          applied_adjustments?: Json | null;
          scheduled_for?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: Database["public"]["Enums"]["notification_type"];
          channel: Database["public"]["Enums"]["notification_channel"];
          title: string;
          body: string | null;
          metadata: Json;
          read_at: string | null;
          sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: Database["public"]["Enums"]["notification_type"];
          channel?: Database["public"]["Enums"]["notification_channel"];
          title: string;
          body?: string | null;
          metadata?: Json;
          read_at?: string | null;
          sent_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: Database["public"]["Enums"]["notification_type"];
          channel?: Database["public"]["Enums"]["notification_channel"];
          title?: string;
          body?: string | null;
          metadata?: Json;
          read_at?: string | null;
          sent_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      webhook_events: {
        Row: {
          id: string;
          source: Database["public"]["Enums"]["webhook_source"];
          event_type: string;
          external_event_id: string;
          payload: Json;
          status: Database["public"]["Enums"]["webhook_status"];
          error: string | null;
          processed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          source: Database["public"]["Enums"]["webhook_source"];
          event_type: string;
          external_event_id: string;
          payload: Json;
          status?: Database["public"]["Enums"]["webhook_status"];
          error?: string | null;
          processed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          source?: Database["public"]["Enums"]["webhook_source"];
          event_type?: string;
          external_event_id?: string;
          payload?: Json;
          status?: Database["public"]["Enums"]["webhook_status"];
          error?: string | null;
          processed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      email_automations: {
        Row: {
          id: string;
          trigger_key: string;
          enabled: boolean;
          subject: string;
          body_html: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trigger_key: string;
          enabled?: boolean;
          subject: string;
          body_html: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trigger_key?: string;
          enabled?: boolean;
          subject?: string;
          body_html?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      email_send_log: {
        Row: {
          id: string;
          trigger_key: string;
          recipient: string;
          status: string;
          error: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          trigger_key: string;
          recipient: string;
          status: string;
          error?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          trigger_key?: string;
          recipient?: string;
          status?: string;
          error?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      api_usage: {
        Row: {
          id: string;
          provider: Database["public"]["Enums"]["usage_provider"];
          operation: string;
          user_id: string | null;
          tokens_in: number;
          tokens_out: number;
          cost_usd: number;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          provider: Database["public"]["Enums"]["usage_provider"];
          operation: string;
          user_id?: string | null;
          tokens_in?: number;
          tokens_out?: number;
          cost_usd?: number;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          provider?: Database["public"]["Enums"]["usage_provider"];
          operation?: string;
          user_id?: string | null;
          tokens_in?: number;
          tokens_out?: number;
          cost_usd?: number;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      tickets: {
        Row: {
          id: string;
          user_id: string;
          subject: string;
          status: Database["public"]["Enums"]["ticket_status"];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          subject: string;
          status?: Database["public"]["Enums"]["ticket_status"];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          subject?: string;
          status?: Database["public"]["Enums"]["ticket_status"];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ticket_messages: {
        Row: {
          id: string;
          ticket_id: string;
          sender_id: string | null;
          from_admin: boolean;
          body: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          ticket_id: string;
          sender_id?: string | null;
          from_admin?: boolean;
          body: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          ticket_id?: string;
          sender_id?: string | null;
          from_admin?: boolean;
          body?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      recommendation_dismissals: {
        Row: {
          id: string;
          user_id: string;
          rec_key: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          rec_key: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          rec_key?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      business_profiles: {
        Row: {
          user_id: string;
          business_name: string | null;
          industry: string | null;
          description: string | null;
          products_services: string | null;
          target_audience: string | null;
          brand_voice: string | null;
          brand_colors: string | null;
          logo_path: string | null;
          website: string | null;
          instagram_handle: string | null;
          extra: Json;
          completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          business_name?: string | null;
          industry?: string | null;
          description?: string | null;
          products_services?: string | null;
          target_audience?: string | null;
          brand_voice?: string | null;
          brand_colors?: string | null;
          logo_path?: string | null;
          website?: string | null;
          instagram_handle?: string | null;
          extra?: Json;
          completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          business_name?: string | null;
          industry?: string | null;
          description?: string | null;
          products_services?: string | null;
          target_audience?: string | null;
          brand_voice?: string | null;
          brand_colors?: string | null;
          logo_path?: string | null;
          website?: string | null;
          instagram_handle?: string | null;
          extra?: Json;
          completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      app_errors: {
        Row: {
          id: string;
          source: Database["public"]["Enums"]["error_source"];
          severity: Database["public"]["Enums"]["error_severity"];
          message: string;
          stack: string | null;
          route: string | null;
          user_id: string | null;
          user_agent: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          source?: Database["public"]["Enums"]["error_source"];
          severity?: Database["public"]["Enums"]["error_severity"];
          message: string;
          stack?: string | null;
          route?: string | null;
          user_id?: string | null;
          user_agent?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          source?: Database["public"]["Enums"]["error_source"];
          severity?: Database["public"]["Enums"]["error_severity"];
          message?: string;
          stack?: string | null;
          route?: string | null;
          user_id?: string | null;
          user_agent?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      admin_audit_log: {
        Row: {
          id: string;
          admin_id: string;
          action: string;
          target_user_id: string | null;
          details: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id: string;
          action: string;
          target_user_id?: string | null;
          details?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          admin_id?: string;
          action?: string;
          target_user_id?: string | null;
          details?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      api_health: {
        Row: {
          id: string;
          provider: Database["public"]["Enums"]["health_provider"];
          status: Database["public"]["Enums"]["health_status"];
          latency_ms: number | null;
          details: Json;
          checked_at: string;
        };
        Insert: {
          id?: string;
          provider: Database["public"]["Enums"]["health_provider"];
          status: Database["public"]["Enums"]["health_status"];
          latency_ms?: number | null;
          details?: Json;
          checked_at?: string;
        };
        Update: {
          id?: string;
          provider?: Database["public"]["Enums"]["health_provider"];
          status?: Database["public"]["Enums"]["health_status"];
          latency_ms?: number | null;
          details?: Json;
          checked_at?: string;
        };
        Relationships: [];
      };
      meta_connections: {
        Row: {
          user_id: string;
          access_token_enc: string;
          token_expires_at: string | null;
          scopes: string | null;
          meta_user_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          access_token_enc: string;
          token_expires_at?: string | null;
          scopes?: string | null;
          meta_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          access_token_enc?: string;
          token_expires_at?: string | null;
          scopes?: string | null;
          meta_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      kill_switches: {
        Row: {
          id: string;
          scope: Database["public"]["Enums"]["killswitch_scope"];
          type: Database["public"]["Enums"]["killswitch_type"];
          target_user_id: string | null;
          enabled: boolean;
          reason: string | null;
          set_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          scope: Database["public"]["Enums"]["killswitch_scope"];
          type: Database["public"]["Enums"]["killswitch_type"];
          target_user_id?: string | null;
          enabled?: boolean;
          reason?: string | null;
          set_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          scope?: Database["public"]["Enums"]["killswitch_scope"];
          type?: Database["public"]["Enums"]["killswitch_type"];
          target_user_id?: string | null;
          enabled?: boolean;
          reason?: string | null;
          set_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: {
        Args: Record<string, never>;
        Returns: boolean;
      };
      tier_account_limit: {
        Args: { t: Database["public"]["Enums"]["subscription_tier"] };
        Returns: number | null;
      };
    };
    Enums: {
      user_role: "client" | "admin";
      error_source: "client" | "server";
      error_severity: "warning" | "error" | "fatal";
      ticket_status: "open" | "answered" | "closed";
      usage_provider: "gemini" | "meta" | "resend" | "stripe";
      subscription_tier: "tier_1" | "tier_2" | "tier_3" | "tier_4";
      subscription_status:
        | "trialing"
        | "active"
        | "past_due"
        | "canceled"
        | "incomplete"
        | "incomplete_expired"
        | "unpaid";
      ad_provider: "meta";
      ad_account_status: "pending" | "connected" | "disconnected" | "error";
      campaign_status:
        | "draft"
        | "active"
        | "paused"
        | "archived"
        | "in_review"
        | "rejected";
      message_role: "user" | "assistant" | "system";
      asset_kind: "image" | "video" | "document";
      asset_status: "uploaded" | "analyzing" | "ready" | "error";
      notification_type:
        | "budget_warning"
        | "budget_paused"
        | "policy_rejected"
        | "recap_daily"
        | "recap_weekly"
        | "crm_checkin"
        | "system";
      notification_channel: "in_app" | "email";
      webhook_source: "stripe" | "meta";
      webhook_status: "pending" | "processed" | "failed" | "skipped";
      health_provider: "meta" | "stripe" | "gemini" | "resend" | "supabase";
      health_status: "healthy" | "degraded" | "down";
      killswitch_scope: "global" | "user";
      killswitch_type: "api_execution" | "spending";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

/** Convenience row-type helpers. */
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> =
  Database["public"]["Enums"][T];
