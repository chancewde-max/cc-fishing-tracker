import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import { isAuthError } from './useHotspots';

/**
 * Loads + writes catches for a single hotspot.
 * Returns { catches, loading, error, isAuthError, addCatch, removeCatch }.
 *
 * hotspotId === null/undefined => no query (e.g. nothing selected yet).
 */
export function useCatches(hotspotId) {
  const [catches, setCatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refetch = useCallback(async () => {
    if (!hotspotId) {
      setCatches([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('catches')
      .select('id, hotspot_id, species, caught_at, length_in, note')
      .eq('hotspot_id', hotspotId)
      .order('caught_at', { ascending: false });
    if (error) {
      setError(error);
      setCatches([]);
      setLoading(false);
      return;
    }
    setError(null);
    setCatches(
      (data || []).map((r) => ({
        id: r.id,
        hotspot_id: r.hotspot_id,
        species: r.species,
        caught_at: r.caught_at,
        length_in: r.length_in,
        note: r.note ?? '',
      }))
    );
    setLoading(false);
  }, [hotspotId]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const addCatch = useCallback(
    async ({ hotspot_id, species, caught_at, length_in, note }) => {
      const payload = {
        hotspot_id,
        species,
        caught_at: caught_at || new Date().toISOString(),
        length_in: length_in == null || length_in === '' ? null : Number(length_in),
        note: note ?? '',
      };
      const { error } = await supabase.from('catches').insert(payload);
      if (error) {
        setError(error);
        return { error };
      }
      await refetch();
      return { error: null };
    },
    [refetch]
  );

  const removeCatch = useCallback(
    async (id) => {
      const { error } = await supabase.from('catches').delete().eq('id', id);
      if (error) {
        setError(error);
        return { error };
      }
      await refetch();
      return { error: null };
    },
    [refetch]
  );

  return {
    catches,
    loading,
    error,
    isAuthError: isAuthError(error),
    addCatch,
    removeCatch,
  };
}
