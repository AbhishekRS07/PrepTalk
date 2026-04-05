"use client";
import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null); // { username }
  const supabase = useMemo(() => createClient(), []);

  const fetchProfile = useCallback(async (email) => {
    if (!email) return;
    try {
      const res = await fetch(`/api/profile?email=${encodeURIComponent(email)}`);
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } catch {}
  }, []);

  useEffect(() => {
    // onAuthStateChange fires immediately with INITIAL_SESSION — no need for
    // a separate getUser() call, which would cause concurrent token refresh
    // and trigger the Web Lock "stolen" error.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user?.email) fetchProfile(session.user.email);
      else setProfile(null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase, fetchProfile]);

  return (
    <AuthContext.Provider value={{ user, loading, supabase, profile, setProfile, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
