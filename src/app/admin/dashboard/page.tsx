'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ShieldAlert, 
  Search, 
  User, 
  Lock, 
  Coins, 
  UserMinus, 
  UserCheck, 
  AlertOctagon, 
  Clock, 
  FileText, 
  Loader2, 
  ArrowLeft,
  X,
  Plus,
  Minus,
  Edit,
  RefreshCw,
  Trash2,
  Calendar,
  Activity,
  Flame,
  Award
} from 'lucide-react';

interface UserItem {
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
  leaderboard_stats?: Array<{
    points: number;
    streak: number;
    completed_count: number;
    missed_count: number;
  }>;
  bans?: any[];
  account_freezes?: any[];
}

interface AuditLog {
  id: string;
  admin_username: string;
  action_type: string;
  target_user_id: string;
  details: string;
  created_at: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  
  // Detail views for selected user
  const [selectedHistory, setSelectedHistory] = useState<{ points: any[]; workouts: any[] } | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Input states for modifications
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [adjustPts, setAdjustPts] = useState('0');
  const [adjustPtsDesc, setAdjustPtsDesc] = useState('');
  const [banReason, setBanReason] = useState('');
  const [banDays, setBanDays] = useState('7');
  const [freezeReason, setFreezeReason] = useState('');

  // Status/Response states
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });
  const [actionLoading, setActionLoading] = useState(false);

  // 1. Check Session & Fetch Users
  const loadData = async (search = '') => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(search)}`);
      
      if (res.status === 401) {
        router.push('/admin/login');
        return;
      }
      
      if (!res.ok) {
        throw new Error('Failed to load users');
      }

      const data = await res.json();
      setUsers(data.users || []);
      setAuditLogs(data.auditLogs || []);
    } catch (error) {
      console.error(error);
      showStatus('Failed to retrieve control room metrics.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData(searchQuery);
  };

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg({ text: '', type: '' }), 4000);
  };

  // 2. Fetch User Detail History (Logs & Points)
  const fetchUserHistory = async (userId: string) => {
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
      if (!res.ok) throw new Error('Failed to load user history');
      const data = await res.json();
      setSelectedHistory(data);
    } catch (err) {
      console.error(err);
      setSelectedHistory(null);
    } finally {
      setLoadingHistory(false);
    }
  };

  const selectUser = (u: UserItem) => {
    setSelectedUser(u);
    setEditUsername(u.username);
    setEditPassword('');
    setAdjustPts('0');
    setAdjustPtsDesc('Admin adjustment');
    setBanReason('');
    setFreezeReason('');
    
    fetchUserHistory(u.id);
  };

  // 3. Dispatch Action Helper
  const triggerAction = async (action: string, dataPayload: any) => {
    if (!selectedUser) return;
    setActionLoading(true);
    setStatusMsg({ text: '', type: '' });

    try {
      const res = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          userId: selectedUser.id,
          data: dataPayload
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Operation failed');
      }

      showStatus(`Action "${action}" processed successfully!`, 'success');
      
      // Reload overall state
      await loadData(searchQuery);
      
      // Refresh current selected user view
      const updatedUser = users.find(u => u.id === selectedUser.id);
      if (updatedUser) {
        // Find fresh profile from reload data
        const fresh = users.find(x => x.id === selectedUser.id);
        if (fresh) setSelectedUser(fresh);
      } else {
        setSelectedUser(null);
      }
      
      // Refetch history
      await fetchUserHistory(selectedUser.id);
    } catch (err: any) {
      showStatus(err.message || 'Operation failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    // Clear admin cookie by requesting login endpoint to overwrite or simply writing empty cookie
    // Next.js cookies can be cleared. We can overwrite with past expiry.
    document.cookie = 'lockin_admin_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-[#08080a] text-white flex flex-col overflow-hidden">
      
      {/* TOP COMMAND HEADER */}
      <header className="px-6 py-4 border-b border-red-955 bg-[#0e0c0f] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 to-rose-600 flex items-center justify-center border border-red-500/25">
            <ShieldAlert className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white leading-none" style={{ fontFamily: 'var(--font-display)' }}>
              LOCK-IN COMMAND ROOM
            </h1>
            <span className="text-[9px] text-red-500 font-bold uppercase tracking-widest mt-1.5 block">
              Administrative Control Board
            </span>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="text-xs text-zinc-400 hover:text-red-400 font-bold border border-zinc-900 hover:border-red-950 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
        >
          Exit Room
        </button>
      </header>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#08080a]">
          <Loader2 className="w-8 h-8 text-red-500 animate-spin mb-3" />
          <p className="text-zinc-500 text-sm">Synchronizing control board parameters...</p>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          
          {/* LEFT LIST PANEL (Users & Audit Logs) */}
          <div className="w-full lg:w-3/5 border-r border-zinc-950 p-6 flex flex-col overflow-y-auto space-y-8">
            
            {/* User Search & Filter */}
            <div className="space-y-4">
              <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>Active Database Users</span>
                <span className="text-xs bg-red-950/20 text-red-400 border border-red-900/30 px-2 py-0.5 rounded-full font-bold">
                  {users.length} Total
                </span>
              </h2>

              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-zinc-650" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search username or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#121013] border border-zinc-900 focus:border-red-500 rounded-xl py-2.5 pl-10 pr-4 text-white text-xs focus:outline-none placeholder-zinc-700"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-zinc-900 hover:bg-zinc-800 text-white px-4 rounded-xl text-xs font-bold transition-all cursor-pointer border border-zinc-850"
                >
                  Search
                </button>
              </form>

              {/* Users Grid */}
              {users.length === 0 ? (
                <div className="p-8 text-center bg-[#0d0c0f] border border-zinc-900 rounded-2xl">
                  <p className="text-zinc-600 text-xs">No users matched search criteria.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {users.map(u => {
                    const statsObj = u.leaderboard_stats?.[0] || { points: 0, streak: 0 };
                    
                    // Ban check
                    const isBanned = u.bans && u.bans.length > 0 && u.bans.some(b => {
                      if (!b.banned_until) return true;
                      return new Date(b.banned_until) > new Date();
                    });

                    return (
                      <button
                        key={u.id}
                        onClick={() => selectUser(u)}
                        className={`text-left p-4 rounded-xl border transition-all cursor-pointer ${
                          selectedUser?.id === u.id 
                            ? 'bg-red-950/5 border-red-900/80 shadow-md shadow-red-500/5' 
                            : 'bg-[#0e0c0f] border-zinc-900 hover:border-zinc-800'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-3">
                          <span className="font-bold text-white text-xs truncate max-w-[130px]">{u.username}</span>
                          
                          {/* Badges */}
                          <div className="flex gap-1">
                            {isBanned && (
                              <span className="bg-red-950/40 text-red-500 border border-red-900/50 text-[8px] uppercase px-1.5 py-0.5 rounded font-bold">
                                Banned
                              </span>
                            )}
                            {u.is_frozen && (
                              <span className="bg-cyan-950/40 text-cyan-500 border border-cyan-900/50 text-[8px] uppercase px-1.5 py-0.5 rounded font-bold">
                                Frozen
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] text-zinc-500 block truncate mt-0.5">{u.email}</span>
                        
                        <div className="flex items-center gap-3 mt-3 text-[10px] text-zinc-400">
                          <span className="flex items-center gap-0.5"><Award className="w-3.5 h-3.5 text-violet-400 shrink-0" /> {statsObj.points} Pts</span>
                          <span className="flex items-center gap-0.5"><Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" /> {statsObj.streak}d</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Audit Logs */}
            <div className="space-y-4">
              <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4.5 h-4.5 text-red-500" />
                <span>Command Audit Log</span>
              </h2>

              <div className="bg-[#0b0a0c] border border-zinc-900 rounded-2xl p-4 max-h-[300px] overflow-y-auto space-y-3.5">
                {auditLogs.length === 0 ? (
                  <p className="text-zinc-600 text-xs py-4 text-center">No administrative audits registered yet.</p>
                ) : (
                  auditLogs.map(log => (
                    <div key={log.id} className="text-xs border-b border-zinc-950 pb-3 space-y-1">
                      <div className="flex justify-between items-center text-[10px] text-zinc-500">
                        <span className="font-bold text-red-400">@{log.admin_username}</span>
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-zinc-300">
                        Action: <strong className="text-white">{log.action_type}</strong> • {log.details}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>

          {/* RIGHT COMMAND MODULE (Selected User Details & Actions) */}
          <div className="hidden lg:block w-2/5 border-l border-zinc-950 p-6 overflow-y-auto bg-[#0a090b]">
            
            {selectedUser ? (
              <div className="space-y-6">
                
                {/* Header */}
                <div className="flex justify-between items-start gap-4 border-b border-zinc-900 pb-4">
                  <div>
                    <h3 className="font-extrabold text-white text-base leading-none">Modify Profile</h3>
                    <span className="text-[9px] text-zinc-500 block mt-1.5 uppercase font-bold tracking-widest truncate max-w-[200px]">
                      ID: {selectedUser.id}
                    </span>
                  </div>
                  
                  <button 
                    onClick={() => setSelectedUser(null)}
                    className="text-zinc-500 hover:text-white"
                  >
                    <X className="w-4.5 h-4.5" />
                  </button>
                </div>

                {/* Status message */}
                {statusMsg.text && (
                  <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs ${
                    statusMsg.type === 'error' 
                      ? 'bg-red-950/20 border-red-900 text-red-400' 
                      : 'bg-emerald-950/20 border-emerald-900 text-emerald-400'
                  }`}>
                    <p className="font-medium">{statusMsg.text}</p>
                  </div>
                )}

                {/* ACTIONS ACCORDION */}
                <div className="space-y-4">
                  
                  {/* Action 1: Adjust Points */}
                  <div className="bg-[#0f0d11] border border-zinc-900 rounded-xl p-4 space-y-3">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-amber-500" />
                      <span>Adjust Points</span>
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[9px] text-zinc-500 block mb-1">Add/Sub points</label>
                        <input
                          type="number"
                          placeholder="e.g. 50 or -20"
                          value={adjustPts}
                          onChange={(e) => setAdjustPts(e.target.value)}
                          className="w-full bg-[#08080a] border border-zinc-850 rounded-lg p-2 text-white text-xs focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] text-zinc-500 block mb-1">Description / Reason</label>
                        <input
                          type="text"
                          placeholder="Admin adjustment reason"
                          value={adjustPtsDesc}
                          onChange={(e) => setAdjustPtsDesc(e.target.value)}
                          className="w-full bg-[#08080a] border border-zinc-850 rounded-lg p-2 text-white text-xs focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => triggerAction('adjust_points', { points: adjustPts, description: adjustPtsDesc })}
                      disabled={actionLoading}
                      className="w-full bg-[#1b1511] hover:bg-[#2e2116] border border-amber-900/40 text-amber-400 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                    >
                      Apply Points Modification
                    </button>
                  </div>

                  {/* Action 2: Change Username & Password */}
                  <div className="bg-[#0f0d11] border border-zinc-900 rounded-xl p-4 space-y-4 text-xs">
                    <h4 className="font-bold text-white flex items-center gap-1.5">
                      <Edit className="w-4 h-4 text-violet-400" />
                      <span>Identity & Credentials</span>
                    </h4>

                    {/* Username */}
                    <div className="space-y-2">
                      <label className="text-[9px] text-zinc-500 block">Edit Username</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editUsername}
                          onChange={(e) => setEditUsername(e.target.value)}
                          className="flex-1 bg-[#08080a] border border-zinc-850 rounded-lg p-2 text-white text-xs focus:outline-none"
                        />
                        <button
                          onClick={() => triggerAction('change_username', { newUsername: editUsername })}
                          disabled={actionLoading}
                          className="bg-violet-950/20 hover:bg-violet-900/30 border border-violet-850/50 text-violet-400 px-3 rounded-lg font-bold cursor-pointer transition-all"
                        >
                          Change
                        </button>
                      </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-2 border-t border-zinc-950 pt-3">
                      <label className="text-[9px] text-zinc-500 block">Reset Password</label>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          placeholder="New password (min 6 chars)"
                          value={editPassword}
                          onChange={(e) => setEditPassword(e.target.value)}
                          className="flex-1 bg-[#08080a] border border-zinc-850 rounded-lg p-2 text-white text-xs focus:outline-none"
                        />
                        <button
                          onClick={() => triggerAction('reset_password', { newPassword: editPassword })}
                          disabled={actionLoading}
                          className="bg-violet-950/20 hover:bg-violet-900/30 border border-violet-850/50 text-violet-400 px-3 rounded-lg font-bold cursor-pointer transition-all"
                        >
                          Reset
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Action 3: Ban Control */}
                  <div className="bg-[#0f0d11] border border-zinc-900 rounded-xl p-4 space-y-3">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <AlertOctagon className="w-4 h-4 text-red-500" />
                      <span>Restriction Room (Bans)</span>
                    </h4>

                    {selectedUser.bans && selectedUser.bans.length > 0 && selectedUser.bans.some(b => !b.banned_until || new Date(b.banned_until) > new Date()) ? (
                      <div className="space-y-2">
                        <p className="text-zinc-400 text-xs">User is currently banned.</p>
                        <button
                          onClick={() => triggerAction('unban_user', {})}
                          disabled={actionLoading}
                          className="w-full bg-emerald-950/20 hover:bg-emerald-900/30 border border-emerald-900/50 text-emerald-400 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          Unban Access
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3 text-xs">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] text-zinc-500 block mb-1">Ban Limit (Days)</label>
                            <select
                              value={banDays}
                              onChange={(e) => setBanDays(e.target.value)}
                              className="w-full bg-[#08080a] border border-zinc-850 rounded-lg p-2 text-white text-xs focus:outline-none"
                            >
                              <option value="1">1 Day</option>
                              <option value="7">7 Days</option>
                              <option value="30">30 Days</option>
                              <option value="365">1 Year</option>
                              <option value="permanent">Permanent</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[9px] text-zinc-500 block mb-1">Ban Reason</label>
                            <input
                              type="text"
                              placeholder="Reason for suspension"
                              value={banReason}
                              onChange={(e) => setBanReason(e.target.value)}
                              className="w-full bg-[#08080a] border border-zinc-850 rounded-lg p-2 text-white text-xs focus:outline-none"
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            const date = new Date();
                            const until = banDays === 'permanent' 
                              ? null 
                              : new Date(date.setDate(date.getDate() + parseInt(banDays))).toISOString();
                            triggerAction('ban_user', { reason: banReason, bannedUntil: until });
                          }}
                          disabled={actionLoading}
                          className="w-full bg-red-950/20 hover:bg-red-900/30 border border-red-900/50 text-red-500 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          Apply Suspension Ban
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Action 4: Freeze Control */}
                  <div className="bg-[#0f0d11] border border-zinc-900 rounded-xl p-4 space-y-3">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-cyan-400" />
                      <span>Account Freeze</span>
                    </h4>

                    {selectedUser.is_frozen ? (
                      <button
                        onClick={() => triggerAction('unfreeze_user', {})}
                        disabled={actionLoading}
                        className="w-full bg-[#10222a] hover:bg-[#153442] border border-cyan-900/50 text-cyan-400 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
                      >
                        Restore access (Unfreeze)
                      </button>
                    ) : (
                      <div className="space-y-3 text-xs">
                        <div>
                          <label className="text-[9px] text-zinc-500 block mb-1">Freeze Reason</label>
                          <input
                            type="text"
                            placeholder="Reason for freezing"
                            value={freezeReason}
                            onChange={(e) => setFreezeReason(e.target.value)}
                            className="w-full bg-[#08080a] border border-zinc-850 rounded-lg p-2 text-white text-xs focus:outline-none"
                          />
                        </div>
                        <button
                          onClick={() => triggerAction('freeze_user', { reason: freezeReason })}
                          disabled={actionLoading}
                          className="w-full bg-[#10222a] hover:bg-[#153442] border border-cyan-900/50 text-cyan-400 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          Freeze Account Access
                        </button>
                      </div>
                    )}
                  </div>

                  {/* History View Timeline */}
                  <div className="bg-[#0f0d11] border border-zinc-900 rounded-xl p-4 space-y-4">
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-zinc-500" />
                      <span>Workout & Points Log History</span>
                    </h4>

                    {loadingHistory ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="w-5 h-5 text-zinc-700 animate-spin" />
                      </div>
                    ) : selectedHistory ? (
                      <div className="space-y-4 text-[11px] max-h-[300px] overflow-y-auto pr-1">
                        {/* Points timeline */}
                        <div className="space-y-2">
                          <span className="text-zinc-500 font-bold block uppercase text-[8px] tracking-wider">Points Timeline</span>
                          {selectedHistory.points.length === 0 ? (
                            <p className="text-zinc-650 italic">No points recorded.</p>
                          ) : (
                            selectedHistory.points.map(p => (
                              <div key={p.id} className="flex justify-between items-start border-b border-zinc-950 pb-1.5">
                                <span className="text-zinc-400 font-medium">{p.date}: {p.description}</span>
                                <span className={`font-bold ${p.points >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {p.points >= 0 ? `+${p.points}` : p.points}
                                </span>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Workouts logged */}
                        <div className="space-y-2 border-t border-zinc-950 pt-3">
                          <span className="text-zinc-500 font-bold block uppercase text-[8px] tracking-wider">Workouts Logged</span>
                          {selectedHistory.workouts.length === 0 ? (
                            <p className="text-zinc-650 italic">No workout sessions logged.</p>
                          ) : (
                            selectedHistory.workouts.map(w => (
                              <div key={w.id} className="flex justify-between items-center border-b border-zinc-950 pb-1.5">
                                <span className="text-zinc-400 font-medium">{w.date}: Logged ({w.completion_percentage}%)</span>
                                <span className="text-zinc-500 capitalize">{w.status}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-zinc-650 text-xs">No records retrieved.</p>
                    )}
                  </div>

                </div>

              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <ShieldAlert className="w-10 h-10 text-zinc-800 mb-2" />
                <h3 className="font-bold text-zinc-600 text-sm">Select a user profile</h3>
                <p className="text-zinc-700 text-xs mt-1 max-w-[200px]">
                  Click on any user in the registry grid to inspect their parameters and issue actions.
                </p>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}
