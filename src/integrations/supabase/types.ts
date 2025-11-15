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
      bookings: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          id: string
          meet_id: string | null
          meet_link: string | null
          notes: string | null
          purchase_id: string
          scheduled_at: string
          service_id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          meet_id?: string | null
          meet_link?: string | null
          notes?: string | null
          purchase_id: string
          scheduled_at: string
          service_id: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          meet_id?: string | null
          meet_link?: string | null
          notes?: string | null
          purchase_id?: string
          scheduled_at?: string
          service_id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      consultations: {
        Row: {
          consultation_type: string
          created_at: string | null
          duration_minutes: number | null
          id: string
          meet_id: string | null
          meet_link: string | null
          notes: string | null
          scheduled_at: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          consultation_type: string
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          meet_id?: string | null
          meet_link?: string | null
          notes?: string | null
          scheduled_at: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          consultation_type?: string
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          meet_id?: string | null
          meet_link?: string | null
          notes?: string | null
          scheduled_at?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          created_at: string | null
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          processed: boolean | null
          source: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          processed?: boolean | null
          source?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          processed?: boolean | null
          source?: string | null
        }
        Relationships: []
      }
      diet_plans: {
        Row: {
          consultation_id: string | null
          created_at: string | null
          description: string | null
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          is_active: boolean | null
          purchase_id: string
          title: string
          updated_at: string | null
          uploaded_by: string
          user_id: string
        }
        Insert: {
          consultation_id?: string | null
          created_at?: string | null
          description?: string | null
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          is_active?: boolean | null
          purchase_id: string
          title: string
          updated_at?: string | null
          uploaded_by: string
          user_id: string
        }
        Update: {
          consultation_id?: string | null
          created_at?: string | null
          description?: string | null
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          is_active?: boolean | null
          purchase_id?: string
          title?: string
          updated_at?: string | null
          uploaded_by?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "diet_plans_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diet_plans_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      fitness_assessments: {
        Row: {
          bmi: number
          bmr_kcal: number
          body_age: number
          body_fat_mass_kg: number
          body_fat_percentage: number
          body_type: string
          bone_mass_kg: number
          created_at: string | null
          heart_rate_bpm: number
          id: string
          lean_body_mass_kg: number
          muscle_mass_kg: number
          protein_percentage: number
          skeletal_muscle_mass_kg: number
          subcutaneous_fat_percentage: number
          updated_at: string | null
          user_id: string
          visceral_fat: number
          water_percentage: number
          weight_kg: number
        }
        Insert: {
          bmi: number
          bmr_kcal: number
          body_age: number
          body_fat_mass_kg: number
          body_fat_percentage: number
          body_type: string
          bone_mass_kg: number
          created_at?: string | null
          heart_rate_bpm: number
          id?: string
          lean_body_mass_kg: number
          muscle_mass_kg: number
          protein_percentage: number
          skeletal_muscle_mass_kg: number
          subcutaneous_fat_percentage: number
          updated_at?: string | null
          user_id: string
          visceral_fat: number
          water_percentage: number
          weight_kg: number
        }
        Update: {
          bmi?: number
          bmr_kcal?: number
          body_age?: number
          body_fat_mass_kg?: number
          body_fat_percentage?: number
          body_type?: string
          bone_mass_kg?: number
          created_at?: string | null
          heart_rate_bpm?: number
          id?: string
          lean_body_mass_kg?: number
          muscle_mass_kg?: number
          protein_percentage?: number
          skeletal_muscle_mass_kg?: number
          subcutaneous_fat_percentage?: number
          updated_at?: string | null
          user_id?: string
          visceral_fat?: number
          water_percentage?: number
          weight_kg?: number
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          is_active: boolean | null
          name: string
          subscribed_at: string | null
        }
        Insert: {
          email: string
          id?: string
          is_active?: boolean | null
          name: string
          subscribed_at?: string | null
        }
        Update: {
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string
          subscribed_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      one_time_requests: {
        Row: {
          allergies: string | null
          created_at: string | null
          email: string
          fitness_level: string | null
          goal: string | null
          id: string
          name: string
          notes: string | null
          processed: boolean | null
          source: string | null
        }
        Insert: {
          allergies?: string | null
          created_at?: string | null
          email: string
          fitness_level?: string | null
          goal?: string | null
          id?: string
          name: string
          notes?: string | null
          processed?: boolean | null
          source?: string | null
        }
        Update: {
          allergies?: string | null
          created_at?: string | null
          email?: string
          fitness_level?: string | null
          goal?: string | null
          id?: string
          name?: string
          notes?: string | null
          processed?: boolean | null
          source?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          country: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          has_completed_assessment: boolean | null
          id: string
          is_admin: boolean | null
          is_blocked: boolean | null
          is_online: boolean | null
          last_seen: string | null
          phone: string | null
          phone_country_code: string | null
          referral_source: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          has_completed_assessment?: boolean | null
          id?: string
          is_admin?: boolean | null
          is_blocked?: boolean | null
          is_online?: boolean | null
          last_seen?: string | null
          phone?: string | null
          phone_country_code?: string | null
          referral_source?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          country?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          has_completed_assessment?: boolean | null
          id?: string
          is_admin?: boolean | null
          is_blocked?: boolean | null
          is_online?: boolean | null
          last_seen?: string | null
          phone?: string | null
          phone_country_code?: string | null
          referral_source?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount: number
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          payment_method: string | null
          payment_status: string
          purchased_at: string | null
          service_id: string
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          payment_method?: string | null
          payment_status?: string
          purchased_at?: string | null
          service_id: string
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          payment_method?: string | null
          payment_status?: string
          purchased_at?: string | null
          service_id?: string
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchases_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          created_at: string | null
          description: string | null
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      service_plans: {
        Row: {
          consultation_id: string | null
          created_at: string
          description: string | null
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          is_active: boolean | null
          plan_type: string
          purchase_id: string
          service_id: string
          title: string
          updated_at: string
          uploaded_by: string
          user_id: string
        }
        Insert: {
          consultation_id?: string | null
          created_at?: string
          description?: string | null
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          is_active?: boolean | null
          plan_type?: string
          purchase_id: string
          service_id: string
          title: string
          updated_at?: string
          uploaded_by: string
          user_id: string
        }
        Update: {
          consultation_id?: string | null
          created_at?: string
          description?: string | null
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          is_active?: boolean | null
          plan_type?: string
          purchase_id?: string
          service_id?: string
          title?: string
          updated_at?: string
          uploaded_by?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_plans_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_plans_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_plans_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_resources: {
        Row: {
          created_at: string | null
          id: string
          is_default: boolean | null
          resource_id: string
          service_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          resource_id: string
          service_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          resource_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_resources_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_resources_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          duration_weeks: number | null
          id: string
          includes_meet: boolean | null
          includes_nutrition: boolean | null
          includes_workout: boolean | null
          is_active: boolean | null
          price: number
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          duration_weeks?: number | null
          id?: string
          includes_meet?: boolean | null
          includes_nutrition?: boolean | null
          includes_workout?: boolean | null
          is_active?: boolean | null
          price?: number
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          duration_weeks?: number | null
          id?: string
          includes_meet?: boolean | null
          includes_nutrition?: boolean | null
          includes_workout?: boolean | null
          is_active?: boolean | null
          price?: number
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      text_testimonials: {
        Row: {
          company: string | null
          content: string
          created_at: string
          email: string
          id: string
          is_approved: boolean | null
          is_featured: boolean | null
          name: string
          phone: string
          rating: number
          role: string
          updated_at: string
          user_id: string | null
          website: string | null
        }
        Insert: {
          company?: string | null
          content: string
          created_at?: string
          email: string
          id?: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          name: string
          phone: string
          rating: number
          role: string
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Update: {
          company?: string | null
          content?: string
          created_at?: string
          email?: string
          id?: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          name?: string
          phone?: string
          rating?: number
          role?: string
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_current_user_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
