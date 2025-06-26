export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      ai_verification_sessions: {
        Row: {
          ai_confidence_score: number | null
          completed_at: string | null
          created_at: string | null
          driver_phone_ref: string | null
          failure_reason: string | null
          id: string
          liveness_check_passed: boolean | null
          session_status: string | null
          verification_result: string | null
        }
        Insert: {
          ai_confidence_score?: number | null
          completed_at?: string | null
          created_at?: string | null
          driver_phone_ref?: string | null
          failure_reason?: string | null
          id?: string
          liveness_check_passed?: boolean | null
          session_status?: string | null
          verification_result?: string | null
        }
        Update: {
          ai_confidence_score?: number | null
          completed_at?: string | null
          created_at?: string | null
          driver_phone_ref?: string | null
          failure_reason?: string | null
          id?: string
          liveness_check_passed?: boolean | null
          session_status?: string | null
          verification_result?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_verification_sessions_driver_phone_ref_fkey"
            columns: ["driver_phone_ref"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["phone"]
          },
        ]
      }
      documents: {
        Row: {
          admin_notes: string | null
          driver_phone_ref: string | null
          file_url: string | null
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          type: string
          uploaded_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          driver_phone_ref?: string | null
          file_url?: string | null
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          type: string
          uploaded_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          driver_phone_ref?: string | null
          file_url?: string | null
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          type?: string
          uploaded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_driver_phone_ref_fkey"
            columns: ["driver_phone_ref"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["phone"]
          },
        ]
      }
      drivers: {
        Row: {
          admin_notes: string | null
          approved_status: string | null
          created_at: string | null
          email: string | null
          is_online: boolean | null
          last_reviewed_at: string | null
          license_number: string | null
          name: string
          phone: string
          plate_number: string | null
          rejection_reason: string | null
          reviewed_by: string | null
          updated_at: string | null
          user_id: string | null
          vehicle_color: string | null
          vehicle_model: string | null
          wallet_balance: number | null
        }
        Insert: {
          admin_notes?: string | null
          approved_status?: string | null
          created_at?: string | null
          email?: string | null
          is_online?: boolean | null
          last_reviewed_at?: string | null
          license_number?: string | null
          name: string
          phone: string
          plate_number?: string | null
          rejection_reason?: string | null
          reviewed_by?: string | null
          updated_at?: string | null
          user_id?: string | null
          vehicle_color?: string | null
          vehicle_model?: string | null
          wallet_balance?: number | null
        }
        Update: {
          admin_notes?: string | null
          approved_status?: string | null
          created_at?: string | null
          email?: string | null
          is_online?: boolean | null
          last_reviewed_at?: string | null
          license_number?: string | null
          name?: string
          phone?: string
          plate_number?: string | null
          rejection_reason?: string | null
          reviewed_by?: string | null
          updated_at?: string | null
          user_id?: string | null
          vehicle_color?: string | null
          vehicle_model?: string | null
          wallet_balance?: number | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          driver_phone_ref: string | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string | null
        }
        Insert: {
          created_at?: string | null
          driver_phone_ref?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type?: string | null
        }
        Update: {
          created_at?: string | null
          driver_phone_ref?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_driver_phone_ref_fkey"
            columns: ["driver_phone_ref"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["phone"]
          },
        ]
      }
      passengers: {
        Row: {
          created_at: string | null
          email: string | null
          name: string
          phone: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          name: string
          phone: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          name?: string
          phone?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string | null
          current_uses: number | null
          driver_bonus: number
          expiry_date: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          current_uses?: number | null
          driver_bonus: number
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          current_uses?: number | null
          driver_bonus?: number
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
        }
        Relationships: []
      }
      promo_redemptions: {
        Row: {
          amount_credited: number | null
          driver_phone_ref: string | null
          id: string
          promo_code_id: string | null
          redeemed_at: string | null
        }
        Insert: {
          amount_credited?: number | null
          driver_phone_ref?: string | null
          id?: string
          promo_code_id?: string | null
          redeemed_at?: string | null
        }
        Update: {
          amount_credited?: number | null
          driver_phone_ref?: string | null
          id?: string
          promo_code_id?: string | null
          redeemed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promo_redemptions_driver_phone_ref_fkey"
            columns: ["driver_phone_ref"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["phone"]
          },
          {
            foreignKeyName: "promo_redemptions_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      rides: {
        Row: {
          commission: number | null
          completed_at: string | null
          created_at: string | null
          distance_km: number | null
          driver_phone_ref: string | null
          dropoff_location: string
          fare: number | null
          id: string
          net_earnings: number | null
          passenger_name: string | null
          passenger_phone: string | null
          passenger_phone_ref: string | null
          pickup_location: string
          started_at: string | null
          status: string | null
        }
        Insert: {
          commission?: number | null
          completed_at?: string | null
          created_at?: string | null
          distance_km?: number | null
          driver_phone_ref?: string | null
          dropoff_location: string
          fare?: number | null
          id?: string
          net_earnings?: number | null
          passenger_name?: string | null
          passenger_phone?: string | null
          passenger_phone_ref?: string | null
          pickup_location: string
          started_at?: string | null
          status?: string | null
        }
        Update: {
          commission?: number | null
          completed_at?: string | null
          created_at?: string | null
          distance_km?: number | null
          driver_phone_ref?: string | null
          dropoff_location?: string
          fare?: number | null
          id?: string
          net_earnings?: number | null
          passenger_name?: string | null
          passenger_phone?: string | null
          passenger_phone_ref?: string | null
          pickup_location?: string
          started_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rides_driver_phone_ref_fkey"
            columns: ["driver_phone_ref"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["phone"]
          },
          {
            foreignKeyName: "rides_passenger_phone_ref_fkey"
            columns: ["passenger_phone_ref"]
            isOneToOne: false
            referencedRelation: "passengers"
            referencedColumns: ["phone"]
          },
        ]
      }
      sos_alerts: {
        Row: {
          created_at: string | null
          driver_phone_ref: string | null
          id: string
          location_lat: number | null
          location_lng: number | null
          ride_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          driver_phone_ref?: string | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          ride_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          driver_phone_ref?: string | null
          id?: string
          location_lat?: number | null
          location_lng?: number | null
          ride_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sos_alerts_driver_phone_ref_fkey"
            columns: ["driver_phone_ref"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["phone"]
          },
          {
            foreignKeyName: "sos_alerts_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          created_at: string | null
          driver_phone_ref: string | null
          id: string
          message: string
          ride_id: string | null
          status: string | null
          subject: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          driver_phone_ref?: string | null
          id?: string
          message: string
          ride_id?: string | null
          status?: string | null
          subject: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          driver_phone_ref?: string | null
          id?: string
          message?: string
          ride_id?: string | null
          status?: string | null
          subject?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_driver_phone_ref_fkey"
            columns: ["driver_phone_ref"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["phone"]
          },
          {
            foreignKeyName: "support_tickets_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          driver_phone_ref: string | null
          id: string
          source: string | null
          status: string | null
          type: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          driver_phone_ref?: string | null
          id?: string
          source?: string | null
          status?: string | null
          type: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          driver_phone_ref?: string | null
          id?: string
          source?: string | null
          status?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_driver_phone_ref_fkey"
            columns: ["driver_phone_ref"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["phone"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
