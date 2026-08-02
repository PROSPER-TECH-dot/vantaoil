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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      bank_accounts: {
        Row: {
          account: string
          bank: string
          created_at: string
          holder: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account: string
          bank: string
          created_at?: string
          holder: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account?: string
          bank?: string
          created_at?: string
          holder?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gift_codes: {
        Row: {
          active: boolean
          amount: number
          code: string
          created_at: string
          expires_at: string | null
          id: string
          max_amount: number
          max_redemptions: number
          min_amount: number
          mode: string
          redeemed_count: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          amount?: number
          code: string
          created_at?: string
          expires_at?: string | null
          id?: string
          max_amount?: number
          max_redemptions?: number
          min_amount?: number
          mode?: string
          redeemed_count?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          amount?: number
          code?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          max_amount?: number
          max_redemptions?: number
          min_amount?: number
          mode?: string
          redeemed_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      gift_redemptions: {
        Row: {
          amount: number
          created_at: string
          gift_code_id: string
          id: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          gift_code_id: string
          id?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          gift_code_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gift_redemptions_gift_code_id_fkey"
            columns: ["gift_code_id"]
            isOneToOne: false
            referencedRelation: "gift_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          code: string
          created_at: string
          daily: number
          id: string
          image: string
          name: string
          price: number
          sold_out: boolean
          sort_order: number
          term: string
          total: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          daily: number
          id?: string
          image?: string
          name: string
          price: number
          sold_out?: boolean
          sort_order?: number
          term: string
          total: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          daily?: number
          id?: string
          image?: string
          name?: string
          price?: number
          sold_out?: boolean
          sort_order?: number
          term?: string
          total?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          balance: number
          banned: boolean
          checkin_days: number
          created_at: string
          cumulative_income: number
          email: string | null
          full_name: string | null
          id: string
          invite_code: string | null
          last_checkin_at: string | null
          last_checkin_date: string | null
          phone: string | null
          products_count: number
          recharge_balance: number
          referred_by: string | null
          updated_at: string
          welcome_bonus_given: boolean
          withdrawn: number
        }
        Insert: {
          avatar_url?: string | null
          balance?: number
          banned?: boolean
          checkin_days?: number
          created_at?: string
          cumulative_income?: number
          email?: string | null
          full_name?: string | null
          id: string
          invite_code?: string | null
          last_checkin_at?: string | null
          last_checkin_date?: string | null
          phone?: string | null
          products_count?: number
          recharge_balance?: number
          referred_by?: string | null
          updated_at?: string
          welcome_bonus_given?: boolean
          withdrawn?: number
        }
        Update: {
          avatar_url?: string | null
          balance?: number
          banned?: boolean
          checkin_days?: number
          created_at?: string
          cumulative_income?: number
          email?: string | null
          full_name?: string | null
          id?: string
          invite_code?: string | null
          last_checkin_at?: string | null
          last_checkin_date?: string | null
          phone?: string | null
          products_count?: number
          recharge_balance?: number
          referred_by?: string | null
          updated_at?: string
          welcome_bonus_given?: boolean
          withdrawn?: number
        }
        Relationships: []
      }
      purchases: {
        Row: {
          created_at: string
          daily: number
          days_paid: number
          id: string
          image: string | null
          name: string
          next_payout_at: string | null
          price: number
          product_id: string
          term: string
          term_days: number
          total: number
          user_id: string
        }
        Insert: {
          created_at?: string
          daily: number
          days_paid?: number
          id?: string
          image?: string | null
          name: string
          next_payout_at?: string | null
          price: number
          product_id: string
          term: string
          term_days?: number
          total: number
          user_id: string
        }
        Update: {
          created_at?: string
          daily?: number
          days_paid?: number
          id?: string
          image?: string | null
          name?: string
          next_payout_at?: string | null
          price?: number
          product_id?: string
          term?: string
          term_days?: number
          total?: number
          user_id?: string
        }
        Relationships: []
      }
      recharge_problems: {
        Row: {
          amount: number
          certificate_url: string | null
          created_at: string
          id: string
          seen: boolean
          user_id: string
          wallet: string
        }
        Insert: {
          amount: number
          certificate_url?: string | null
          created_at?: string
          id?: string
          seen?: boolean
          user_id: string
          wallet: string
        }
        Update: {
          amount?: number
          certificate_url?: string | null
          created_at?: string
          id?: string
          seen?: boolean
          user_id?: string
          wallet?: string
        }
        Relationships: []
      }
      recharges: {
        Row: {
          amount: number
          created_at: string
          external_reference: string | null
          id: string
          msisdn: string | null
          order_no: string
          provider_ref: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          external_reference?: string | null
          id?: string
          msisdn?: string | null
          order_no: string
          provider_ref?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          external_reference?: string | null
          id?: string
          msisdn?: string | null
          order_no?: string
          provider_ref?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          kind: string
          title: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          kind: string
          title: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          kind?: string
          title?: string
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
      withdrawals: {
        Row: {
          amount: number
          created_at: string
          external_reference: string | null
          id: string
          msisdn: string | null
          order_no: string
          provider_ref: string | null
          received: number
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          external_reference?: string | null
          id?: string
          msisdn?: string | null
          order_no: string
          provider_ref?: string | null
          received: number
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          external_reference?: string | null
          id?: string
          msisdn?: string | null
          order_no?: string
          provider_ref?: string | null
          received?: number
          status?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_adjust_balance: {
        Args: {
          p_amount: number
          p_direction: string
          p_note?: string
          p_user_id: string
          p_wallet: string
        }
        Returns: undefined
      }
      admin_overview: { Args: never; Returns: Json }
      admin_set_banned: {
        Args: { p_banned: boolean; p_user_id: string }
        Returns: undefined
      }
      admin_set_recharge_status: {
        Args: { p_id: string; p_status: string }
        Returns: undefined
      }
      admin_set_withdrawal_status: {
        Args: { p_id: string; p_status: string }
        Returns: undefined
      }
      admin_user_detail: { Args: { p_user_id: string }; Returns: Json }
      create_recharge:
        | {
            Args: { p_amount: number }
            Returns: {
              amount: number
              created_at: string
              external_reference: string | null
              id: string
              msisdn: string | null
              order_no: string
              provider_ref: string | null
              status: string
              user_id: string
            }
            SetofOptions: {
              from: "*"
              to: "recharges"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { p_amount: number; p_msisdn?: string }
            Returns: {
              amount: number
              created_at: string
              external_reference: string | null
              id: string
              msisdn: string | null
              order_no: string
              provider_ref: string | null
              status: string
              user_id: string
            }
            SetofOptions: {
              from: "*"
              to: "recharges"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      credit_recharge_by_reference: {
        Args: { p_provider_ref?: string; p_reference: string }
        Returns: boolean
      }
      daily_checkin: {
        Args: never
        Returns: {
          balance: number
          checkin_days: number
        }[]
      }
      fail_recharge_by_reference: {
        Args: { p_provider_ref?: string; p_reference: string }
        Returns: boolean
      }
      gen_invite_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      purchase_product: {
        Args: {
          p_daily: number
          p_image: string
          p_name: string
          p_price: number
          p_product_id: string
          p_term: string
          p_total: number
        }
        Returns: {
          created_at: string
          daily: number
          days_paid: number
          id: string
          image: string | null
          name: string
          next_payout_at: string | null
          price: number
          product_id: string
          term: string
          term_days: number
          total: number
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "purchases"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      redeem_gift_code: { Args: { p_code: string }; Returns: number }
      request_withdrawal:
        | {
            Args: { p_amount: number }
            Returns: {
              amount: number
              created_at: string
              external_reference: string | null
              id: string
              msisdn: string | null
              order_no: string
              provider_ref: string | null
              received: number
              status: string
              user_id: string
            }
            SetofOptions: {
              from: "*"
              to: "withdrawals"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { p_amount: number; p_msisdn?: string }
            Returns: {
              amount: number
              created_at: string
              external_reference: string | null
              id: string
              msisdn: string | null
              order_no: string
              provider_ref: string | null
              received: number
              status: string
              user_id: string
            }
            SetofOptions: {
              from: "*"
              to: "withdrawals"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      setting_num: { Args: { _default: number; _key: string }; Returns: number }
      settle_income: { Args: never; Returns: number }
      settle_withdrawal_by_reference: {
        Args: { p_provider_ref?: string; p_reference: string; p_status: string }
        Returns: boolean
      }
      setup_account: {
        Args: { p_invite?: string; p_phone: string }
        Returns: {
          balance: number
          invite_code: string
        }[]
      }
      team_members: {
        Args: { p_level: number }
        Returns: {
          account: string
          joined: string
          recharge: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
