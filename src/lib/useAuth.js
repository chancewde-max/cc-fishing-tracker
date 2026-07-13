import { useEffect, useState } from 'react';
import { supabase } from './supabase';

/**
 * Thin wrapper around Supabase auth session state.
 * Returns { user, loading, signInWithPassword, signUpWithPassword, signInWithProvider, signOut }.
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signInWithPassword = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { user: data?.user ?? null, error };
  };

  const signUpWithPassword = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    return { user: data?.user ?? null, error };
  };

  const signInWithProvider = async (provider) => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin },
    });
    return { error };
  };

  const signOut = () => supabase.auth.signOut();

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    return { error };
  };

  return {
    user,
    loading,
    signInWithPassword,
    signUpWithPassword,
    signInWithProvider,
    signOut,
    resetPassword,
  };
}
