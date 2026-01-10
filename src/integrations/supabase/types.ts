export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      agent_performance: {
        Row: {
          agent_id: string
          created_at: string | null
          id: string
          metadata: Json | null
          performance_score: number | null
          period_end: string
          period_start: string
          tasks_completed: number | null
          tasks_failed: number | null
          total_cost: number | null
          total_revenue: number | null
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          performance_score?: number | null
          period_end: string
          period_start: string
          tasks_completed?: number | null
          tasks_failed?: number | null
          total_cost?: number | null
          total_revenue?: number | null
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          performance_score?: number | null
          period_end?: string
          period_start?: string
          tasks_completed?: number | null
          tasks_failed?: number | null
          total_cost?: number | null
          total_revenue?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_performance_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "autonomous_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      api_products: {
        Row: {
          active_consumers: number | null
          api_endpoint: string
          auth_credentials: Json | null
          auth_method: Database["public"]["Enums"]["auth_method"] | null
          categories: string[] | null
          created_at: string | null
          description: string | null
          documentation_url: string | null
          failed_calls: number | null
          id: string
          is_active: boolean | null
          is_public: boolean | null
          metadata: Json | null
          monthly_call_limit: number | null
          monthly_subscription_price: number | null
          name: string
          price_model: Database["public"]["Enums"]["price_model"]
          price_per_call: number | null
          rate_limit_per_hour: number | null
          rate_limit_per_minute: number | null
          request_body_template: Json | null
          request_headers: Json | null
          request_method: string | null
          requires_approval: boolean | null
          response_format: string | null
          seller_id: string
          successful_calls: number | null
          tags: string[] | null
          tier_pricing: Json | null
          total_calls: number | null
          total_revenue: number | null
          updated_at: string | null
        }
        Insert: {
          active_consumers?: number | null
          api_endpoint: string
          auth_credentials?: Json | null
          auth_method?: Database["public"]["Enums"]["auth_method"] | null
          categories?: string[] | null
          created_at?: string | null
          description?: string | null
          documentation_url?: string | null
          failed_calls?: number | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          metadata?: Json | null
          monthly_call_limit?: number | null
          monthly_subscription_price?: number | null
          name: string
          price_model?: Database["public"]["Enums"]["price_model"]
          price_per_call?: number | null
          rate_limit_per_hour?: number | null
          rate_limit_per_minute?: number | null
          request_body_template?: Json | null
          request_headers?: Json | null
          request_method?: string | null
          requires_approval?: boolean | null
          response_format?: string | null
          seller_id: string
          successful_calls?: number | null
          tags?: string[] | null
          tier_pricing?: Json | null
          total_calls?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Update: {
          active_consumers?: number | null
          api_endpoint?: string
          auth_credentials?: Json | null
          auth_method?: Database["public"]["Enums"]["auth_method"] | null
          categories?: string[] | null
          created_at?: string | null
          description?: string | null
          documentation_url?: string | null
          failed_calls?: number | null
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          metadata?: Json | null
          monthly_call_limit?: number | null
          monthly_subscription_price?: number | null
          name?: string
          price_model?: Database["public"]["Enums"]["price_model"]
          price_per_call?: number | null
          rate_limit_per_hour?: number | null
          rate_limit_per_minute?: number | null
          request_body_template?: Json | null
          request_headers?: Json | null
          request_method?: string | null
          requires_approval?: boolean | null
          response_format?: string | null
          seller_id?: string
          successful_calls?: number | null
          tags?: string[] | null
          tier_pricing?: Json | null
          total_calls?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_products_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      api_usage_metrics: {
        Row: {
          api_product_id: string
          avg_response_time_ms: number | null
          call_count: number | null
          consumer_id: string | null
          created_at: string | null
          error_count: number | null
          id: string
          p95_response_time_ms: number | null
          p99_response_time_ms: number | null
          success_count: number | null
          time_granularity: string | null
          time_window: string
          total_cost: number | null
          total_revenue: number | null
        }
        Insert: {
          api_product_id: string
          avg_response_time_ms?: number | null
          call_count?: number | null
          consumer_id?: string | null
          created_at?: string | null
          error_count?: number | null
          id?: string
          p95_response_time_ms?: number | null
          p99_response_time_ms?: number | null
          success_count?: number | null
          time_granularity?: string | null
          time_window: string
          total_cost?: number | null
          total_revenue?: number | null
        }
        Update: {
          api_product_id?: string
          avg_response_time_ms?: number | null
          call_count?: number | null
          consumer_id?: string | null
          created_at?: string | null
          error_count?: number | null
          id?: string
          p95_response_time_ms?: number | null
          p99_response_time_ms?: number | null
          success_count?: number | null
          time_granularity?: string | null
          time_window?: string
          total_cost?: number | null
          total_revenue?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_metrics_api_product_id_fkey"
            columns: ["api_product_id"]
            isOneToOne: false
            referencedRelation: "api_products"
            referencedColumns: ["id"]
          },
        ]
      }
      arbitrage_opportunities: {
        Row: {
          actual_profit: number | null
          buy_chain: string
          buy_price: number
          created_at: string | null
          detected_at: string | null
          estimated_profit: number | null
          executed_at: string | null
          id: string
          metadata: Json | null
          sell_chain: string
          sell_price: number
          status: string | null
        }
        Insert: {
          actual_profit?: number | null
          buy_chain: string
          buy_price: number
          created_at?: string | null
          detected_at?: string | null
          estimated_profit?: number | null
          executed_at?: string | null
          id?: string
          metadata?: Json | null
          sell_chain: string
          sell_price: number
          status?: string | null
        }
        Update: {
          actual_profit?: number | null
          buy_chain?: string
          buy_price?: number
          created_at?: string | null
          detected_at?: string | null
          estimated_profit?: number | null
          executed_at?: string | null
          id?: string
          metadata?: Json | null
          sell_chain?: string
          sell_price?: number
          status?: string | null
        }
        Relationships: []
      }
      autonomous_agents: {
        Row: {
          agent_name: string
          agent_type: Database["public"]["Enums"]["agent_type"]
          capabilities: string[] | null
          created_at: string | null
          current_task_id: string | null
          current_task_started_at: string | null
          daily_budget: number | null
          error_count: number | null
          id: string
          last_active_at: string | null
          last_error: string | null
          last_heartbeat_at: string | null
          max_concurrent_tasks: number | null
          metadata: Json | null
          performance_score: number | null
          status: Database["public"]["Enums"]["agent_status"] | null
          success_rate: number | null
          total_revenue_generated: number | null
          total_tasks_completed: number | null
          updated_at: string | null
          wallet_address: string | null
        }
        Insert: {
          agent_name: string
          agent_type: Database["public"]["Enums"]["agent_type"]
          capabilities?: string[] | null
          created_at?: string | null
          current_task_id?: string | null
          current_task_started_at?: string | null
          daily_budget?: number | null
          error_count?: number | null
          id?: string
          last_active_at?: string | null
          last_error?: string | null
          last_heartbeat_at?: string | null
          max_concurrent_tasks?: number | null
          metadata?: Json | null
          performance_score?: number | null
          status?: Database["public"]["Enums"]["agent_status"] | null
          success_rate?: number | null
          total_revenue_generated?: number | null
          total_tasks_completed?: number | null
          updated_at?: string | null
          wallet_address?: string | null
        }
        Update: {
          agent_name?: string
          agent_type?: Database["public"]["Enums"]["agent_type"]
          capabilities?: string[] | null
          created_at?: string | null
          current_task_id?: string | null
          current_task_started_at?: string | null
          daily_budget?: number | null
          error_count?: number | null
          id?: string
          last_active_at?: string | null
          last_error?: string | null
          last_heartbeat_at?: string | null
          max_concurrent_tasks?: number | null
          metadata?: Json | null
          performance_score?: number | null
          status?: Database["public"]["Enums"]["agent_status"] | null
          success_rate?: number | null
          total_revenue_generated?: number | null
          total_tasks_completed?: number | null
          updated_at?: string | null
          wallet_address?: string | null
        }
        Relationships: []
      }
      autonomous_revenue: {
        Row: {
          agent_id: string | null
          agent_reward: number | null
          amount: number
          collected_at: string | null
          created_at: string | null
          currency: string | null
          distributed_at: string | null
          id: string
          metadata: Json | null
          platform_fee: number | null
          revenue_date: string
          revenue_source: Database["public"]["Enums"]["revenue_source"]
          seller_amount: number | null
          status: string | null
          task_id: string | null
          transaction_id: string | null
        }
        Insert: {
          agent_id?: string | null
          agent_reward?: number | null
          amount: number
          collected_at?: string | null
          created_at?: string | null
          currency?: string | null
          distributed_at?: string | null
          id?: string
          metadata?: Json | null
          platform_fee?: number | null
          revenue_date: string
          revenue_source: Database["public"]["Enums"]["revenue_source"]
          seller_amount?: number | null
          status?: string | null
          task_id?: string | null
          transaction_id?: string | null
        }
        Update: {
          agent_id?: string | null
          agent_reward?: number | null
          amount?: number
          collected_at?: string | null
          created_at?: string | null
          currency?: string | null
          distributed_at?: string | null
          id?: string
          metadata?: Json | null
          platform_fee?: number | null
          revenue_date?: string
          revenue_source?: Database["public"]["Enums"]["revenue_source"]
          seller_amount?: number | null
          status?: string | null
          task_id?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "autonomous_revenue_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "autonomous_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "autonomous_revenue_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "brain_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      brain_reports: {
        Row: {
          active_agents: number | null
          avg_success_rate: number | null
          avg_task_duration_seconds: number | null
          created_at: string | null
          generated_at: string | null
          id: string
          idle_agents: number | null
          insights: Json | null
          net_profit: number | null
          opportunities_detected: number | null
          opportunities_executed: number | null
          opportunity_conversion_rate: number | null
          period_end: string
          period_start: string
          platform_fees: number | null
          predicted_next_period_revenue: number | null
          recommendations: Json | null
          report_type: string
          system_efficiency_score: number | null
          total_cost: number | null
          total_revenue: number | null
          total_tasks_completed: number | null
          total_tasks_created: number | null
          total_tasks_failed: number | null
        }
        Insert: {
          active_agents?: number | null
          avg_success_rate?: number | null
          avg_task_duration_seconds?: number | null
          created_at?: string | null
          generated_at?: string | null
          id?: string
          idle_agents?: number | null
          insights?: Json | null
          net_profit?: number | null
          opportunities_detected?: number | null
          opportunities_executed?: number | null
          opportunity_conversion_rate?: number | null
          period_end: string
          period_start: string
          platform_fees?: number | null
          predicted_next_period_revenue?: number | null
          recommendations?: Json | null
          report_type: string
          system_efficiency_score?: number | null
          total_cost?: number | null
          total_revenue?: number | null
          total_tasks_completed?: number | null
          total_tasks_created?: number | null
          total_tasks_failed?: number | null
        }
        Update: {
          active_agents?: number | null
          avg_success_rate?: number | null
          avg_task_duration_seconds?: number | null
          created_at?: string | null
          generated_at?: string | null
          id?: string
          idle_agents?: number | null
          insights?: Json | null
          net_profit?: number | null
          opportunities_detected?: number | null
          opportunities_executed?: number | null
          opportunity_conversion_rate?: number | null
          period_end?: string
          period_start?: string
          platform_fees?: number | null
          predicted_next_period_revenue?: number | null
          recommendations?: Json | null
          report_type?: string
          system_efficiency_score?: number | null
          total_cost?: number | null
          total_revenue?: number | null
          total_tasks_completed?: number | null
          total_tasks_created?: number | null
          total_tasks_failed?: number | null
        }
        Relationships: []
      }
      brain_tasks: {
        Row: {
          actual_cost: number | null
          actual_revenue: number | null
          allocated_budget: number
          assigned_agent_id: string | null
          completed_at: string | null
          created_at: string | null
          deadline: string | null
          error_details: string | null
          expected_revenue: number | null
          id: string
          metadata: Json | null
          priority: number
          started_at: string | null
          status: Database["public"]["Enums"]["task_status"] | null
          success_indicators: Json | null
          target_amount: number | null
          target_api_id: string | null
          target_wallet: string | null
          task_type: Database["public"]["Enums"]["task_type"]
          updated_at: string | null
        }
        Insert: {
          actual_cost?: number | null
          actual_revenue?: number | null
          allocated_budget: number
          assigned_agent_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          deadline?: string | null
          error_details?: string | null
          expected_revenue?: number | null
          id?: string
          metadata?: Json | null
          priority: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          success_indicators?: Json | null
          target_amount?: number | null
          target_api_id?: string | null
          target_wallet?: string | null
          task_type: Database["public"]["Enums"]["task_type"]
          updated_at?: string | null
        }
        Update: {
          actual_cost?: number | null
          actual_revenue?: number | null
          allocated_budget?: number
          assigned_agent_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          deadline?: string | null
          error_details?: string | null
          expected_revenue?: number | null
          id?: string
          metadata?: Json | null
          priority?: number
          started_at?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          success_indicators?: Json | null
          target_amount?: number | null
          target_api_id?: string | null
          target_wallet?: string | null
          task_type?: Database["public"]["Enums"]["task_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brain_tasks_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "autonomous_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "brain_tasks_target_api_id_fkey"
            columns: ["target_api_id"]
            isOneToOne: false
            referencedRelation: "api_products"
            referencedColumns: ["id"]
          },
        ]
      }
      connected_wallets: {
        Row: {
          chain_id: number
          created_at: string | null
          id: string
          is_primary: boolean | null
          is_verified: boolean | null
          metadata: Json | null
          seller_id: string
          updated_at: string | null
          verified_at: string | null
          wallet_address: string
        }
        Insert: {
          chain_id: number
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          is_verified?: boolean | null
          metadata?: Json | null
          seller_id: string
          updated_at?: string | null
          verified_at?: string | null
          wallet_address: string
        }
        Update: {
          chain_id?: number
          created_at?: string | null
          id?: string
          is_primary?: boolean | null
          is_verified?: boolean | null
          metadata?: Json | null
          seller_id?: string
          updated_at?: string | null
          verified_at?: string | null
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "connected_wallets_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      crypto_transactions: {
        Row: {
          amount: string
          chain: string
          confirmations: number | null
          created_at: string
          from_address: string
          id: string
          status: string
          to_address: string
          token: string
          tx_hash: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: string
          chain: string
          confirmations?: number | null
          created_at?: string
          from_address: string
          id?: string
          status?: string
          to_address: string
          token: string
          tx_hash?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: string
          chain?: string
          confirmations?: number | null
          created_at?: string
          from_address?: string
          id?: string
          status?: string
          to_address?: string
          token?: string
          tx_hash?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      market_opportunities: {
        Row: {
          actual_cost: number | null
          actual_revenue: number | null
          analysis_data: Json | null
          api_product_id: string
          assigned_agent_id: string | null
          assigned_task_id: string | null
          competition_score: number
          completion_time: string | null
          complexity_score: number
          created_at: string | null
          demand_score: number
          detection_time: string | null
          estimated_cost: number
          id: string
          potential_revenue: number
          status: Database["public"]["Enums"]["opportunity_status"] | null
          time_window_end: string | null
          time_window_start: string | null
          updated_at: string | null
        }
        Insert: {
          actual_cost?: number | null
          actual_revenue?: number | null
          analysis_data?: Json | null
          api_product_id: string
          assigned_agent_id?: string | null
          assigned_task_id?: string | null
          competition_score: number
          completion_time?: string | null
          complexity_score: number
          created_at?: string | null
          demand_score: number
          detection_time?: string | null
          estimated_cost: number
          id?: string
          potential_revenue: number
          status?: Database["public"]["Enums"]["opportunity_status"] | null
          time_window_end?: string | null
          time_window_start?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_cost?: number | null
          actual_revenue?: number | null
          analysis_data?: Json | null
          api_product_id?: string
          assigned_agent_id?: string | null
          assigned_task_id?: string | null
          competition_score?: number
          completion_time?: string | null
          complexity_score?: number
          created_at?: string | null
          demand_score?: number
          detection_time?: string | null
          estimated_cost?: number
          id?: string
          potential_revenue?: number
          status?: Database["public"]["Enums"]["opportunity_status"] | null
          time_window_end?: string | null
          time_window_start?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "market_opportunities_api_product_id_fkey"
            columns: ["api_product_id"]
            isOneToOne: false
            referencedRelation: "api_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_opportunities_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "autonomous_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "market_opportunities_assigned_task_id_fkey"
            columns: ["assigned_task_id"]
            isOneToOne: false
            referencedRelation: "brain_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          customer_email: string | null
          description: string | null
          id: string
          metadata: Json | null
          seller_id: string | null
          status: string
          stripe_payment_intent_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          customer_email?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          seller_id?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          customer_email?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          seller_id?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_payments: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string | null
          currency: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          next_retry_at: string | null
          payment_method: string | null
          purpose: string | null
          retry_count: number | null
          scheduled_for: string | null
          seller_id: string | null
          status: string | null
          transaction_id: string | null
          updated_at: string | null
          wallet_id: string | null
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          next_retry_at?: string | null
          payment_method?: string | null
          purpose?: string | null
          retry_count?: number | null
          scheduled_for?: string | null
          seller_id?: string | null
          status?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          wallet_id?: string | null
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          next_retry_at?: string | null
          payment_method?: string | null
          purpose?: string | null
          retry_count?: number | null
          scheduled_for?: string | null
          seller_id?: string | null
          status?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pending_payments_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      sellers: {
        Row: {
          business_name: string | null
          charges_enabled: boolean | null
          country: string | null
          created_at: string
          details_submitted: boolean | null
          email: string | null
          id: string
          payouts_enabled: boolean | null
          stripe_account_id: string | null
          stripe_account_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_name?: string | null
          charges_enabled?: boolean | null
          country?: string | null
          created_at?: string
          details_submitted?: boolean | null
          email?: string | null
          id?: string
          payouts_enabled?: boolean | null
          stripe_account_id?: string | null
          stripe_account_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          business_name?: string | null
          charges_enabled?: boolean | null
          country?: string | null
          created_at?: string
          details_submitted?: boolean | null
          email?: string | null
          id?: string
          payouts_enabled?: boolean | null
          stripe_account_id?: string | null
          stripe_account_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vault_positions: {
        Row: {
          apy: number | null
          chain: string
          created_at: string
          current_shares: string | null
          deposited_amount: string
          id: string
          status: string
          token: string
          updated_at: string
          user_id: string
          vault_address: string
          vault_type: string
        }
        Insert: {
          apy?: number | null
          chain: string
          created_at?: string
          current_shares?: string | null
          deposited_amount: string
          id?: string
          status?: string
          token: string
          updated_at?: string
          user_id: string
          vault_address: string
          vault_type: string
        }
        Update: {
          apy?: number | null
          chain?: string
          created_at?: string
          current_shares?: string | null
          deposited_amount?: string
          id?: string
          status?: string
          token?: string
          updated_at?: string
          user_id?: string
          vault_address?: string
          vault_type?: string
        }
        Relationships: []
      }
      volume_generation_logs: {
        Row: {
          api_id: string
          cost: number | null
          created_at: string | null
          generated_at: string
          id: string
          metadata: Json | null
          payload: Json | null
          profile_id: string
          response_time_ms: number | null
          result: string | null
        }
        Insert: {
          api_id: string
          cost?: number | null
          created_at?: string | null
          generated_at: string
          id?: string
          metadata?: Json | null
          payload?: Json | null
          profile_id: string
          response_time_ms?: number | null
          result?: string | null
        }
        Update: {
          api_id?: string
          cost?: number | null
          created_at?: string | null
          generated_at?: string
          id?: string
          metadata?: Json | null
          payload?: Json | null
          profile_id?: string
          response_time_ms?: number | null
          result?: string | null
        }
        Relationships: []
      }
      yield_strategies: {
        Row: {
          actual_yield: number | null
          amount: number
          apy: number | null
          chain_id: number
          completed_at: string | null
          created_at: string | null
          estimated_monthly_yield: number | null
          id: string
          metadata: Json | null
          risk_level: string | null
          started_at: string | null
          status: string | null
          strategy_name: string
          updated_at: string | null
          wallet_id: string
        }
        Insert: {
          actual_yield?: number | null
          amount: number
          apy?: number | null
          chain_id: number
          completed_at?: string | null
          created_at?: string | null
          estimated_monthly_yield?: number | null
          id?: string
          metadata?: Json | null
          risk_level?: string | null
          started_at?: string | null
          status?: string | null
          strategy_name: string
          updated_at?: string | null
          wallet_id: string
        }
        Update: {
          actual_yield?: number | null
          amount?: number
          apy?: number | null
          chain_id?: number
          completed_at?: string | null
          created_at?: string | null
          estimated_monthly_yield?: number | null
          id?: string
          metadata?: Json | null
          risk_level?: string | null
          started_at?: string | null
          status?: string | null
          strategy_name?: string
          updated_at?: string | null
          wallet_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      agent_status: "idle" | "active" | "error" | "maintenance"
      agent_type:
        | "api_consumer"
        | "payment_bot"
        | "nft_minter"
        | "volume_generator"
      app_role: "admin" | "user"
      auth_method: "api_key" | "oauth2" | "jwt" | "none"
      opportunity_status:
        | "detected"
        | "scheduled"
        | "executing"
        | "completed"
        | "expired"
      price_model: "per_call" | "subscription" | "tiered" | "custom"
      revenue_source:
        | "api_calls"
        | "nft_sales"
        | "payment_fees"
        | "yield"
        | "other"
      task_status:
        | "pending"
        | "assigned"
        | "executing"
        | "completed"
        | "failed"
        | "cancelled"
      task_type:
        | "api_consumption"
        | "payment"
        | "nft_mint"
        | "volume_generation"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      agent_status: ["idle", "active", "error", "maintenance"],
      agent_type: [
        "api_consumer",
        "payment_bot",
        "nft_minter",
        "volume_generator",
      ],
      app_role: ["admin", "user"],
      auth_method: ["api_key", "oauth2", "jwt", "none"],
      opportunity_status: [
        "detected",
        "scheduled",
        "executing",
        "completed",
        "expired",
      ],
      price_model: ["per_call", "subscription", "tiered", "custom"],
      revenue_source: [
        "api_calls",
        "nft_sales",
        "payment_fees",
        "yield",
        "other",
      ],
      task_status: [
        "pending",
        "assigned",
        "executing",
        "completed",
        "failed",
        "cancelled",
      ],
      task_type: [
        "api_consumption",
        "payment",
        "nft_mint",
        "volume_generation",
      ],
    },
  },
} as const
