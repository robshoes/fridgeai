export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.5';
  };
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      categories: {
        Row: {
          default_shelf_life_days: number | null;
          icon: string;
          id: string;
          name: string;
          unit_family: Database['public']['Enums']['unit_family'];
        };
        Insert: {
          default_shelf_life_days?: number | null;
          icon: string;
          id?: string;
          name: string;
          unit_family: Database['public']['Enums']['unit_family'];
        };
        Update: {
          default_shelf_life_days?: number | null;
          icon?: string;
          id?: string;
          name?: string;
          unit_family?: Database['public']['Enums']['unit_family'];
        };
        Relationships: [];
      };
      inventory_items: {
        Row: {
          category_id: string | null;
          created_at: string;
          expiry_date: string | null;
          expiry_source: Database['public']['Enums']['expiry_source'];
          id: string;
          name: string;
          quantity: number;
          source_scan_id: string | null;
          status: Database['public']['Enums']['inventory_status'];
          unit_family: Database['public']['Enums']['unit_family'];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          category_id?: string | null;
          created_at?: string;
          expiry_date?: string | null;
          expiry_source?: Database['public']['Enums']['expiry_source'];
          id?: string;
          name: string;
          quantity: number;
          source_scan_id?: string | null;
          status?: Database['public']['Enums']['inventory_status'];
          unit_family: Database['public']['Enums']['unit_family'];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          category_id?: string | null;
          created_at?: string;
          expiry_date?: string | null;
          expiry_source?: Database['public']['Enums']['expiry_source'];
          id?: string;
          name?: string;
          quantity?: number;
          source_scan_id?: string | null;
          status?: Database['public']['Enums']['inventory_status'];
          unit_family?: Database['public']['Enums']['unit_family'];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'inventory_items_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'inventory_items_source_scan_id_fkey';
            columns: ['source_scan_id'];
            isOneToOne: false;
            referencedRelation: 'scans';
            referencedColumns: ['id'];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          email: string;
          full_name: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          full_name?: string | null;
          id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          full_name?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      recipe_cache: {
        Row: {
          created_at: string;
          expires_at: string;
          id: string;
          ingredients_hash: string;
          response: Json;
        };
        Insert: {
          created_at?: string;
          expires_at: string;
          id?: string;
          ingredients_hash: string;
          response: Json;
        };
        Update: {
          created_at?: string;
          expires_at?: string;
          id?: string;
          ingredients_hash?: string;
          response?: Json;
        };
        Relationships: [];
      };
      scan_bonus_grants: {
        Row: {
          amount: number;
          granted_at: string;
          id: string;
          user_id: string;
        };
        Insert: {
          amount?: number;
          granted_at?: string;
          id?: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          granted_at?: string;
          id?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      scan_items: {
        Row: {
          category_id: string | null;
          confidence: number;
          detected_name: string;
          id: string;
          quantity_estimate: number;
          scan_id: string;
          status: Database['public']['Enums']['scan_item_status'];
          unit_family: Database['public']['Enums']['unit_family'];
        };
        Insert: {
          category_id?: string | null;
          confidence: number;
          detected_name: string;
          id?: string;
          quantity_estimate: number;
          scan_id: string;
          status?: Database['public']['Enums']['scan_item_status'];
          unit_family: Database['public']['Enums']['unit_family'];
        };
        Update: {
          category_id?: string | null;
          confidence?: number;
          detected_name?: string;
          id?: string;
          quantity_estimate?: number;
          scan_id?: string;
          status?: Database['public']['Enums']['scan_item_status'];
          unit_family?: Database['public']['Enums']['unit_family'];
        };
        Relationships: [
          {
            foreignKeyName: 'scan_items_category_id_fkey';
            columns: ['category_id'];
            isOneToOne: false;
            referencedRelation: 'categories';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'scan_items_scan_id_fkey';
            columns: ['scan_id'];
            isOneToOne: false;
            referencedRelation: 'scans';
            referencedColumns: ['id'];
          },
        ];
      };
      scans: {
        Row: {
          created_at: string;
          id: string;
          image_path: string | null;
          raw_ai_response: Json | null;
          status: Database['public']['Enums']['scan_status'];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          image_path?: string | null;
          raw_ai_response?: Json | null;
          status?: Database['public']['Enums']['scan_status'];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          image_path?: string | null;
          raw_ai_response?: Json | null;
          status?: Database['public']['Enums']['scan_status'];
          user_id?: string;
        };
        Relationships: [];
      };
      shopping_list_items: {
        Row: {
          created_at: string;
          id: string;
          is_checked: boolean;
          name: string;
          quantity: number | null;
          source: Database['public']['Enums']['shopping_list_source'];
          unit_family: Database['public']['Enums']['unit_family'] | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          is_checked?: boolean;
          name: string;
          quantity?: number | null;
          source?: Database['public']['Enums']['shopping_list_source'];
          unit_family?: Database['public']['Enums']['unit_family'] | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          is_checked?: boolean;
          name?: string;
          quantity?: number | null;
          source?: Database['public']['Enums']['shopping_list_source'];
          unit_family?: Database['public']['Enums']['unit_family'] | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_recipe_favorites: {
        Row: {
          created_at: string;
          id: string;
          recipe_snapshot: Json;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          recipe_snapshot: Json;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          recipe_snapshot?: Json;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      expiry_source: 'manual' | 'category_estimate' | 'none';
      inventory_status: 'fresh' | 'expiring_soon' | 'expired' | 'consumed';
      scan_item_status: 'pending' | 'confirmed' | 'edited' | 'rejected';
      scan_status: 'pending' | 'processing' | 'completed' | 'failed';
      shopping_list_source: 'manual' | 'auto_from_recipe';
      unit_family: 'weight' | 'volume' | 'count';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      expiry_source: ['manual', 'category_estimate', 'none'],
      inventory_status: ['fresh', 'expiring_soon', 'expired', 'consumed'],
      scan_item_status: ['pending', 'confirmed', 'edited', 'rejected'],
      scan_status: ['pending', 'processing', 'completed', 'failed'],
      shopping_list_source: ['manual', 'auto_from_recipe'],
      unit_family: ['weight', 'volume', 'count'],
    },
  },
} as const;
