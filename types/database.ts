/**
 * Hand-written Database type matching supabase/migrations/.
 *
 * Regenerate this file from the live local schema once `supabase start` is
 * running and migrations are applied:
 *
 *   supabase gen types typescript --local > types/database.ts
 *
 * The generated output is more thorough (Relationships, generated columns,
 * etc.) and will overwrite this file. Until then, this stub is enough to type
 * the client and queries.
 */

import type { Category, Division, Status } from '@/lib/constants';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type Timestamp = string;

type ClubRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  year_founded: number | null;
  division: Division;
  category: Category;
  /** PostGIS geography(Point, 4326). Opaque from the client; queries should use the clubs_within_radius RPC. */
  location: unknown;
  address_display: string;
  website_url: string | null;
  social_instagram: string | null;
  social_facebook: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  logo_url: string | null;
  brand_color: string | null;
  status: Status;
  claimed_by: string | null;
  created_at: Timestamp;
  updated_at: Timestamp;
};

type ClubInsert = Omit<
  ClubRow,
  'id' | 'status' | 'created_at' | 'updated_at'
> & {
  id?: string;
  status?: Status;
  created_at?: Timestamp;
  updated_at?: Timestamp;
};

type ClubUpdate = Partial<ClubInsert>;

type ClaimRow = {
  id: string;
  club_id: string;
  user_id: string;
  status: Status;
  notes: string | null;
  created_at: Timestamp;
};

type ClaimInsert = Omit<ClaimRow, 'id' | 'status' | 'user_id' | 'created_at'> & {
  id?: string;
  status?: Status;
  user_id?: string;
  created_at?: Timestamp;
};

type ClaimUpdate = Partial<ClaimInsert>;

type ClubWithinRadiusReturn = Omit<ClubRow, 'location' | 'created_at' | 'updated_at'> & {
  latitude: number;
  longitude: number;
  distance_miles: number;
};

export type Database = {
  public: {
    Tables: {
      clubs: {
        Row: ClubRow;
        Insert: ClubInsert;
        Update: ClubUpdate;
        Relationships: [];
      };
      claims: {
        Row: ClaimRow;
        Insert: ClaimInsert;
        Update: ClaimUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      clubs_within_radius: {
        Args: {
          lat: number;
          lng: number;
          radius_miles: number;
        };
        Returns: ClubWithinRadiusReturn[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
