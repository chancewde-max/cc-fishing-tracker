// Gulf Bite — Supabase client (Phase B: hosted hotspots + catches).
// Values come from Vite env vars (set in Vercel):
//   VITE_SUPABASE_URL   https://rjvhzegsmfmnpphlcwyj.supabase.co
//   VITE_SUPABASE_ANON  the publishable/anon key
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL || 'https://rjvhzegsmfmnpphlcwyj.supabase.co';
const anon = import.meta.env.VITE_SUPABASE_ANON || 'sb_publishable_nh2rbIymWQ6CQjEEh-UuKQ_O46p_0YU';

export const supabase = createClient(url, anon);
export const isSupabaseConfigured = true;
