export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      cats: {
        Row: {
          id: string;
          name: string;
          age: number;
          breed: string;
          description: string;
          image_url: string;
          owner_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          age: number;
          breed: string;
          description: string;
          image_url: string;
          owner_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          age?: number;
          breed?: string;
          description?: string;
          image_url?: string;
          owner_id?: string;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          name: string;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          avatar_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          avatar_url?: string | null;
          created_at?: string;
        };
      };
    };
  };
}
