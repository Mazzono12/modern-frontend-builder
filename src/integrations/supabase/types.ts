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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      evo_instance_events: {
        Row: {
          created_at: string
          details: Json | null
          event_type: string
          id: string
          instance_id: string | null
          instance_name: string | null
          level: string
          message: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
          instance_id?: string | null
          instance_name?: string | null
          level?: string
          message?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          instance_id?: string | null
          instance_name?: string | null
          level?: string
          message?: string | null
          user_id?: string
        }
        Relationships: []
      }
      evo_instances: {
        Row: {
          created_at: string
          id: string
          instance_key: string | null
          last_sync: string | null
          meta_access_token: string | null
          meta_api_version: string
          meta_app_id: string | null
          meta_app_secret: string | null
          meta_display_phone_number: string | null
          meta_phone_number_id: string | null
          meta_verify_token: string | null
          meta_waba_id: string | null
          name: string
          phone_number: string | null
          provider: Database["public"]["Enums"]["evo_provider"]
          qr_code: string | null
          status: Database["public"]["Enums"]["evo_instance_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          instance_key?: string | null
          last_sync?: string | null
          meta_access_token?: string | null
          meta_api_version?: string
          meta_app_id?: string | null
          meta_app_secret?: string | null
          meta_display_phone_number?: string | null
          meta_phone_number_id?: string | null
          meta_verify_token?: string | null
          meta_waba_id?: string | null
          name: string
          phone_number?: string | null
          provider?: Database["public"]["Enums"]["evo_provider"]
          qr_code?: string | null
          status?: Database["public"]["Enums"]["evo_instance_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          instance_key?: string | null
          last_sync?: string | null
          meta_access_token?: string | null
          meta_api_version?: string
          meta_app_id?: string | null
          meta_app_secret?: string | null
          meta_display_phone_number?: string | null
          meta_phone_number_id?: string | null
          meta_verify_token?: string | null
          meta_waba_id?: string | null
          name?: string
          phone_number?: string | null
          provider?: Database["public"]["Enums"]["evo_provider"]
          qr_code?: string | null
          status?: Database["public"]["Enums"]["evo_instance_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      evo_messages: {
        Row: {
          content: string | null
          created_at: string
          external_id: string | null
          from_me: boolean
          id: string
          instance_id: string | null
          message_timestamp: string
          message_type: string | null
          push_name: string | null
          raw: Json | null
          remote_jid: string
          status: string | null
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          external_id?: string | null
          from_me?: boolean
          id?: string
          instance_id?: string | null
          message_timestamp?: string
          message_type?: string | null
          push_name?: string | null
          raw?: Json | null
          remote_jid: string
          status?: string | null
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          external_id?: string | null
          from_me?: boolean
          id?: string
          instance_id?: string | null
          message_timestamp?: string
          message_type?: string | null
          push_name?: string | null
          raw?: Json | null
          remote_jid?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evo_messages_instance_id_fkey"
            columns: ["instance_id"]
            isOneToOne: false
            referencedRelation: "evo_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      evo_settings: {
        Row: {
          api_key: string
          created_at: string
          id: string
          server_url: string
          updated_at: string
          user_id: string
          webhook_secret: string
        }
        Insert: {
          api_key: string
          created_at?: string
          id?: string
          server_url: string
          updated_at?: string
          user_id: string
          webhook_secret?: string
        }
        Update: {
          api_key?: string
          created_at?: string
          id?: string
          server_url?: string
          updated_at?: string
          user_id?: string
          webhook_secret?: string
        }
        Relationships: []
      }
      n8n_settings: {
        Row: {
          api_key: string
          base_url: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key: string
          base_url: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key?: string
          base_url?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      evo_instance_status:
        | "disconnected"
        | "connecting"
        | "qr"
        | "connected"
        | "error"
      evo_provider: "evolution" | "meta_cloud"
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
      evo_instance_status: [
        "disconnected",
        "connecting",
        "qr",
        "connected",
        "error",
      ],
      evo_provider: ["evolution", "meta_cloud"],
    },
  },
} as const
