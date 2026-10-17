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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      alumni: {
        Row: {
          achievements: string[]
          avatar_url: string | null
          club_id: string | null
          cohort: string
          created_at: string
          current_company: string | null
          current_location: string | null
          current_role: string | null
          display_name: string
          display_order: number
          id: string
          is_active: boolean
          is_featured: boolean
          linkedin_url: string | null
          message: string | null
          profile_id: string | null
          society_role: string
          updated_at: string
        }
        Insert: {
          achievements?: string[]
          avatar_url?: string | null
          club_id?: string | null
          cohort: string
          created_at?: string
          current_company?: string | null
          current_location?: string | null
          current_role?: string | null
          display_name: string
          display_order?: number
          id?: string
          is_active?: boolean
          is_featured?: boolean
          linkedin_url?: string | null
          message?: string | null
          profile_id?: string | null
          society_role: string
          updated_at?: string
        }
        Update: {
          achievements?: string[]
          avatar_url?: string | null
          club_id?: string | null
          cohort?: string
          created_at?: string
          current_company?: string | null
          current_location?: string | null
          current_role?: string | null
          display_name?: string
          display_order?: number
          id?: string
          is_active?: boolean
          is_featured?: boolean
          linkedin_url?: string | null
          message?: string | null
          profile_id?: string | null
          society_role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alumni_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alumni_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      clubs: {
        Row: {
          activities: string[]
          contact_links: Json
          created_at: string
          description: string | null
          display_order: number
          focus_areas: string[]
          gallery_image_url: string | null
          hero_image_url: string | null
          homepage_badge: string | null
          homepage_image_url: string | null
          homepage_subtitle: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          promo_video_url: string | null
          purpose_description: string | null
          purpose_title: string | null
          session_image_url: string | null
          sessions: Json
          slug: string
          tagline: string | null
          tracks: Json
          updated_at: string
        }
        Insert: {
          activities?: string[]
          contact_links?: Json
          created_at?: string
          description?: string | null
          display_order?: number
          focus_areas?: string[]
          gallery_image_url?: string | null
          hero_image_url?: string | null
          homepage_badge?: string | null
          homepage_image_url?: string | null
          homepage_subtitle?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          promo_video_url?: string | null
          purpose_description?: string | null
          purpose_title?: string | null
          session_image_url?: string | null
          sessions?: Json
          slug: string
          tagline?: string | null
          tracks?: Json
          updated_at?: string
        }
        Update: {
          activities?: string[]
          contact_links?: Json
          created_at?: string
          description?: string | null
          display_order?: number
          focus_areas?: string[]
          gallery_image_url?: string | null
          hero_image_url?: string | null
          homepage_badge?: string | null
          homepage_image_url?: string | null
          homepage_subtitle?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          promo_video_url?: string | null
          purpose_description?: string | null
          purpose_title?: string | null
          session_image_url?: string | null
          sessions?: Json
          slug?: string
          tagline?: string | null
          tracks?: Json
          updated_at?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          club_id: string | null
          created_at: string
          email: string
          handled_at: string | null
          handled_by: string | null
          id: string
          message: string
          name: string
          status: string
          topic: string
          updated_at: string
        }
        Insert: {
          club_id?: string | null
          created_at?: string
          email: string
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          message: string
          name: string
          status?: string
          topic?: string
          updated_at?: string
        }
        Update: {
          club_id?: string | null
          created_at?: string
          email?: string
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          message?: string
          name?: string
          status?: string
          topic?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_submissions_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_submissions_handled_by_fkey"
            columns: ["handled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          event_id: string
          id: string
          notes: string | null
          registered_at: string
          status: string
          user_id: string
        }
        Insert: {
          event_id: string
          id?: string
          notes?: string | null
          registered_at?: string
          status?: string
          user_id: string
        }
        Update: {
          event_id?: string
          id?: string
          notes?: string | null
          registered_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          capacity: number | null
          club_id: string | null
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          event_type: string | null
          id: string
          is_public: boolean
          registration_closes_at: string | null
          registration_opens_at: string | null
          slug: string
          starts_at: string
          status: string
          summary: string | null
          title: string
          updated_at: string
          venue: string | null
        }
        Insert: {
          capacity?: number | null
          club_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          event_type?: string | null
          id?: string
          is_public?: boolean
          registration_closes_at?: string | null
          registration_opens_at?: string | null
          slug: string
          starts_at: string
          status?: string
          summary?: string | null
          title: string
          updated_at?: string
          venue?: string | null
        }
        Update: {
          capacity?: number | null
          club_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          event_type?: string | null
          id?: string
          is_public?: boolean
          registration_closes_at?: string | null
          registration_opens_at?: string | null
          slug?: string
          starts_at?: string
          status?: string
          summary?: string | null
          title?: string
          updated_at?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_attendance: {
        Row: {
          marked_at: string | null
          marked_by: string | null
          member_name: string
          session_id: string
          status: string
          user_id: string
        }
        Insert: {
          marked_at?: string | null
          marked_by?: string | null
          member_name: string
          session_id: string
          status?: string
          user_id: string
        }
        Update: {
          marked_at?: string | null
          marked_by?: string | null
          member_name?: string
          session_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_attendance_marked_by_fkey"
            columns: ["marked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "meeting_attendance_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_attendance_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_attendance_sessions: {
        Row: {
          club_id: string | null
          created_at: string
          created_by: string
          id: string
          meeting_date: string
          meeting_time: string | null
          name: string
          notes: string | null
          scope: string
          venue: string | null
        }
        Insert: {
          club_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          meeting_date: string
          meeting_time?: string | null
          name: string
          notes?: string | null
          scope: string
          venue?: string | null
        }
        Update: {
          club_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          meeting_date?: string
          meeting_time?: string | null
          name?: string
          notes?: string | null
          scope?: string
          venue?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meeting_attendance_sessions_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meeting_attendance_sessions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      memberships: {
        Row: {
          club_id: string | null
          created_at: string
          id: string
          joined_at: string
          position_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          club_id?: string | null
          created_at?: string
          id?: string
          joined_at?: string
          position_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          club_id?: string | null
          created_at?: string
          id?: string
          joined_at?: string
          position_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      network_diagnostic_sessions: {
        Row: {
          consent_version: string
          country_code: string | null
          created_at: string
          downlink_bucket: string
          effective_type: string
          expires_at: string | null
          region_code: string | null
          session_id: string
          user_id: string | null
        }
        Insert: {
          consent_version: string
          country_code?: string | null
          created_at?: string
          downlink_bucket: string
          effective_type: string
          expires_at?: never
          region_code?: string | null
          session_id: string
          user_id?: string | null
        }
        Update: {
          consent_version?: string
          country_code?: string | null
          created_at?: string
          downlink_bucket?: string
          effective_type?: string
          expires_at?: never
          region_code?: string | null
          session_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "network_diagnostic_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      permissions: {
        Row: {
          description: string
          key: string
        }
        Insert: {
          description: string
          key: string
        }
        Update: {
          description?: string
          key?: string
        }
        Relationships: []
      }
      positions: {
        Row: {
          club_id: string | null
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          name: string
          role_id: string
        }
        Insert: {
          club_id?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name: string
          role_id: string
        }
        Update: {
          club_id?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          name?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "positions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      private_profiles: {
        Row: {
          id: string
          phone: string | null
          student_id: string | null
          updated_at: string
        }
        Insert: {
          id: string
          phone?: string | null
          student_id?: string | null
          updated_at?: string
        }
        Update: {
          id?: string
          phone?: string | null
          student_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "private_profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          department: string | null
          full_name: string
          id: string
          updated_at: string
          year_of_study: number | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          full_name?: string
          id: string
          updated_at?: string
          year_of_study?: number | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          department?: string | null
          full_name?: string
          id?: string
          updated_at?: string
          year_of_study?: number | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          permission_key: string
          role_id: string
        }
        Insert: {
          permission_key: string
          role_id: string
        }
        Update: {
          permission_key?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_key_fkey"
            columns: ["permission_key"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_system: boolean
          name: string
          scope: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name: string
          scope: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_system?: boolean
          name?: string
          scope?: string
        }
        Relationships: []
      }
      site_content: {
        Row: {
          content: Json
          content_type: string
          created_at: string
          created_by: string | null
          display_order: number
          id: string
          is_active: boolean
          is_public: boolean
          slug: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content?: Json
          content_type: string
          created_at?: string
          created_by?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          is_public?: boolean
          slug: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: Json
          content_type?: string
          created_at?: string
          created_by?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          is_public?: boolean
          slug?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_content_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_content_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          avatar_url: string | null
          biography: Json
          birthday_day: number | null
          birthday_month: number | null
          categories: string[]
          club_id: string | null
          created_at: string
          display_name: string
          display_order: number
          id: string
          is_active: boolean
          is_public: boolean
          linkedin_url: string | null
          member_type: string
          profile_id: string | null
          public_contact_url: string | null
          roles: string[]
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          biography?: Json
          birthday_day?: number | null
          birthday_month?: number | null
          categories?: string[]
          club_id?: string | null
          created_at?: string
          display_name: string
          display_order?: number
          id?: string
          is_active?: boolean
          is_public?: boolean
          linkedin_url?: string | null
          member_type?: string
          profile_id?: string | null
          public_contact_url?: string | null
          roles?: string[]
          summary?: string
          title: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          biography?: Json
          birthday_day?: number | null
          birthday_month?: number | null
          categories?: string[]
          club_id?: string | null
          created_at?: string
          display_name?: string
          display_order?: number
          id?: string
          is_active?: boolean
          is_public?: boolean
          linkedin_url?: string | null
          member_type?: string
          profile_id?: string | null
          public_contact_url?: string | null
          roles?: string[]
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_role_assignments: {
        Row: {
          club_id: string | null
          created_at: string
          granted_by: string | null
          id: string
          role_id: string
          user_id: string
        }
        Insert: {
          club_id?: string | null
          created_at?: string
          granted_by?: string | null
          id?: string
          role_id: string
          user_id: string
        }
        Update: {
          club_id?: string | null
          created_at?: string
          granted_by?: string | null
          id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_role_assignments_club_id_fkey"
            columns: ["club_id"]
            isOneToOne: false
            referencedRelation: "clubs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_role_assignments_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_role_assignments_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_role_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_add_society_member: { Args: { p_email: string }; Returns: string }
      admin_create_role: {
        Args: {
          p_description: string
          p_name: string
          p_permission_keys: string[]
          p_scope: string
        }
        Returns: string
      }
      admin_delete_role: { Args: { p_role_id: string }; Returns: undefined }
      admin_replace_role_permissions: {
        Args: { p_permission_keys: string[]; p_role_id: string }
        Returns: undefined
      }
      list_my_auth_sessions: {
        Args: Record<PropertyKey, never>
        Returns: {
          is_current: boolean
          last_refreshed_at: string
          total_sessions: number
          session_created_at: string
          user_agent: string | null
        }[]
      },
      create_meeting_attendance_session: {
        Args: {
          p_club_id: string | null
          p_meeting_date: string
          p_meeting_time: string | null
          p_name: string
          p_notes: string | null
          p_scope: string
          p_venue: string | null
        }
        Returns: string
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
