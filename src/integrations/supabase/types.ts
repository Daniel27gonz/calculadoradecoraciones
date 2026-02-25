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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      packages: {
        Row: {
          created_at: string
          description: string | null
          estimated_balloons: number | null
          estimated_hours: number | null
          estimated_materials: Json | null
          icon: string | null
          id: string
          is_default: boolean | null
          name: string
          suggested_price: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          estimated_balloons?: number | null
          estimated_hours?: number | null
          estimated_materials?: Json | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          suggested_price?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          estimated_balloons?: number | null
          estimated_hours?: number | null
          estimated_materials?: Json | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          suggested_price?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          business_name: string | null
          created_at: string
          currency: string | null
          default_hourly_rate: number | null
          design_additional_notes: string | null
          design_deposit_message: string | null
          design_deposit_percentage: number | null
          email: string | null
          events_per_month: number | null
          id: string
          logo_url: string | null
          mode: string | null
          name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          business_name?: string | null
          created_at?: string
          currency?: string | null
          default_hourly_rate?: number | null
          design_additional_notes?: string | null
          design_deposit_message?: string | null
          design_deposit_percentage?: number | null
          email?: string | null
          events_per_month?: number | null
          id?: string
          logo_url?: string | null
          mode?: string | null
          name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          business_name?: string | null
          created_at?: string
          currency?: string | null
          default_hourly_rate?: number | null
          design_additional_notes?: string | null
          design_deposit_message?: string | null
          design_deposit_percentage?: number | null
          email?: string | null
          events_per_month?: number | null
          id?: string
          logo_url?: string | null
          mode?: string | null
          name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          balloons: Json | null
          client_name: string
          client_phone: string | null
          created_at: string
          decoration_description: string | null
          event_date: string | null
          event_type: string | null
          extras: Json | null
          folio: number | null
          furniture_items: Json | null
          id: string
          margin_percentage: number | null
          materials: Json | null
          notes: string | null
          reusable_materials_used: Json | null
          status: string
          time_phases: Json | null
          tool_wear_percentage: number | null
          transport_items: Json | null
          updated_at: string
          user_id: string
          wastage_percentage: number | null
          workers: Json | null
        }
        Insert: {
          balloons?: Json | null
          client_name: string
          client_phone?: string | null
          created_at?: string
          decoration_description?: string | null
          event_date?: string | null
          event_type?: string | null
          extras?: Json | null
          folio?: number | null
          furniture_items?: Json | null
          id?: string
          margin_percentage?: number | null
          materials?: Json | null
          notes?: string | null
          reusable_materials_used?: Json | null
          status?: string
          time_phases?: Json | null
          tool_wear_percentage?: number | null
          transport_items?: Json | null
          updated_at?: string
          user_id: string
          wastage_percentage?: number | null
          workers?: Json | null
        }
        Update: {
          balloons?: Json | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          decoration_description?: string | null
          event_date?: string | null
          event_type?: string | null
          extras?: Json | null
          folio?: number | null
          furniture_items?: Json | null
          id?: string
          margin_percentage?: number | null
          materials?: Json | null
          notes?: string | null
          reusable_materials_used?: Json | null
          status?: string
          time_phases?: Json | null
          tool_wear_percentage?: number | null
          transport_items?: Json | null
          updated_at?: string
          user_id?: string
          wastage_percentage?: number | null
          workers?: Json | null
        }
        Relationships: []
      }
      reusable_materials: {
        Row: {
          cost_per_use: number
          created_at: string
          id: string
          material_cost: number
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cost_per_use?: number
          created_at?: string
          id?: string
          material_cost?: number
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cost_per_use?: number
          created_at?: string
          id?: string
          material_cost?: number
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          description: string
          id: string
          transaction_date: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          category?: string | null
          created_at?: string
          description: string
          id?: string
          transaction_date?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          description?: string
          id?: string
          transaction_date?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_approval_status: {
        Row: {
          created_at: string
          id: string
          status: Database["public"]["Enums"]["approval_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["approval_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["approval_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_materials: {
        Row: {
          base_unit: string | null
          category: string
          cost_per_unit: number | null
          created_at: string
          id: string
          is_custom: boolean | null
          name: string
          presentation_price: number | null
          price: number | null
          purchase_unit: string | null
          quantity_per_presentation: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          base_unit?: string | null
          category: string
          cost_per_unit?: number | null
          created_at?: string
          id?: string
          is_custom?: boolean | null
          name: string
          presentation_price?: number | null
          price?: number | null
          purchase_unit?: string | null
          quantity_per_presentation?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          base_unit?: string | null
          category?: string
          cost_per_unit?: number | null
          created_at?: string
          id?: string
          is_custom?: boolean | null
          name?: string
          presentation_price?: number | null
          price?: number | null
          purchase_unit?: string | null
          quantity_per_presentation?: number | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_approval_status: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["approval_status"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_user_approved: { Args: { _user_id: string }; Returns: boolean }
      restore_orphaned_user_data: {
        Args: { p_email: string; p_new_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user"
      approval_status: "pending" | "approved" | "rejected"
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
      approval_status: ["pending", "approved", "rejected"],
    },
  },
} as const
