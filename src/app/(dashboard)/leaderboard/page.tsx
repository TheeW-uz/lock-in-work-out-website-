'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { supabase } from '@/lib/supabase';
import { 
  Trophy, 
  Flame, 
  Award, 
  Calendar, 
  Mail, 
  Send, 
  Globe, 
  TrendingUp, 
  TrendingDown, 
  HelpCircle, 
  Loader2, 
  User,
  Quote,
  ShieldAlert
} from 'lucide-react';

interface LeaderboardUser {
  user_id: string;
  points: number;
  streak: number;
  completed_count: number;
  missed_count: number;
  profiles: {
    username: string;
    email: string;
  };
}

interface PointLog {
  id: string;
  date: string;
  points: number;
  description: string;
  category: string;
  created_at: string;
}

const MOTIVATIONAL_QUOTES = [
  "No citizen has a right to be an amateur in the matter of physical training. What a disgrace it is for a man to grow old without seeing the beauty and strength of which his body is capable. — Socrates",
  "If you want something you've never had, you must be willing to do something you've never done. — Thomas Jefferson",
  "The iron never lies to you. You can walk outside and listen to all kinds of talk... but two hundred pounds is always two hundred pounds. — Henry Rollins",
  "Success is usually the culmination of controlling failure. — Sylvester Stallone",
  "Strength does not come from winning. Your struggles develop your strengths. — Arnold Schwarzenegger",
  "We are what we repeatedly do. Excellence, then, is not an act, but a habit. — Aristotle"
];

export default function LeaderboardPage() {
  const { user, profile, stats } = useAuth();
  
  const [competitors, setCompetitors] = useState<LeaderboardUser[]>([]);
  const [pointHistory, setPointHistory] = useState<PointLog[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [quote, setQuote] = useState('');
  const [loading, setLoading] = useState(true);

  // 1. Fetch quote
  useEffect(() => {
    const randomQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
    setQuote(randomQuote);
  }, []);

  const fetchLeaderboardData = async () => {
    try {
      setLoading(true);

      // Fetch top 5 users based on points
      const { data: leaderboard, error: lbErr } = await supabase
        .from('leaderboard_stats')
        .select(`
          user_id,
          points,
          streak,
          completed_count,
          missed_count,
          profiles (
            username,
            email
          )
        `)
        .order('points', { ascending: false })
        .limit(5);

      if (lbErr) throw lbErr;
      setCompetitors((leaderboard as any) || []);

      if (user?.id) {
        // Fetch all rankings to compute logged-in user rank
        const { data: allStats } = await supabase
          .from('leaderboard_stats')
          .select('user_id, points')
          .order('points', { ascending: false });

        if (allStats) {
          const rankIdx = allStats.findIndex(s => s.user_id === user.id);
          setUserRank(rankIdx !== -1 ? rankIdx + 1 : null);
        }

        // Fetch user point history
        const { data: history, error: histErr } = await supabase
          .from('points_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (!histErr && history) {
          setPointHistory(history);
        }
      }
    } catch (err) {
      console.error('Error loading leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboardData();
  }, [user]);

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 md:px-10">
      
      {/* HEADER */}
      <header className="mb-8 border-b border-zinc-900 pb-6">
        <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider block">
          Arena Standings
        </span>
        <h1 className="text-3xl font-extrabold text-white mt-1" style={{ fontFamily: 'var(--font-display)' }}>
          Leaderboard
        </h1>
      </header>

      {/* MOTIVATIONAL QUOTE CARD */}
      <div className="glass-panel p-6 rounded-2xl border-zinc-900 mb-8 relative overflow-hidden flex gap-4 items-start">
        <div className="absolute top-0 right-0 p-8 opacity-5 text-zinc-400 pointer-events-none">
          <Quote className="w-24 h-24" />
        </div>
        <Quote className="w-8 h-8 text-violet-500 shrink-0 mt-1" />
        <div className="space-y-1">
          <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Quote of the Day</span>
          <p className="text-zinc-300 text-sm leading-relaxed italic">{quote}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-3" />
          <p className="text-zinc-500 text-sm">Loading leaderboard rankings...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* LEADERBOARD LIST - TOP 5 */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
              <Trophy className="w-5 h-5 text-amber-500" />
              <span>Top 5 Competitors</span>
            </h2>

            {competitors.length === 0 ? (
              <div className="glass-panel p-10 text-center rounded-2xl border-zinc-900">
                <span className="text-zinc-500 text-sm">No competitors registered yet. All logs will be automatically tracked here.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {competitors.map((comp, index) => {
                  const isCurrentUser = comp.user_id === user?.id;
                  const rank = index + 1;
                  
                  let medalColor = 'text-zinc-500 bg-zinc-900 border-zinc-800';
                  if (rank === 1) medalColor = 'text-amber-500 bg-amber-950/20 border-amber-900/60';
                  if (rank === 2) medalColor = 'text-slate-300 bg-slate-800/20 border-slate-700/60';
                  if (rank === 3) medalColor = 'text-amber-700 bg-amber-900/10 border-amber-950';

                  return (
                    <div 
                      key={comp.user_id} 
                      className={`glass-panel p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                        isCurrentUser 
                          ? 'border-violet-850/60 bg-violet-650/5' 
                          : 'border-zinc-900 hover:border-zinc-850'
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Rank Badge */}
                        <div className={`w-8 h-8 rounded-lg border font-bold text-xs flex items-center justify-center shrink-0 ${medalColor}`}>
                          {rank}
                        </div>

                        {/* Profile initials avatar */}
                        <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300 shrink-0">
                          {comp.profiles?.username ? comp.profiles.username.substring(0, 2).toUpperCase() : 'U'}
                        </div>

                        <div className="min-w-0">
                          <span className="text-sm font-bold text-white block truncate leading-none">
                            {comp.profiles?.username || 'fit_member'}
                          </span>
                          <span className="text-[10px] text-zinc-500 block truncate leading-none mt-1">
                            {comp.profiles?.email || ''}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 shrink-0">
                        {/* Streak HUD */}
                        <div className="flex items-center gap-1.5 text-zinc-400">
                          <Flame className="w-4 h-4 text-amber-500" />
                          <span className="text-xs font-bold text-white">{comp.streak}d</span>
                        </div>

                        {/* Points HUD */}
                        <div className="text-right min-w-[70px]">
                          <span className="text-xs font-bold text-violet-400 block">{comp.points}</span>
                          <span className="text-[9px] text-zinc-500 block font-medium uppercase leading-none">points</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ADMIN CONTACT FOOTER CARD */}
            <div className="glass-panel p-6 rounded-3xl border-zinc-900 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
              <h3 className="text-white text-sm font-bold flex items-center gap-2 mb-2">
                <ShieldAlert className="w-4.5 h-4.5 text-violet-400" />
                <span>Contact Admin Portal</span>
              </h3>
              <p className="text-zinc-500 text-xs mb-6 max-w-lg leading-relaxed">
                Need account recovery, point correction, access freezing, or ban appeal? Reach out directly using our admin contact channels below.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
                <a 
                  href="https://instagram.com/abuwasfound" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="bg-[#0b0d12] border border-zinc-900 hover:border-zinc-800 p-4 rounded-xl flex items-center gap-3 text-zinc-400 hover:text-white transition-all"
                >
                  <Globe className="w-5 h-5 text-pink-500 shrink-0" />
                  <div>
                    <span className="text-zinc-600 text-[9px] uppercase font-bold block leading-none mb-1">Instagram</span>
                    <span className="block truncate">@abuwasfound</span>
                  </div>
                </a>

                <a 
                  href="https://t.me/Abu_wsg" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="bg-[#0b0d12] border border-zinc-900 hover:border-zinc-800 p-4 rounded-xl flex items-center gap-3 text-zinc-400 hover:text-white transition-all"
                >
                  <Send className="w-5 h-5 text-sky-400 shrink-0" />
                  <div>
                    <span className="text-zinc-600 text-[9px] uppercase font-bold block leading-none mb-1">Telegram</span>
                    <span className="block truncate">@Abu_wsg</span>
                  </div>
                </a>

                <a 
                  href="mailto:abubakrfazliddinov768@gmail.com" 
                  className="bg-[#0b0d12] border border-zinc-900 hover:border-zinc-800 p-4 rounded-xl flex items-center gap-3 text-zinc-400 hover:text-white transition-all"
                >
                  <Mail className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <span className="text-zinc-600 text-[9px] uppercase font-bold block leading-none mb-1">Email Address</span>
                    <span className="block truncate">abubakr768</span>
                  </div>
                </a>
              </div>
            </div>

          </div>

          {/* STANDINGS HUD & LOGS TIMELINE */}
          <div className="space-y-6">
            
            {/* Standings card */}
            <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'var(--font-display)' }}>
              Your Standing
            </h2>

            <div className="glass-panel p-6 rounded-3xl border-zinc-900 space-y-6">
              
              {/* Profile Overview */}
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-white text-base shadow-lg shadow-violet-500/10">
                  #{userRank || '-'}
                </div>
                <div>
                  <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest block leading-none">Your Rank</span>
                  <span className="text-base font-extrabold text-white mt-1.5 block leading-none">{profile?.username || 'fit_user'}</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3.5 border-t border-b border-zinc-900/60 py-6 text-xs">
                <div className="bg-[#0b0d12] p-3 rounded-xl border border-zinc-950">
                  <span className="text-zinc-500 text-[10px] font-semibold uppercase block">Score</span>
                  <span className="text-sm font-bold text-white mt-1 block">{stats?.points || 0} Pts</span>
                </div>
                <div className="bg-[#0b0d12] p-3 rounded-xl border border-zinc-950">
                  <span className="text-zinc-500 text-[10px] font-semibold uppercase block">Active Streak</span>
                  <span className="text-sm font-bold text-white mt-1 block">{stats?.streak || 0} Days</span>
                </div>
                <div className="bg-[#0b0d12] p-3 rounded-xl border border-zinc-950">
                  <span className="text-zinc-500 text-[10px] font-semibold uppercase block">Completed Day</span>
                  <span className="text-sm font-bold text-emerald-400 mt-1 block">{stats?.completed_count || 0} Logs</span>
                </div>
                <div className="bg-[#0b0d12] p-3 rounded-xl border border-zinc-950">
                  <span className="text-zinc-500 text-[10px] font-semibold uppercase block">Missed Days</span>
                  <span className="text-sm font-bold text-red-400 mt-1 block">{stats?.missed_count || 0} Days</span>
                </div>
              </div>

              {/* Points timeline log */}
              <div className="space-y-4">
                <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest block">Points Adjustment Feed</span>
                
                {pointHistory.length === 0 ? (
                  <p className="text-zinc-500 text-xs leading-normal">No points adjustments registered yet. Complete workouts to earn points.</p>
                ) : (
                  <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                    {pointHistory.map((item) => {
                      const isPositive = item.points >= 0;
                      return (
                        <div key={item.id} className="flex items-start justify-between gap-3 text-xs border-b border-zinc-950 pb-2.5">
                          <div className="min-w-0">
                            <span className="text-[10px] text-zinc-500 block">{item.date}</span>
                            <span className="text-zinc-300 font-semibold mt-0.5 block truncate max-w-[170px]" title={item.description}>
                              {item.description}
                            </span>
                          </div>
                          
                          <span className={`font-bold shrink-0 flex items-center ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isPositive ? (
                              <TrendingUp className="w-3.5 h-3.5 mr-0.5 shrink-0" />
                            ) : (
                              <TrendingDown className="w-3.5 h-3.5 mr-0.5 shrink-0" />
                            )}
                            {isPositive ? `+${item.points}` : item.points}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
