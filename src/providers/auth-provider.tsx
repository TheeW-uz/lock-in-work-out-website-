'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  is_admin: boolean;
  is_frozen: boolean;
  height?: number;
  weight?: number;
  age?: number;
  gender?: string;
  fitness_goal?: string;
  experience_level?: string;
  available_equipment?: string[];
  workout_days?: string[];
  injuries?: string;
  preferred_style?: string;
  available_time?: number;
  created_at: string;
}

export interface LeaderboardStats {
  user_id: string;
  points: number;
  streak: number;
  completed_count: number;
  missed_count: number;
  last_active?: string;
}

export interface BanInfo {
  id: string;
  user_id: string;
  reason: string;
  banned_until?: string;
  created_at: string;
}

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  stats: LeaderboardStats | null;
  loading: boolean;
  isBanned: boolean;
  banInfo: BanInfo | null;
  isFrozen: boolean;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  stats: null,
  loading: true,
  isBanned: false,
  banInfo: null,
  isFrozen: false,
  theme: 'dark',
  toggleTheme: () => {},
  refreshProfile: async () => {},
  signOut: async () => {},
});

/**
 * Ensures a profile row exists for the given user.
 * If not found, auto-creates one from auth.users metadata.
 * Also ensures leaderboard_stats row exists.
 */
async function ensureProfile(authUser: any): Promise<UserProfile | null> {
  if (!authUser?.id) return null;

  // Try to fetch existing profile
  const { data: existing, error: fetchErr } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (existing && !fetchErr) return existing as UserProfile;

  // Profile missing — auto-create it
  // The trigger should have done this, but in case of email verification or
  // existing users who signed up before the trigger was added, we create it here.
  const username =
    authUser.user_metadata?.username ||
    authUser.user_metadata?.full_name ||
    authUser.email?.split('@')[0] ||
    'athlete';

  const { data: created, error: createErr } = await supabase
    .from('profiles')
    .insert({
      id: authUser.id,
      username,
      email: authUser.email || '',
      is_admin: false,
      is_frozen: false,
    })
    .select()
    .single();

  if (createErr) {
    // Profile might have been created between our check and insert (race)
    // Try to fetch again
    const { data: retry } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .single();
    return retry as UserProfile | null;
  }

  // Also ensure leaderboard_stats row
  await supabase.from('leaderboard_stats').upsert(
    { user_id: authUser.id, points: 0, streak: 0, completed_count: 0, missed_count: 0 },
    { onConflict: 'user_id', ignoreDuplicates: true }
  );

  return created as UserProfile;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<LeaderboardStats | null>(null);
  const [isBanned, setIsBanned] = useState(false);
  const [banInfo, setBanInfo] = useState<BanInfo | null>(null);
  const [isFrozen, setIsFrozen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const router = useRouter();
  const pathname = usePathname();

  // Load theme
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedTheme = localStorage.getItem('lockin_theme') as 'dark' | 'light';
    const activeTheme = savedTheme || 'dark';
    setTheme(activeTheme);
    document.documentElement.setAttribute('data-theme', activeTheme);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('lockin_theme', nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const fetchProfileAndStats = async (authUser: any) => {
    if (!authUser?.id) return;

    try {
      // Ensure profile exists (creates if missing)
      const prof = await ensureProfile(authUser);
      if (prof) {
        setProfile(prof);
        setIsFrozen(prof.is_frozen ?? false);
      }

      // Fetch leaderboard stats
      const { data: st } = await supabase
        .from('leaderboard_stats')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      if (st) setStats(st);

      // Check for bans
      const { data: bans } = await supabase
        .from('bans')
        .select('*')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false });

      if (bans && bans.length > 0) {
        const activeBan = bans.find(b => {
          if (!b.banned_until) return true;
          return new Date(b.banned_until) > new Date();
        });
        if (activeBan) {
          setIsBanned(true);
          setBanInfo(activeBan);
        } else {
          setIsBanned(false);
          setBanInfo(null);
        }
      } else {
        setIsBanned(false);
        setBanInfo(null);
      }
    } catch (err) {
      console.error('[AuthProvider] Error fetching profile/stats:', err);
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfileAndStats(user);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Initialize from session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);
        await fetchProfileAndStats(session.user);
      } else {
        setUser(null);
        setProfile(null);
        setStats(null);
      }
      setLoading(false);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (session?.user) {
        setUser(session.user);
        await fetchProfileAndStats(session.user);
      } else {
        setUser(null);
        setProfile(null);
        setStats(null);
        setIsBanned(false);
        setIsFrozen(false);
        setBanInfo(null);
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Route protection
  useEffect(() => {
    if (loading) return;

    const isAdminRoute = pathname.startsWith('/admin');
    const isAuthRoute = pathname === '/login' || pathname === '/admin/login';

    if (!user && !isAuthRoute && !isAdminRoute) {
      router.replace('/login');
    } else if (user && pathname === '/login') {
      router.replace('/dashboard');
    }
  }, [user, loading, pathname, router]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setStats(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        stats,
        loading,
        isBanned,
        banInfo,
        isFrozen,
        theme,
        toggleTheme,
        refreshProfile,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
