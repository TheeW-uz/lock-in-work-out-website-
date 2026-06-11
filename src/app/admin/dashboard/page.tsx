'use client';

import React, { useEffect, useState } from 'react';
import { 
  Users, 
  UserCheck, 
  ShieldAlert, 
  Lock, 
  Flame, 
  Coins, 
  Loader2,
  RefreshCw,
  PlusCircle,
  FileText,
  UserPlus,
  ArrowUpRight
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  frozenAccounts: number;
  workoutsCompletedToday: number;
  pointsAwardedToday: number;
}

interface Registration {
  id: string;
  username: string;
  email: string;
  created_at: string;
}

interface AdminAction {
  id: string;
  admin_username: string;
  action_type: string;
  target_user_id: string;
  details: string;
  created_at: string;
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [actions, setActions] = useState<AdminAction[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setRegistrations(data.recentRegistrations);
        setActions(data.recentAdminActions);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-[#07090e]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
        <p className="text-slate-500 text-xs">Aggregating control center parameters...</p>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Registry Users',
      value: stats?.totalUsers ?? 0,
      icon: Users,
      color: 'text-blue-400 border-blue-900/40 bg-blue-950/5',
      glow: 'shadow-blue-500/5',
      desc: 'All profile records registered in DB'
    },
    {
      title: 'Active Accounts',
      value: stats?.activeUsers ?? 0,
      icon: UserCheck,
      color: 'text-emerald-400 border-emerald-900/40 bg-emerald-950/5',
      glow: 'shadow-emerald-500/5',
      desc: 'Accounts that are not currently frozen'
    },
    {
      title: 'Banned Accounts',
      value: stats?.bannedUsers ?? 0,
      icon: ShieldAlert,
      color: 'text-rose-400 border-rose-900/40 bg-rose-950/5',
      glow: 'shadow-rose-500/5',
      desc: 'Active suspensions and restrictions'
    },
    {
      title: 'Frozen Accounts',
      value: stats?.frozenAccounts ?? 0,
      icon: Lock,
      color: 'text-cyan-400 border-cyan-900/40 bg-cyan-950/5',
      glow: 'shadow-cyan-500/5',
      desc: 'Accounts temporarily locked by admin'
    },
    {
      title: 'Workouts Logged Today',
      value: stats?.workoutsCompletedToday ?? 0,
      icon: Flame,
      color: 'text-amber-400 border-amber-900/40 bg-amber-950/5',
      glow: 'shadow-amber-500/5',
      desc: 'Completed and partial workouts today'
    },
    {
      title: 'Points Awarded Today',
      value: stats?.pointsAwardedToday ?? 0,
      icon: Coins,
      color: 'text-violet-400 border-violet-900/40 bg-violet-950/5',
      glow: 'shadow-violet-500/5',
      desc: 'Points credited to athletes today'
    }
  ];

  return (
    <div className="h-full w-full overflow-y-auto p-6 space-y-8">
      
      {/* Upper Title Section */}
      <div className="flex justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">ADMIN CENTRAL DASHBOARD</h2>
          <p className="text-xs text-slate-500 mt-1">Real-time telemetry and operation overview.</p>
        </div>

        <button 
          onClick={fetchDashboardData}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#111420] hover:bg-[#181d2f] border border-slate-900 text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Metrics'}</span>
        </button>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div 
              key={idx}
              className={`p-5 rounded-2xl border flex flex-col justify-between transition-all hover:scale-[1.01] hover:border-slate-800 ${card.color} shadow-lg ${card.glow}`}
            >
              <div className="flex justify-between items-start">
                <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">{card.title}</span>
                <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-900">
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-white tracking-tight">{card.value}</span>
                <span className="text-[10px] text-slate-500 block mt-1 leading-normal">{card.desc}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Bottom Section: Split Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Column: Recent Registrations */}
        <div className="p-5 bg-[#0b0e14] border border-slate-900 rounded-2xl flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-slate-900/60 pb-3">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Recent Registrations</h3>
            </div>
            <Link 
              href="/admin/users" 
              className="text-[10px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-0.5"
            >
              <span>Manage Registry</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-slate-900/50">
            {registrations.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-650 italic">No registrations logged.</div>
            ) : (
              registrations.map(reg => (
                <div key={reg.id} className="py-3 flex justify-between items-center text-xs gap-3">
                  <div className="min-w-0">
                    <span className="font-bold text-slate-200 block truncate">@{reg.username}</span>
                    <span className="text-[10px] text-slate-500 block truncate">{reg.email}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-400 block">{new Date(reg.created_at).toLocaleDateString()}</span>
                    <span className="text-[9px] text-slate-600 block mt-0.5">{new Date(reg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Recent Admin Action logs */}
        <div className="p-5 bg-[#0b0e14] border border-slate-900 rounded-2xl flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-slate-900/60 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Recent Moderator Actions</h3>
            </div>
            <Link 
              href="/admin/logs" 
              className="text-[10px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-0.5"
            >
              <span>View Audit Logs</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-3.5 overflow-y-auto max-h-[300px] pr-1">
            {actions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-650 italic">No administrative actions logged.</div>
            ) : (
              actions.map(act => (
                <div key={act.id} className="text-xs p-3 rounded-xl bg-[#090b10] border border-slate-900 space-y-1.5">
                  <div className="flex justify-between items-center text-[9px]">
                    <span className="font-bold text-blue-400 uppercase tracking-wide">@{act.admin_username}</span>
                    <span className="text-slate-500 font-semibold">{new Date(act.created_at).toLocaleString()}</span>
                  </div>
                  <div className="text-slate-300 font-medium">
                    Action: <strong className="text-white uppercase text-[10px]">{act.action_type}</strong>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed italic bg-slate-950/40 p-1.5 rounded-lg border border-slate-900/30">
                    {act.details}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
