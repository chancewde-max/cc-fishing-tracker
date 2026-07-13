import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';

// Real Corpus Christi inshore hotspots (approx lat/lng).
// SEED spots: always shown, never stored in the DB, never removable.
export const DEFAULT_HOTSPOTS = [
  {
    id: 'aransas-pass',
    name: 'Aransas Pass',
    note: 'Jetties & channel mouth — trout, redfish on the outgoing.',
    lat: 27.8338,
    lng: -97.0556,
    user: false,
  },
  {
    id: 'packery-channel',
    name: 'Packery Channel',
    note: 'Inlet between CC Beach & Padre — strong current, drum & reds.',
    lat: 27.6389,
    lng: -97.2356,
    user: false,
  },
  {
    id: 'cc-bay-causeway',
    name: 'CC Bay Causeway',
    note: 'Pillings & lights — classic trout drift near the causeway.',
    lat: 27.7417,
    lng: -97.2497,
    user: false,
  },
  {
    id: 'redfish-bay',
    name: 'Redfish Bay',
    note: 'Grass flats north of the causeway — topwater redfish country.',
    lat: 27.85,
    lng: -97.27,
    user: false,
  },
  {
    id: 'estes-flats',
    name: 'Estes Flats',
    note: 'Shallow turtle-grass flats — sight-cast reds on calm days.',
    lat: 27.62,
    lng: -97.2,
    user: false,
  },
  {
    id: 'bird-island-basin',
    name: 'Bird Island Basin',
    note: 'Sheltered fishing pier inside the ship channel — drum & trout.',
    lat: 27.8197,
    lng: -97.0575,
    user: false,
  },
];

// A Supabase error means "you must be signed in" (RLS blocks anon writes).
export function isAuthError(err) {
  if (!err) return false;
  const code = err.code;
  const msg = (err.message || '').toLowerCase();
  // RLS insert/update/delete failure: new row violates row-level security policy
  if (code === '42501') return true;
  if (err.status === 401 || err.status === 403) return true;
  return (
    /row.?level security|policy|permission|unauthorized|jwt|not authenticated|must be logged/i.test(
      msg
    )
  );
}

/**
 * Loads built-in seed hotspots + user hotspots from Supabase.
 * Returns { hotspots, loading, error, addHotspot, removeHotspot }.
 */
export function useHotspots() {
  const [dbSpots, setDbSpots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('hotspots')
      .select('id, name, note, lat, lng, user_id, created_at')
      .order('created_at', { ascending: true });
    if (error) {
      // Surface the error but keep the map usable (built-ins still render).
      setError(error);
      setDbSpots([]);
      setLoading(false);
      return;
    }
    setError(null);
    setDbSpots(
      (data || []).map((r) => ({
        id: r.id,
        name: r.name,
        note: r.note ?? '',
        lat: r.lat,
        lng: r.lng,
        user: true, // anything coming from the DB is a user-added spot
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const hotspots = [...DEFAULT_HOTSPOTS, ...dbSpots];

  const addHotspot = useCallback(
    async ({ name, note, lat, lng }) => {
      const { error } = await supabase
        .from('hotspots')
        .insert({ name, note: note ?? '', lat, lng });
      if (error) {
        setError(error);
        return { error };
      }
      await refetch();
      return { error: null };
    },
    [refetch]
  );

  const removeHotspot = useCallback(
    async (id) => {
      // Only DB rows can be removed; built-ins are flagged user:false.
      const target = dbSpots.find((s) => s.id === id);
      if (!target) return { error: null };
      const { error } = await supabase.from('hotspots').delete().eq('id', id);
      if (error) {
        setError(error);
        return { error };
      }
      await refetch();
      return { error: null };
    },
    [dbSpots, refetch]
  );

  return { hotspots, loading, error, addHotspot, removeHotspot };
}
