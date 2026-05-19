export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      content: {
        Row: Record<string, Json>;
        Insert: Record<string, Json | undefined>;
        Update: Record<string, Json | undefined>;
      };
      generation_jobs: {
        Row: Record<string, Json>;
        Insert: Record<string, Json | undefined>;
        Update: Record<string, Json | undefined>;
      };
      trending_topics: {
        Row: Record<string, Json>;
        Insert: Record<string, Json | undefined>;
        Update: Record<string, Json | undefined>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
