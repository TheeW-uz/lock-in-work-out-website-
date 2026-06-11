'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { supabase } from '@/lib/supabase';
import {
  Dumbbell,
  Calendar,
  Bot,
  Trophy,
  Settings,
  LogOut,
  Loader2,
  Flame,
  AlertOctagon,
  Lock,
  Globe,
  Send,
  Mail,
  ChevronRight,
  User,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, stats, loading, isBanned, banInfo, isFrozen, signOut } = useAuth();

  const pathname = usePathname();
  const router = useRouter();

  const [historyDays, setHistoryDays] = useState<any[]>([]);
  const [todayWorkout, setTodayWorkout] = useState<string>('Rest Day');
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchSidebarData = async (uid: string) => {
    try {
      setLoadingHistory(true);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayName = days[new Date().getDay()];

      const { data: planData } = await supabase
        .from('weekly_plans')
        .select('*')
        .eq('user_id', uid)
        .eq('day_of_week', todayName)
        .single();

      if (planData) {
        setTodayWorkout(planData.is_rest_day ? 'Rest Day' : planData.workout_name);
      } else {
        setTodayWorkout('No Workout Assigned');
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 13);
      const startDateStr = startDate.toISOString().split('T')[0];

      const { data: logs } = await supabase
        .from('daily_workouts')
        .select('date, status, completion_percentage')
        .eq('user_id', uid)
        .gte('date', startDateStr)
        .order('date', { ascending: true });

      const daysArr = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        const log = logs?.find(l => l.date === dStr);
        daysArr.push({
          date: d,
          dateStr: dStr,
          status: log?.status || 'unlogged',
          pct: log?.completion_percentage || 0,
        });
      }
      setHistoryDays(daysArr);
    } catch (error) {
      console.error('Error fetching sidebar data:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchSidebarData(user.id);

      const channel = supabase
        .channel('sidebar-daily-workouts')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'daily_workouts', filter: `user_id=eq.${user.id}` },
          () => fetchSidebarData(user.id)
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#08090d]">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  if (isBanned) {
    return (
      <div className="min-h-screen bg-[#08090d] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="glass-panel max-w-lg w-full p-8 rounded-3xl text-center shadow-2xl relative z-10">
          <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-red-950/50 border border-red-800 text-red-500 mb-6">
            <AlertOctagon className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Account Banned
          </h1>
          <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
            You are banned until{' '}
            <span className="text-red-400 font-semibold">
              {banInfo?.banned_until ? new Date(banInfo.banned_until).toLocaleString() : 'permanently'}
            </span>.
          </p>
          <div className="bg-[#120a0b] border border-red-950 p-4 rounded-xl mb-8 text-left">
            <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider block mb-1">Reason:</span>
            <p className="text-red-300 text-sm">{banInfo?.reason || 'Violating platform guidelines.'}</p>
          </div>
          <div className="border-t border-zinc-800 pt-6">
            <h3 className="text-white text-sm font-bold mb-4">Contact Admin to Appeal</h3>
            <div className="flex flex-col gap-2 max-w-xs mx-auto text-left text-sm">
              <a href="https://instagram.com/abuwasfound" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors">
                <Globe className="w-4 h-4 text-pink-500" /><span>Instagram: @abuwasfound</span>
              </a>
              <a href="https://t.me/Abu_wsg" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors">
                <Send className="w-4 h-4 text-sky-400" /><span>Telegram: @Abu_wsg</span>
              </a>
              <a href="mailto:abubakrfazliddinov768@gmail.com" className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors">
                <Mail className="w-4 h-4 text-emerald-400" /><span>abubakrfazliddinov768@gmail.com</span>
              </a>
            </div>
          </div>
          <button onClick={signOut} className="mt-8 text-zinc-500 hover:text-zinc-300 text-sm font-semibold flex items-center gap-2 mx-auto cursor-pointer">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>
    );
  }

  if (isFrozen) {
    return (
      <div className="min-h-screen bg-[#08090d] flex items-center justify-center p-4 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="glass-panel max-w-lg w-full p-8 rounded-3xl text-center shadow-2xl relative z-10">
          <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-cyan-950/50 border border-cyan-800 text-cyan-400 mb-6">
            <Lock className="w-12 h-12" />
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            Account Frozen
          </h1>
          <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
            Your account is frozen. Contact admin to restore access.
          </p>
          <button onClick={signOut} className="mt-4 text-zinc-500 hover:text-zinc-300 text-sm font-semibold flex items-center gap-2 mx-auto cursor-pointer">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Dumbbell },
    { name: 'Weekly Split', path: '/planner', icon: Calendar },
    { name: 'Progress', path: '/progress', icon: BarChart3 },
    { name: 'Coach AI', path: '/coach', icon: Bot },
    { name: 'Leaderboard', path: '/leaderboard', icon: Trophy },
  ];

  const avatarLetters = profile?.username
    ? profile.username.substring(0, 2).toUpperCase()
    : user?.email?.substring(0, 2).toUpperCase() || 'U';

  return (
    <div className="flex h-screen w-screen bg-[#08090d] text-white overflow-hidden">

      {/* LEFT SIDEBAR */}
      <aside className="w-[var(--sidebar-width)] h-full bg-[#0d1017] border-r border-zinc-900 flex flex-col justify-between shrink-0 select-none">

        {/* Top Header */}
        <div className="p-5 border-b border-zinc-900/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-500/15">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white block leading-none" style={{ fontFamily: 'var(--font-display)' }}>
                LOCK-IN
              </span>
              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest block mt-0.5">
                AI Fitness
              </span>
            </div>
          </div>

          {/* Points & Streak HUD */}
          <div className="bg-[#131722]/50 border border-zinc-800/80 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-violet-950/30 text-violet-400 p-1.5 rounded-lg border border-violet-900/30">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <span className="text-zinc-500 text-[9px] uppercase font-semibold block leading-none">Points</span>
                <span className="text-sm font-bold text-white leading-none mt-1 block">{stats?.points ?? 0}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="bg-amber-950/30 text-amber-500 p-1.5 rounded-lg border border-amber-900/30">
                <Flame className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <span className="text-zinc-500 text-[9px] uppercase font-semibold block leading-none">Streak</span>
                <span className="text-sm font-bold text-white leading-none mt-1 block">{stats?.streak ?? 0}d</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-violet-600/10 text-violet-400 border border-violet-800/30 font-semibold'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/30 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-violet-400' : 'text-zinc-500'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Today's Workout Quick Widget */}
          <div className="px-3">
            <span className="text-zinc-500 text-[9px] uppercase font-bold tracking-widest block mb-2">
              Today's Routine
            </span>
            <Link
              href="/dashboard"
              className="block bg-[#131722]/30 border border-zinc-900/80 rounded-xl p-3 hover:border-zinc-800 hover:bg-[#131722]/50 transition-all duration-200"
            >
              <span className="text-white text-xs font-semibold block truncate">{todayWorkout}</span>
              <span className="text-[10px] text-zinc-500 mt-1 block">
                {todayWorkout === 'Rest Day' ? 'Focus on recovery' : 'Click to track workout'}
              </span>
            </Link>
          </div>

          {/* 14-Day History Calendar */}
          <div className="px-3">
            <span className="text-zinc-500 text-[9px] uppercase font-bold tracking-widest block mb-2.5">
              14-Day History
            </span>
            {loadingHistory ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-4 h-4 text-zinc-600 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-1.5">
                {historyDays.map((day, index) => {
                  let dotColor = 'bg-zinc-800 border-zinc-800 text-zinc-500';
                  let tooltip = `${day.dateStr}: Unlogged`;

                  if (day.status === 'completed') {
                    dotColor = 'bg-emerald-950 border-emerald-800 text-emerald-400';
                    tooltip = `${day.dateStr}: Completed`;
                  } else if (day.status === 'partial') {
                    dotColor = 'bg-amber-950/60 border-amber-900 text-amber-500';
                    tooltip = `${day.dateStr}: Partial (${day.pct}%)`;
                  } else if (day.status === 'missed') {
                    dotColor = 'bg-red-950/60 border-red-900 text-red-500';
                    tooltip = `${day.dateStr}: Missed`;
                  }

                  const dayLetter = day.date.toLocaleDateString('en-US', { weekday: 'narrow' });
                  const isToday = day.dateStr === new Date().toISOString().split('T')[0];

                  return (
                    <div
                      key={index}
                      title={tooltip}
                      className={`h-8 flex flex-col items-center justify-center rounded-lg border text-[9px] font-semibold transition-all ${dotColor} ${
                        isToday ? 'ring-1 ring-violet-500 ring-offset-1 ring-offset-[#08090d]' : ''
                      }`}
                    >
                      <span className="opacity-50 text-[8px] leading-none mb-0.5">{dayLetter}</span>
                      <span className="leading-none text-[9px]">{day.date.getDate()}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Bottom User Account Area */}
        <div className="p-3 border-t border-zinc-900/50 bg-[#0c0e14] relative" ref={menuRef}>
          {/* User Account Dropdown Menu */}
          {userMenuOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-[#0f1119] border border-zinc-800 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden z-50 animate-fadeIn">
              {/* User Info Header */}
              <div className="p-4 border-b border-zinc-800/80">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600/40 to-indigo-600/40 border border-violet-800/40 flex items-center justify-center font-bold text-sm text-violet-300">
                    {avatarLetters}
                  </div>
                  <div className="min-w-0">
                    <p className="text-white font-bold text-sm leading-tight truncate">
                      {profile?.username || user?.email?.split('@')[0] || 'Athlete'}
                    </p>
                    <p className="text-zinc-500 text-xs truncate leading-none mt-0.5">
                      {profile?.email || user?.email || ''}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between bg-[#080a10] border border-zinc-900 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <Trophy className="w-3.5 h-3.5 text-violet-400" />
                    <span className="text-xs font-bold text-white">{stats?.points ?? 0} pts</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs font-bold text-white">{stats?.streak ?? 0}d streak</span>
                  </div>
                </div>
              </div>

              {/* Menu Items */}
              <div className="p-2">
                <Link
                  href="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded-xl transition-all cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-zinc-500" />
                  <span>Account Settings</span>
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-600 ml-auto" />
                </Link>

                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    signOut();
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-950/20 rounded-xl transition-all cursor-pointer mt-1"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}

          {/* User Button Trigger */}
          <button
            onClick={() => setUserMenuOpen(prev => !prev)}
            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl transition-all cursor-pointer hover:bg-zinc-800/30 ${
              userMenuOpen ? 'bg-zinc-800/30' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600/30 to-indigo-600/30 border border-violet-800/30 flex items-center justify-center font-bold text-xs text-violet-300 shrink-0">
              {avatarLetters}
            </div>
            <div className="min-w-0 flex-1 text-left">
              <span className="text-xs font-semibold text-white block truncate leading-tight">
                {profile?.username || user?.email?.split('@')[0] || 'Athlete'}
              </span>
              <span className="text-[10px] text-zinc-500 block truncate leading-none mt-0.5">
                {profile?.email || user?.email || ''}
              </span>
            </div>
            <ChevronRight
              className={`w-3.5 h-3.5 text-zinc-600 shrink-0 transition-transform duration-200 ${
                userMenuOpen ? 'rotate-90' : ''
              }`}
            />
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 h-full overflow-hidden flex flex-col bg-[#08090d]">
        {children}
      </main>
    </div>
  );
}
