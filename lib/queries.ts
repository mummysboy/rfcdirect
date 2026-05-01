import type { Database } from '@/types/database';

import { STATUS } from './constants';
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

// All approved clubs, with distances computed from `center` (or a continental
// US fallback when no center is given). Uses the existing `clubs_within_radius`
// RPC with a radius wide enough to cover everywhere — avoids a new migration
// for a separate "all approved" RPC. Capped at the RPC's limit of 200, fine
// for current scale.
export async function listAllClubs(
  center?: { lat: number; lng: number },
): Promise<ClubWithDistance[]> {
  return listClubsWithinRadius({
    lat: center?.lat ?? 39,
    lng: center?.lng ?? -98,
    radiusMiles: 4000,
  });
}

export async function getClubBySlug(slug: string): Promise<Club | null> {
  const { data, error } = await supabase
    .from('clubs')
    .select('*')
    .eq('slug', slug)
    .eq('status', STATUS.approved)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Owner-scoped fetch for the edit form. Relies on `clubs_owner_select_own` RLS;
// returns null for non-owners (which the form treats as "redirect to dashboard").
export async function getClubById(id: string): Promise<Club | null> {
  const { data, error } = await supabase
    .from('clubs')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export type CreateClubInsert = Omit<
  Database['public']['Tables']['clubs']['Insert'],
  'id' | 'slug' | 'created_at' | 'updated_at'
>;

// Insert a club with a slug derived from name. On unique-collision (Postgres
// 23505 on slug), retry with `-2` … `-5` suffixes before giving up.
export async function createClub(args: {
  baseSlug: string;
  insert: CreateClubInsert;
}): Promise<Club> {
  for (let i = 1; i <= 5; i++) {
    const slug = i === 1 ? args.baseSlug : `${args.baseSlug}-${i}`;
    const { data, error } = await supabase
      .from('clubs')
      .insert({ ...args.insert, slug })
      .select('*')
      .single();
    if (!error && data) return data;
    const isSlugCollision =
      error?.code === '23505' &&
      ((error.details ?? '').includes('slug') ||
        (error.message ?? '').includes('slug'));
    if (!isSlugCollision) throw error;
  }
  throw new Error(
    'Could not generate a unique slug. Try a slightly different club name.',
  );
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

export type ClaimWithClub = {
  id: string;
  status: string;
  created_at: string;
  club: Pick<Club, 'id' | 'name' | 'slug' | 'status'>;
};

export async function listClaimsForUser(
  userId: string,
): Promise<ClaimWithClub[]> {
  const { data, error } = await supabase
    .from('claims')
    .select('id, status, created_at, club:clubs(id, name, slug, status)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ClaimWithClub[];
}

export type ClubSearchResult = Pick<
  Club,
  'id' | 'name' | 'slug' | 'address_display'
>;

export type PendingClaim =
  Database['public']['Functions']['list_pending_claims_for_admin']['Returns'][number];

export type PendingClub =
  Database['public']['Functions']['list_pending_clubs_for_admin']['Returns'][number];

export async function isAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_admin');
  if (error) throw error;
  return data ?? false;
}

export async function listPendingClaims(): Promise<PendingClaim[]> {
  const { data, error } = await supabase.rpc('list_pending_claims_for_admin');
  if (error) throw error;
  return data ?? [];
}

export async function listPendingClubs(): Promise<PendingClub[]> {
  const { data, error } = await supabase.rpc('list_pending_clubs_for_admin');
  if (error) throw error;
  return data ?? [];
}

export async function approveClaim(claimId: string): Promise<void> {
  const { error } = await supabase.rpc('approve_claim', {
    p_claim_id: claimId,
  });
  if (error) throw error;
}

export async function rejectClaim(claimId: string): Promise<void> {
  const { error } = await supabase.rpc('reject_claim', {
    p_claim_id: claimId,
  });
  if (error) throw error;
}

export async function approveClub(clubId: string): Promise<void> {
  const { error } = await supabase.rpc('approve_club', {
    p_club_id: clubId,
  });
  if (error) throw error;
}

export async function rejectClub(clubId: string): Promise<void> {
  const { error } = await supabase.rpc('reject_club', {
    p_club_id: clubId,
  });
  if (error) throw error;
}

export async function searchClubsByName(
  query: string,
  limit = 20,
): Promise<ClubSearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length === 0) return [];
  const { data, error } = await supabase
    .from('clubs')
    .select('id, name, slug, address_display')
    .ilike('name', `%${trimmed}%`)
    .eq('status', STATUS.approved)
    .is('claimed_by', null)
    .order('name', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
