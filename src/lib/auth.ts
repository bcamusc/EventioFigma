import { supabase } from './supabase';
import type { Session } from '@supabase/supabase-js';

// =============================================================================
// Auth
// =============================================================================

export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// =============================================================================
// Favoritos
// =============================================================================

export async function loadFavorites(userId: string): Promise<Set<number>> {
  const { data, error } = await supabase
    .from('user_favorites')
    .select('event_id')
    .eq('user_id', userId);

  if (error) {
    console.error('Error loading favorites:', error);
    return new Set();
  }
  return new Set((data || []).map((r: any) => r.event_id));
}

export async function addFavorite(userId: string, eventId: number): Promise<void> {
  const { error } = await supabase
    .from('user_favorites')
    .insert({ user_id: userId, event_id: eventId });
  if (error) console.error('Error adding favorite:', error);
}

export async function removeFavorite(userId: string, eventId: number): Promise<void> {
  const { error } = await supabase
    .from('user_favorites')
    .delete()
    .eq('user_id', userId)
    .eq('event_id', eventId);
  if (error) console.error('Error removing favorite:', error);
}

// =============================================================================
// Actividad
// =============================================================================

export async function trackActivity(
  userId: string,
  action: 'view' | 'search' | 'favorite' | 'unfavorite' | 'share',
  eventId?: number,
  metadata?: Record<string, any>
): Promise<void> {
  const { error } = await supabase.from('user_activity').insert({
    user_id: userId,
    event_id: eventId ?? null,
    action,
    metadata: metadata ?? {},
  });
  if (error) console.error('Error tracking activity:', error);
}
