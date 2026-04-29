import type { Database } from '@/types/database';

import { supabase } from './supabase';

/** A row from the `clubs` table. `location` is a PostGIS geography and opaque on the client. */
export type Club = Database['public']['Tables']['clubs']['Row'];

/** What `clubs_within_radius` returns: club row sans `location`, with lat/lng + distance. */
export type ClubWithDistance = Database['public']['Functions']['clubs_within_radius']['Returns'][number];

export async function listClubsWithinRadius(args: {
  lat: number;
  lng: number;
  radiusMiles: number;
}): Promise<ClubWithDistance[]> {
  const { data, error } = await supabase.rpc('clubs_within_radius', {
    lat: args.lat,
    lng: args.lng,
    radius_miles: args.radiusMiles,
  });
  if (error) throw error;
  return data ?? [];
}

// All approved clubs for the no-location default map view. Uses the existing
// `clubs_within_radius` RPC with a continental US center and a radius wide
// enough to cover everywhere — avoids a new migration for a separate "all
// approved" RPC. Capped at the RPC's limit of 200, fine for current scale.
export async function listAllClubs(): Promise<ClubWithDistance[]> {
  return listClubsWithinRadius({ lat: 39, lng: -98, radiusMiles: 4000 });
}

export async function getClubBySlug(slug: string): Promise<Club | null> {
  const { data, error } = await supabase
    .from('clubs')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'approved')
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listClubsForOwner(userId: string): Promise<Club[]> {
  const { data, error } = await supabase
    .from('clubs')
    .select('*')
    .eq('claimed_by', userId)
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function updateClub(
  id: string,
  patch: Database['public']['Tables']['clubs']['Update'],
): Promise<Club> {
  const { data, error } = await supabase
    .from('clubs')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function submitClaim(args: {
  clubId: string;
  notes?: string;
}): Promise<void> {
  const { error } = await supabase.from('claims').insert({
    club_id: args.clubId,
    notes: args.notes ?? null,
  });
  if (error) throw error;
}
