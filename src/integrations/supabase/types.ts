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
      borrow_records: {
        Row: {
          actual_return_date: string | null
          borrow_date: string
          borrower_contact: string
          borrower_name: string
          expected_return_date: string | null
          id: string
          item_id: string
          item_name: string
          notes: string | null
          quantity_borrowed: number
          status: string
          user_id: string
        }
        Insert: {
          actual_return_date?: string | null
          borrow_date?: string
          borrower_contact: string
          borrower_name: string
          expected_return_date?: string | null
          id?: string
          item_id: string
          item_name: string
          notes?: string | null
          quantity_borrowed: number
          status?: string
          user_id: string
        }
        Update: {
          actual_return_date?: string | null
          borrow_date?: string
          borrower_contact?: string
          borrower_name?: string
          expected_return_date?: string | null
          id?: string
          item_id?: string
          item_name?: string
          notes?: string | null
          quantity_borrowed?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "borrow_records_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "stock_items"
            referencedColumns: ["id"]
          },
        ]
      }
      course_items: {
        Row: {
          course_id: string
          created_at: string
          id: string
          item_name: string
          notes: string | null
          quantity_outstocked: number
          quantity_reserved: number
          quantity_returned: number
          status: Database["public"]["Enums"]["course_item_status"]
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          item_name: string
          notes?: string | null
          quantity_outstocked?: number
          quantity_reserved: number
          quantity_returned?: number
          status?: Database["public"]["Enums"]["course_item_status"]
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          item_name?: string
          notes?: string | null
          quantity_outstocked?: number
          quantity_reserved?: number
          quantity_returned?: number
          status?: Database["public"]["Enums"]["course_item_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_items_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          course_date: string
          course_name: string
          created_at: string
          description: string | null
          id: string
          instructor: string | null
          status: Database["public"]["Enums"]["course_status"]
          updated_at: string
        }
        Insert: {
          course_date: string
          course_name: string
          created_at?: string
          description?: string | null
          id?: string
          instructor?: string | null
          status?: Database["public"]["Enums"]["course_status"]
          updated_at?: string
        }
        Update: {
          course_date?: string
          course_name?: string
          created_at?: string
          description?: string | null
          id?: string
          instructor?: string | null
          status?: Database["public"]["Enums"]["course_status"]
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      purchase_items: {
        Row: {
          course_tag: string | null
          created_at: string
          id: string
          item_name: string
          link: string | null
          price: number | null
          quantity: number
          status: string
          updated_at: string
          user_id: string
          where_to_buy: string | null
        }
        Insert: {
          course_tag?: string | null
          created_at?: string
          id?: string
          item_name: string
          link?: string | null
          price?: number | null
          quantity?: number
          status?: string
          updated_at?: string
          user_id: string
          where_to_buy?: string | null
        }
        Update: {
          course_tag?: string | null
          created_at?: string
          id?: string
          item_name?: string
          link?: string | null
          price?: number | null
          quantity?: number
          status?: string
          updated_at?: string
          user_id?: string
          where_to_buy?: string | null
        }
        Relationships: []
      }
      stock_items: {
        Row: {
          course_tag: string | null
          created_at: string
          id: string
          item_name: string
          location: string | null
          purchase_price: number | null
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          course_tag?: string | null
          created_at?: string
          id?: string
          item_name: string
          location?: string | null
          purchase_price?: number | null
          quantity?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          course_tag?: string | null
          created_at?: string
          id?: string
          item_name?: string
          location?: string | null
          purchase_price?: number | null
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stock_transactions: {
        Row: {
          id: string
          item_id: string
          item_name: string
          performed_by: string
          quantity: number
          reason: string
          timestamp: string
          type: string
          user_id: string
        }
        Insert: {
          id?: string
          item_id: string
          item_name: string
          performed_by: string
          quantity: number
          reason: string
          timestamp?: string
          type: string
          user_id: string
        }
        Update: {
          id?: string
          item_id?: string
          item_name?: string
          performed_by?: string
          quantity?: number
          reason?: string
          timestamp?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_transactions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "stock_items"
            referencedColumns: ["id"]
          },
        ]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "staff" | "user" | "viewer"
      course_item_status: "reserved" | "returned" | "outstocked" | "partial"
      course_status: "planned" | "in_progress" | "completed" | "cancelled"
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
      app_role: ["admin", "staff", "user", "viewer"],
      course_item_status: ["reserved", "returned", "outstocked", "partial"],
      course_status: ["planned", "in_progress", "completed", "cancelled"],
    },
  },
} as const
