'use client';

import React, { useEffect, useState } from 'react';
import { 
  Trophy, 
  Search, 
  Award, 
  Coins, 
  ArrowUpDown, 
  Loader2, 
  RefreshCw,
  Plus,
  Minus,
  RotateCcw,
  Clock,
  Flame,
  X
} from 'lucide-react';

interface LeaderboardUser {
  id: string;
  username: string;
  email: string;
  points: number;
  streak: number;
  rank: number;
  created_at: string;
}

export default function AdminLeaderboardPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<LeaderboardUser | null>(null);
  
  // History loading
  const [pointsHistory, setPointsHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Form states
  const [pointsAmount, setPointsAmount] = useState('50');
  const [pointsDescription, setPointsDescription] = useState('Manual achievement reward');
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        
        // Map and sort users by points
        const rawUsers = data.users || [];
        const mapped: LeaderboardUser[] = rawUsers.map((u: any) => {
          const stats = u.leaderboard_stats?.[0] || { points: 0, streak: 0 };
          return {
            id: u.id,
            username: u.username,
            email: u.email,
            points: stats.points,
            streak: stats.streak,
            rank: 0,
            created_at: u.created_at
          };
        });

        // Sort descending by points
        mapped.sort((a, b) => b.points - a.points);
        
        // Add rank positions
        mapped.forEach((u, i) => {
          u.rank = i + 1;
        });

        setUsers(mapped);
        
        // Maintain selection
        if (selectedUser) {
          const fresh = mapped.find(x => x.id === selectedUser.id);
          if (fresh) setSelectedUser(fresh);
        }
      }
    } catch (err) {
      console.error(err);
      showStatus('Failed to load leaderboard database', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchPointHistory = async (userId: string) => {
    try {
      setLoadingHistory(true);
      const res = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_user_history',
          userId
        })
      });
      if (res.ok) {
        const data = await res.json();
        setPointsHistory(data.points || []);
      }
    } catch (err) {
      console.error(err);
      setPointsHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const selectUser = (u: LeaderboardUser) => {
    setSelectedUser(u);
    setPointsAmount('50');
    setPointsDescription('Manual achievement reward');
    fetchPointHistory(u.id);
  };

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg({ text: '', type: '' }), 4000);
  };

  const adjustPoints = async (amount: number, description: string) => {
    if (!selectedUser) return;
    setActionLoading(true);
    setStatusMsg({ text: '', type: '' });

    try {
      const res = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'adjust_points',
          userId: selectedUser.id,
          data: {
            points: amount.toString(),
            description: description || 'Admin adjustment'
          }
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to adjust points');

      showStatus(`Successfully updated points balance by ${amount >= 0 ? '+' : ''}${amount}!`, 'success');
      await loadLeaderboard();
      await fetchPointHistory(selectedUser.id);
    } catch (err: any) {
      showStatus(err.message || 'Operation failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const resetPoints = async () => {
    if (!selectedUser) return;
    if (selectedUser.points === 0) {
      showStatus('User is already at 0 points', 'error');
      return;
    }

    const confirmReset = confirm(`Are you sure you want to reset @${selectedUser.username}'s points to 0? This will append a negative balance offset of -${selectedUser.points} points.`);
    if (!confirmReset) return;

    await adjustPoints(-selectedUser.points, 'Leaderboard Points Reset');
  };

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full w-full flex overflow-hidden">
      
      {/* LEFT COLUMN: Leaderboard ranking */}
      <div className={`flex-1 h-full flex flex-col p-6 overflow-hidden ${selectedUser ? 'hidden xl:flex xl:w-7/12 shrink-0' : 'w-full'}`}>
        
        {/* Header */}
        <div className="flex justify-between items-center gap-4 mb-4">
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight uppercase">Leaderboard Registry</h2>
            <p className="text-xs text-slate-500 mt-1">Review rankings and credit manually earned achievements.</p>
          </div>
          <button 
            onClick={loadLeaderboard}
            className="p-2 bg-[#111420] border border-slate-900 rounded-lg hover:bg-slate-900 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-500" />
          </span>
          <input
            type="text"
            placeholder="Search username or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0d1017] border border-slate-900 focus:border-blue-500 rounded-xl py-2.5 pl-11 pr-4 text-xs text-slate-200 focus:outline-none placeholder-slate-700"
          />
        </div>

        {/* List of ranks */}
        <div className="flex-1 overflow-auto border border-slate-900 rounded-2xl bg-[#0b0e14]">
          {loading ? (
            <div className="h-full w-full flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="h-full w-full flex items-center justify-center text-xs text-slate-650 italic">
              No users found matching query.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-900 text-[10px] text-slate-500 uppercase font-extrabold tracking-wider bg-[#0d1017]">
                  <th className="p-4 text-center w-16">Rank</th>
                  <th className="p-4">Username</th>
                  <th className="p-4">Points</th>
                  <th className="p-4">Streak</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {filteredUsers.map(u => (
                  <tr 
                    key={u.id}
                    onClick={() => selectUser(u)}
                    className={`hover:bg-[#0e121b] transition-colors cursor-pointer group ${
                      selectedUser?.id === u.id ? 'bg-[#0f1420]/80' : ''
                    }`}
                  >
                    <td className="p-4 text-center font-extrabold text-slate-500 text-sm">
                      {u.rank === 1 ? '🥇' : u.rank === 2 ? '🥈' : u.rank === 3 ? '🥉' : `#${u.rank}`}
                    </td>
                    <td className="p-4 font-bold text-slate-200 group-hover:text-blue-400">
                      @{u.username}
                      <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">{u.email}</span>
                    </td>
                    <td className="p-4 font-extrabold text-slate-200 text-sm flex items-center gap-1.5 mt-2.5">
                      <Award className="w-4 h-4 text-violet-400 shrink-0" />
                      <span>{u.points.toLocaleString()}</span>
                    </td>
                    <td className="p-4 font-bold text-slate-400">
                      <span className="flex items-center gap-0.5"><Flame className="w-3.5 h-3.5 text-amber-500" /> {u.streak}d</span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          selectUser(u);
                        }}
                        className="text-[10px] font-bold text-blue-400 hover:text-blue-300 bg-blue-950/20 hover:bg-blue-950/40 border border-blue-900/40 px-2.5 py-1 rounded-lg transition-all"
                      >
                        Adjust
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* RIGHT COLUMN: Points Adjuster */}
      <div className={`w-full xl:w-5/12 h-full border-l border-slate-900 bg-[#090b10] flex flex-col overflow-hidden shrink-0 ${selectedUser ? 'flex' : 'hidden xl:flex'}`}>
        {selectedUser ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-900 bg-[#0b0e14] flex justify-between items-start gap-4">
              <div>
                <h3 className="font-extrabold text-white text-base leading-none">Manage Leaderboard Points</h3>
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mt-2.5 block">
                  @{selectedUser.username} • Rank #{selectedUser.rank}
                </span>
              </div>
              <button 
                onClick={() => setSelectedUser(null)}
                className="p-1 rounded-lg hover:bg-slate-900 text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Notification alert status */}
            {statusMsg.text && (
              <div className={`m-4 p-3.5 rounded-xl border text-xs font-semibold ${
                statusMsg.type === 'error' 
                  ? 'bg-red-950/20 border-red-900/65 text-red-400' 
                  : 'bg-emerald-950/20 border-emerald-900/65 text-emerald-400'
              }`}>
                {statusMsg.text}
              </div>
            )}

            {/* Content body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* Point Status HUD */}
              <div className="grid grid-cols-2 gap-4 bg-[#0b0e14] border border-slate-900 p-4 rounded-xl">
                <div className="bg-[#080a0f] p-3 rounded-lg border border-slate-900/50 flex flex-col items-center justify-center">
                  <Coins className="w-5 h-5 text-violet-400 mb-1" />
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Current Points</span>
                  <span className="text-xl font-extrabold text-white mt-1">{selectedUser.points.toLocaleString()}</span>
                </div>
                <div className="bg-[#080a0f] p-3 rounded-lg border border-slate-900/50 flex flex-col items-center justify-center">
                  <Flame className="w-5 h-5 text-amber-500 mb-1 animate-pulse" />
                  <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Workout Streak</span>
                  <span className="text-xl font-extrabold text-white mt-1">{selectedUser.streak} days</span>
                </div>
              </div>

              {/* Adjust Points Form */}
              <div className="p-4 bg-[#0b0e14] border border-slate-900 rounded-xl space-y-4 text-xs">
                <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-blue-400" />
                  <span>Manual Points Credit / Debit</span>
                </h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-500 block mb-1">Points Delta Amount</label>
                    <input
                      type="number"
                      value={pointsAmount}
                      onChange={(e) => setPointsAmount(e.target.value)}
                      placeholder="e.g. 50 or -20"
                      className="w-full bg-[#080a0f] border border-slate-900 focus:border-blue-500 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] uppercase font-bold text-slate-500 block mb-1">Award Description / Category</label>
                    <input
                      type="text"
                      value={pointsDescription}
                      onChange={(e) => setPointsDescription(e.target.value)}
                      placeholder="Manual bonus points..."
                      className="w-full bg-[#080a0f] border border-slate-900 focus:border-blue-500 rounded-lg p-2.5 text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => adjustPoints(parseInt(pointsAmount) || 0, pointsDescription)}
                      disabled={actionLoading}
                      className="flex-1 bg-blue-950/20 hover:bg-blue-900/30 border border-blue-900/50 text-blue-400 py-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Credit Points</span>
                    </button>
                    <button
                      onClick={() => adjustPoints(-(parseInt(pointsAmount) || 0), pointsDescription)}
                      disabled={actionLoading}
                      className="flex-1 bg-[#1c0f13] hover:bg-[#2d171d] border border-red-950/50 text-red-500 py-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Minus className="w-4 h-4" />
                      <span>Debit Points</span>
                    </button>
                  </div>
                </div>

                <div className="border-t border-slate-900/80 pt-4">
                  <button
                    onClick={resetPoints}
                    disabled={actionLoading}
                    className="w-full bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white py-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 text-[11px]"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Leaderboard Points (Set 0)</span>
                  </button>
                </div>
              </div>

              {/* Point Award History */}
              <div className="p-4 bg-[#0b0e14] border border-slate-900 rounded-xl space-y-3">
                <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span>Points log history</span>
                </h4>
                
                {loadingHistory ? (
                  <div className="py-4 text-center"><Loader2 className="w-4 h-4 text-slate-650 animate-spin mx-auto" /></div>
                ) : pointsHistory.length === 0 ? (
                  <p className="text-[10px] text-slate-650 italic">No point transactions registered.</p>
                ) : (
                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                    {pointsHistory.map(p => (
                      <div key={p.id} className="flex justify-between items-start text-xs border-b border-slate-950 pb-2 gap-3">
                        <div className="min-w-0">
                          <span className="font-bold text-slate-300 block">{p.description}</span>
                          <span className="text-[9px] text-slate-500 block mt-0.5">{p.date} • {p.category}</span>
                        </div>
                        <span className={`font-extrabold shrink-0 ${p.points >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {p.points >= 0 ? `+${p.points}` : p.points}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-[#090b10]">
            <Trophy className="w-10 h-10 text-slate-800 mb-2" />
            <h3 className="font-bold text-slate-650 text-xs">Select user to manage</h3>
            <p className="text-slate-700 text-[11px] mt-1 max-w-[200px] leading-relaxed">
              Choose an athlete from the leaderboard registry to adjust points, review transaction logs, and reward achievement manually.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
