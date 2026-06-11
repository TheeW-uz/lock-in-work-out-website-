'use client';

import React, { useEffect, useState } from 'react';
import { 
  Search, 
  User, 
  Lock, 
  Coins, 
  AlertOctagon, 
  Clock, 
  FileText, 
  Loader2, 
  X,
  Plus,
  Minus,
  Edit,
  Trash2,
  Calendar,
  Activity,
  Flame,
  Award,
  Filter,
  ArrowUpDown,
  BookOpen
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
    last_active?: string;
  }>;
  bans?: any[];
  account_freezes?: any[];
}

export default function AdminUsersPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);

  // Filters & Sorting
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'banned' | 'frozen' | 'admin'>('all');
  const [sortBy, setSortBy] = useState<'username' | 'points' | 'created_at'>('points');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Selected User Detail History
  const [userHistory, setUserHistory] = useState<{ points: any[]; workouts: any[]; weeklyPlans: any[] } | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Admin notes for local persistence
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [savedNotes, setSavedNotes] = useState<string>('');

  // Action input states
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [adjustPts, setAdjustPts] = useState('0');
  const [adjustPtsDesc, setAdjustPtsDesc] = useState('');
  const [banReason, setBanReason] = useState('');
  const [banDays, setBanDays] = useState('7');
  const [freezeReason, setFreezeReason] = useState('');

  // Status/Loader states
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to load users', err);
      showStatus('Failed to retrieve user registry', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter and Sort Users
  useEffect(() => {
    let result = [...users];

    // Search filter
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(u => 
        u.username.toLowerCase().includes(q) || 
        u.email.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter === 'active') {
      result = result.filter(u => !u.is_frozen && !isUserBanned(u));
    } else if (statusFilter === 'banned') {
      result = result.filter(u => isUserBanned(u));
    } else if (statusFilter === 'frozen') {
      result = result.filter(u => u.is_frozen);
    } else if (statusFilter === 'admin') {
      result = result.filter(u => u.is_admin);
    }

    // Sorting
    result.sort((a, b) => {
      let valA: any = sortBy === 'points' ? (a.leaderboard_stats?.[0]?.points ?? 0) : (a[sortBy as 'username' | 'created_at'] || '');
      let valB: any = sortBy === 'points' ? (b.leaderboard_stats?.[0]?.points ?? 0) : (b[sortBy as 'username' | 'created_at'] || '');

      if (typeof valA === 'string') {
        return sortOrder === 'asc' 
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      } else {
        return sortOrder === 'asc'
          ? (valA > valB ? 1 : -1)
          : (valA < valB ? 1 : -1);
      }
    });

    setFilteredUsers(result);
  }, [users, searchQuery, statusFilter, sortBy, sortOrder]);

  const isUserBanned = (u: UserItem) => {
    return u.bans && u.bans.length > 0 && u.bans.some(b => {
      if (!b.banned_until) return true; // Permanent ban
      return new Date(b.banned_until) > new Date();
    });
  };

  const getActiveBan = (u: UserItem) => {
    if (!u.bans || u.bans.length === 0) return null;
    return u.bans.find(b => !b.banned_until || new Date(b.banned_until) > new Date()) || null;
  };

  const getActiveFreeze = (u: UserItem) => {
    if (!u.account_freezes || u.account_freezes.length === 0) return null;
    return u.account_freezes[u.account_freezes.length - 1];
  };

  const getUserRank = (u: UserItem) => {
    // Sort all users by points to get rank
    const sorted = [...users].sort((a, b) => {
      const ptsA = a.leaderboard_stats?.[0]?.points ?? 0;
      const ptsB = b.leaderboard_stats?.[0]?.points ?? 0;
      return ptsB - ptsA;
    });
    const idx = sorted.findIndex(x => x.id === u.id);
    return idx !== -1 ? idx + 1 : 'N/A';
  };

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
      setUserHistory(data);
    } catch (err) {
      console.error(err);
      setUserHistory(null);
    } finally {
      setLoadingHistory(false);
    }
  };

  const selectUser = (u: UserItem) => {
    setSelectedUser(u);
    setEditUsername(u.username);
    setEditPassword('');
    setAdjustPts('0');
    setAdjustPtsDesc('Admin reward');
    setBanReason('');
    setFreezeReason('');
    
    // Load local notes
    const note = localStorage.getItem(`admin_notes_${u.id}`) || '';
    setSavedNotes(note);
    setAdminNoteInput(note);

    fetchUserHistory(u.id);
  };

  const saveAdminNotes = () => {
    if (!selectedUser) return;
    localStorage.setItem(`admin_notes_${selectedUser.id}`, adminNoteInput);
    setSavedNotes(adminNoteInput);
    showStatus('Admin notes updated successfully!', 'success');
  };

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg({ text: '', type: '' }), 4000);
  };

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

      showStatus(`Action "${action}" completed!`, 'success');
      
      // Reload overall database state
      const reloadRes = await fetch('/api/admin/users');
      if (reloadRes.ok) {
        const reloadData = await reloadRes.json();
        const freshUsers: UserItem[] = reloadData.users || [];
        setUsers(freshUsers);

        // Find the fresh record for the currently selected user
        if (action === 'delete_user') {
          setSelectedUser(null);
        } else {
          const fresh = freshUsers.find(x => x.id === selectedUser.id);
          if (fresh) {
            setSelectedUser(fresh);
          }
        }
      }

      if (action !== 'delete_user') {
        await fetchUserHistory(selectedUser.id);
      }
    } catch (err: any) {
      showStatus(err.message || 'Operation failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleSort = (field: 'username' | 'points' | 'created_at') => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="h-full w-full flex overflow-hidden">
      
      {/* LEFT PANEL: User list & filters */}
      <div className={`flex-1 h-full flex flex-col p-6 overflow-hidden ${selectedUser ? 'hidden xl:flex xl:w-7/12 shrink-0' : 'w-full'}`}>
        
        {/* Title */}
        <div className="mb-4">
          <h2 className="text-xl font-extrabold text-white tracking-tight uppercase">User Registry Database</h2>
          <p className="text-xs text-slate-500 mt-1">Browse, inspect, and moderate Lock-In platform athletes.</p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col md:flex-row gap-3 mb-4 items-stretch md:items-center justify-between">
          
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-500" />
            </span>
            <input
              type="text"
              placeholder="Search by username or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0d1017] border border-slate-900 focus:border-blue-500 rounded-xl py-2.5 pl-11 pr-4 text-xs text-slate-200 focus:outline-none placeholder-slate-700 transition-all"
            />
          </div>

          {/* Filters Grid */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Status Selector */}
            <div className="flex bg-[#0d1017] border border-slate-900 rounded-xl p-1 text-[11px] font-bold">
              {(['all', 'active', 'banned', 'frozen', 'admin'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1.5 rounded-lg capitalize transition-all cursor-pointer ${
                    statusFilter === f 
                      ? 'bg-blue-600/10 text-blue-400 border border-blue-900/40 font-bold' 
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {/* Sorting Toggle */}
            <div className="flex bg-[#0d1017] border border-slate-900 rounded-xl p-1 text-[11px] font-bold">
              <button
                onClick={() => toggleSort('points')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  sortBy === 'points' ? 'bg-slate-900 text-blue-400 font-bold' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <span>Points</span>
                <ArrowUpDown className="w-3 h-3" />
              </button>
              <button
                onClick={() => toggleSort('username')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  sortBy === 'username' ? 'bg-slate-900 text-blue-400 font-bold' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <span>Name</span>
                <ArrowUpDown className="w-3 h-3" />
              </button>
              <button
                onClick={() => toggleSort('created_at')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  sortBy === 'created_at' ? 'bg-slate-900 text-blue-400 font-bold' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <span>Joined</span>
                <ArrowUpDown className="w-3 h-3" />
              </button>
            </div>

          </div>

        </div>

        {/* Registry Table */}
        <div className="flex-1 overflow-auto border border-slate-900 rounded-2xl bg-[#0b0e14]">
          {loading ? (
            <div className="h-full w-full flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="h-full w-full flex items-center justify-center text-xs text-slate-650 italic">
              No profiles found matching constraints.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-900 text-[10px] text-slate-500 uppercase font-extrabold tracking-wider bg-[#0d1017]">
                  <th className="p-4">Username</th>
                  <th className="p-4">Email</th>
                  <th className="p-4 text-center">Points</th>
                  <th className="p-4 text-center">Rank</th>
                  <th className="p-4">Joined Date</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/60">
                {filteredUsers.map(u => {
                  const pts = u.leaderboard_stats?.[0]?.points ?? 0;
                  const isBanned = isUserBanned(u);
                  const isFrozen = u.is_frozen;
                  const joined = new Date(u.created_at).toLocaleDateString();

                  return (
                    <tr 
                      key={u.id}
                      onClick={() => selectUser(u)}
                      className={`hover:bg-[#0e121b] transition-colors cursor-pointer group ${
                        selectedUser?.id === u.id ? 'bg-[#0f1420]/80' : ''
                      }`}
                    >
                      <td className="p-4 font-bold text-slate-200 group-hover:text-blue-400 truncate max-w-[150px]">
                        @{u.username}
                      </td>
                      <td className="p-4 text-slate-400 truncate max-w-[200px]">
                        {u.email}
                      </td>
                      <td className="p-4 text-center font-bold text-slate-200">
                        {pts.toLocaleString()}
                      </td>
                      <td className="p-4 text-center font-semibold text-slate-500">
                        #{getUserRank(u)}
                      </td>
                      <td className="p-4 text-slate-400">
                        {joined}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1">
                          {isBanned && (
                            <span className="bg-red-950/40 text-red-500 border border-red-900/30 text-[8px] uppercase px-1.5 py-0.5 rounded font-bold">
                              Banned
                            </span>
                          )}
                          {isFrozen && (
                            <span className="bg-cyan-950/40 text-cyan-500 border border-cyan-900/30 text-[8px] uppercase px-1.5 py-0.5 rounded font-bold">
                              Frozen
                            </span>
                          )}
                          {u.is_admin && (
                            <span className="bg-blue-950/40 text-blue-400 border border-blue-900/30 text-[8px] uppercase px-1.5 py-0.5 rounded font-bold">
                              Admin
                            </span>
                          )}
                          {!isBanned && !isFrozen && !u.is_admin && (
                            <span className="bg-emerald-950/40 text-emerald-500 border border-emerald-900/30 text-[8px] uppercase px-1.5 py-0.5 rounded font-bold">
                              Active
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>

      {/* RIGHT PANEL: User inspection & details */}
      <div className={`w-full xl:w-5/12 h-full border-l border-slate-900 bg-[#090b10] flex flex-col overflow-hidden shrink-0 ${selectedUser ? 'flex' : 'hidden xl:flex'}`}>
        {selectedUser ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Header info */}
            <div className="p-5 border-b border-slate-900 bg-[#0b0e14] flex justify-between items-start gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-extrabold text-white text-base leading-none">@{selectedUser.username}</h3>
                  <div className="flex gap-1.5">
                    {isUserBanned(selectedUser) && <span className="bg-red-950/60 border border-red-900/50 text-red-400 text-[8px] px-1.5 py-0.5 rounded uppercase font-bold">Banned</span>}
                    {selectedUser.is_frozen && <span className="bg-cyan-950/60 border border-cyan-900/50 text-cyan-400 text-[8px] px-1.5 py-0.5 rounded uppercase font-bold">Frozen</span>}
                  </div>
                </div>
                <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider block mt-2.5 truncate max-w-[280px]">
                  UUID: {selectedUser.id}
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
                  ? 'bg-red-950/20 border-red-900/60 text-red-400' 
                  : 'bg-emerald-950/20 border-emerald-900/60 text-emerald-400'
              }`}>
                {statusMsg.text}
              </div>
            )}

            {/* Scrollable details area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* Profile Details Grid */}
              <div className="p-4 bg-[#0b0e14] border border-slate-900 rounded-xl space-y-3">
                <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4 text-blue-400" />
                  <span>Platform Profile Information</span>
                </h4>
                
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-[#080a0f] p-2 rounded-lg border border-slate-900/50">
                    <span className="text-[9px] text-slate-500 block font-semibold uppercase">Email</span>
                    <span className="text-slate-200 block font-bold truncate mt-0.5">{selectedUser.email}</span>
                  </div>
                  <div className="bg-[#080a0f] p-2 rounded-lg border border-slate-900/50">
                    <span className="text-[9px] text-slate-500 block font-semibold uppercase">Leaderboard Points</span>
                    <span className="text-slate-200 block font-bold mt-0.5 flex items-center gap-1"><Award className="w-3.5 h-3.5 text-violet-400 shrink-0" /> {selectedUser.leaderboard_stats?.[0]?.points ?? 0}</span>
                  </div>
                  <div className="bg-[#080a0f] p-2 rounded-lg border border-slate-900/50">
                    <span className="text-[9px] text-slate-500 block font-semibold uppercase">Streak</span>
                    <span className="text-slate-200 block font-bold mt-0.5 flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-amber-500 shrink-0" /> {selectedUser.leaderboard_stats?.[0]?.streak ?? 0} days</span>
                  </div>
                  <div className="bg-[#080a0f] p-2 rounded-lg border border-slate-900/50">
                    <span className="text-[9px] text-slate-500 block font-semibold uppercase">Platform Rank</span>
                    <span className="text-slate-200 block font-bold mt-0.5">#{getUserRank(selectedUser)}</span>
                  </div>
                  <div className="bg-[#080a0f] p-2 rounded-lg border border-slate-900/50">
                    <span className="text-[9px] text-slate-500 block font-semibold uppercase">Height / Weight</span>
                    <span className="text-slate-200 block font-bold mt-0.5">
                      {selectedUser.height ? `${selectedUser.height} cm` : 'N/A'} / {selectedUser.weight ? `${selectedUser.weight} kg` : 'N/A'}
                    </span>
                  </div>
                  <div className="bg-[#080a0f] p-2 rounded-lg border border-slate-900/50">
                    <span className="text-[9px] text-slate-500 block font-semibold uppercase">Age / Gender</span>
                    <span className="text-slate-200 block font-bold mt-0.5">
                      {selectedUser.age ? `${selectedUser.age} yrs` : 'N/A'} / {selectedUser.gender || 'N/A'}
                    </span>
                  </div>
                  <div className="bg-[#080a0f] p-2 rounded-lg border border-slate-900/50 col-span-2">
                    <span className="text-[9px] text-slate-500 block font-semibold uppercase">Fitness Goal / Level</span>
                    <span className="text-slate-200 block font-bold mt-0.5">
                      {selectedUser.fitness_goal || 'N/A'} • {selectedUser.experience_level || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Weekly plans split */}
              <div className="p-4 bg-[#0b0e14] border border-slate-900 rounded-xl space-y-3">
                <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-400" />
                  <span>Weekly Plan Schedule</span>
                </h4>
                {loadingHistory ? (
                  <div className="py-2 text-center"><Loader2 className="w-4 h-4 text-slate-600 animate-spin mx-auto" /></div>
                ) : userHistory?.weeklyPlans && userHistory.weeklyPlans.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    {userHistory.weeklyPlans.map(wp => (
                      <div key={wp.id} className="bg-[#080a0f] p-2 rounded-lg border border-slate-900/50 flex justify-between items-center">
                        <span className="font-bold text-slate-400">{wp.day_of_week}</span>
                        <span className="text-slate-200 truncate max-w-[100px]" title={wp.workout_name}>
                          {wp.is_rest_day ? 'Rest' : wp.workout_name}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-650 italic">No weekly plans customized.</p>
                )}
              </div>

              {/* History Timeline */}
              <div className="p-4 bg-[#0b0e14] border border-slate-900 rounded-xl space-y-3">
                <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span>Activity & points history</span>
                </h4>
                
                {loadingHistory ? (
                  <div className="py-4 text-center"><Loader2 className="w-4 h-4 text-slate-600 animate-spin mx-auto" /></div>
                ) : (
                  <div className="space-y-4 max-h-[220px] overflow-y-auto text-[11px] pr-1">
                    
                    {/* Points list */}
                    <div className="space-y-1.5">
                      <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Points adjustments</span>
                      {userHistory?.points && userHistory.points.length > 0 ? (
                        userHistory.points.map(p => (
                          <div key={p.id} className="flex justify-between items-center border-b border-slate-950 pb-1 text-slate-300">
                            <span>{p.date}: {p.description}</span>
                            <span className={`font-bold ${p.points >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {p.points >= 0 ? `+${p.points}` : p.points}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-slate-650 italic">No points history.</p>
                      )}
                    </div>

                    {/* Workouts list */}
                    <div className="space-y-1.5 border-t border-slate-950 pt-2.5">
                      <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Completed Sessions</span>
                      {userHistory?.workouts && userHistory.workouts.length > 0 ? (
                        userHistory.workouts.map(w => (
                          <div key={w.id} className="flex justify-between items-center border-b border-slate-950 pb-1 text-slate-350">
                            <span>{w.date} ({w.completion_percentage}%)</span>
                            <span className="uppercase text-[9px] font-bold text-slate-500">{w.status}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] text-slate-650 italic">No workout logs recorded.</p>
                      )}
                    </div>

                  </div>
                )}
              </div>

              {/* Ban & Freeze history logs */}
              <div className="p-4 bg-[#0b0e14] border border-slate-900 rounded-xl space-y-3">
                <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <AlertOctagon className="w-4 h-4 text-blue-400" />
                  <span>Restriction logs (Bans / Freezes)</span>
                </h4>
                <div className="text-xs space-y-3">
                  <div className="bg-[#080a0f] p-2.5 rounded-lg border border-slate-900/50">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block mb-1">Ban status</span>
                    {getActiveBan(selectedUser) ? (
                      <div>
                        <p className="text-red-400 font-bold">Suspended Account</p>
                        <p className="text-slate-400 mt-1 text-[11px]">Reason: {getActiveBan(selectedUser)?.reason}</p>
                        <p className="text-slate-500 text-[10px] mt-0.5">Until: {getActiveBan(selectedUser)?.banned_until ? new Date(getActiveBan(selectedUser)!.banned_until).toLocaleString() : 'Permanent'}</p>
                      </div>
                    ) : (
                      <p className="text-slate-500 font-medium">No active bans in place.</p>
                    )}
                  </div>
                  <div className="bg-[#080a0f] p-2.5 rounded-lg border border-slate-900/50">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block mb-1">Freeze status</span>
                    {getActiveFreeze(selectedUser) ? (
                      <div>
                        <p className="text-cyan-400 font-bold">Frozen Access</p>
                        <p className="text-slate-400 mt-1 text-[11px]">Reason: {getActiveFreeze(selectedUser)?.reason}</p>
                        <p className="text-slate-500 text-[10px] mt-0.5">Created: {new Date(getActiveFreeze(selectedUser)!.created_at).toLocaleString()}</p>
                      </div>
                    ) : (
                      <p className="text-slate-500 font-medium">No active freeze locks.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Admin notes panel */}
              <div className="p-4 bg-[#0b0e14] border border-slate-900 rounded-xl space-y-3">
                <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  <span>Admin notes (Staff notes)</span>
                </h4>
                <div className="space-y-2">
                  <textarea
                    rows={3}
                    placeholder="Enter confidential notes regarding this athlete..."
                    value={adminNoteInput}
                    onChange={(e) => setAdminNoteInput(e.target.value)}
                    className="w-full bg-[#080a0f] border border-slate-900 focus:border-blue-500 rounded-lg p-2.5 text-xs text-white focus:outline-none placeholder-slate-700 resize-none"
                  />
                  <button
                    onClick={saveAdminNotes}
                    className="w-full bg-slate-900 hover:bg-slate-850 text-white font-bold py-2 rounded-lg text-[11px] transition-all cursor-pointer border border-slate-800"
                  >
                    Save Moderator Notes
                  </button>
                </div>
              </div>

              {/* MODIFICATION ACTIONS */}
              <div className="border-t border-slate-900 pt-5 space-y-4">
                <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Moderation panel actions</h4>

                {/* Edit username */}
                <div className="p-4 bg-[#0b0e14] border border-slate-900 rounded-xl space-y-2 text-xs">
                  <label className="text-[9px] uppercase font-bold text-slate-500 block">Edit Profile Username</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      className="flex-1 bg-[#080a0f] border border-slate-900 rounded-lg p-2 text-white text-xs focus:outline-none"
                    />
                    <button
                      onClick={() => triggerAction('change_username', { newUsername: editUsername })}
                      disabled={actionLoading}
                      className="bg-blue-950/20 hover:bg-blue-900/30 border border-blue-900/50 text-blue-400 px-3 rounded-lg font-bold cursor-pointer transition-all"
                    >
                      Update
                    </button>
                  </div>
                </div>

                {/* Edit points */}
                <div className="p-4 bg-[#0b0e14] border border-slate-900 rounded-xl space-y-3 text-xs">
                  <label className="text-[9px] uppercase font-bold text-slate-500 block">Modify Points Balance</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[8px] text-slate-650 font-bold block mb-1">Delta adjustment</span>
                      <input
                        type="number"
                        placeholder="e.g. 100 or -50"
                        value={adjustPts}
                        onChange={(e) => setAdjustPts(e.target.value)}
                        className="w-full bg-[#080a0f] border border-slate-900 rounded-lg p-2 text-white text-xs focus:outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[8px] text-slate-650 font-bold block mb-1">Reason code</span>
                      <input
                        type="text"
                        placeholder="Description"
                        value={adjustPtsDesc}
                        onChange={(e) => setAdjustPtsDesc(e.target.value)}
                        className="w-full bg-[#080a0f] border border-slate-900 rounded-lg p-2 text-white text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => triggerAction('adjust_points', { points: adjustPts, description: adjustPtsDesc })}
                    disabled={actionLoading}
                    className="w-full bg-slate-900 hover:bg-slate-850 text-blue-400 font-bold py-2 rounded-lg border border-slate-800 transition-all cursor-pointer"
                  >
                    Adjust Points balance
                  </button>
                </div>

                {/* Reset Password */}
                <div className="p-4 bg-[#0b0e14] border border-slate-900 rounded-xl space-y-2 text-xs">
                  <label className="text-[9px] uppercase font-bold text-slate-500 block">Reset Password Credentials</label>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      className="flex-1 bg-[#080a0f] border border-slate-900 rounded-lg p-2 text-white text-xs focus:outline-none"
                    />
                    <button
                      onClick={() => triggerAction('reset_password', { newPassword: editPassword })}
                      disabled={actionLoading}
                      className="bg-blue-950/20 hover:bg-blue-900/30 border border-blue-900/50 text-blue-400 px-3 rounded-lg font-bold cursor-pointer transition-all"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                {/* Freeze / Unfreeze */}
                <div className="p-4 bg-[#0b0e14] border border-slate-900 rounded-xl space-y-3 text-xs">
                  <label className="text-[9px] uppercase font-bold text-slate-500 block">Account Freeze lock</label>
                  {selectedUser.is_frozen ? (
                    <button
                      onClick={() => triggerAction('unfreeze_user', {})}
                      disabled={actionLoading}
                      className="w-full bg-cyan-950/20 hover:bg-cyan-900/30 border border-cyan-900/50 text-cyan-400 py-2 rounded-lg font-bold transition-all cursor-pointer"
                    >
                      Remove Account Freeze Lock
                    </button>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Reason for account freeze..."
                        value={freezeReason}
                        onChange={(e) => setFreezeReason(e.target.value)}
                        className="w-full bg-[#080a0f] border border-slate-900 rounded-lg p-2 text-white text-xs focus:outline-none"
                      />
                      <button
                        onClick={() => triggerAction('freeze_user', { reason: freezeReason })}
                        disabled={actionLoading}
                        className="w-full bg-cyan-950/20 hover:bg-cyan-900/30 border border-cyan-900/50 text-cyan-400 py-2 rounded-lg font-bold transition-all cursor-pointer"
                      >
                        Apply Account Freeze Lock
                      </button>
                    </div>
                  )}
                </div>

                {/* Ban / Unban */}
                <div className="p-4 bg-[#0b0e14] border border-slate-900 rounded-xl space-y-3 text-xs">
                  <label className="text-[9px] uppercase font-bold text-slate-500 block">Access bans (Restriction room)</label>
                  {isUserBanned(selectedUser) ? (
                    <button
                      onClick={() => triggerAction('unban_user', {})}
                      disabled={actionLoading}
                      className="w-full bg-red-950/20 hover:bg-red-900/35 border border-red-900/50 text-red-500 py-2 rounded-lg font-bold transition-all cursor-pointer"
                    >
                      Pardon & Remove Suspension Ban
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[8px] text-slate-650 font-bold block mb-1">Ban limit</span>
                          <select
                            value={banDays}
                            onChange={(e) => setBanDays(e.target.value)}
                            className="w-full bg-[#080a0f] border border-slate-900 rounded-lg p-2 text-white text-xs focus:outline-none"
                          >
                            <option value="1">1 Day</option>
                            <option value="7">7 Days</option>
                            <option value="30">30 Days</option>
                            <option value="365">1 Year</option>
                            <option value="permanent">Permanent</option>
                          </select>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-650 font-bold block mb-1">Violation description</span>
                          <input
                            type="text"
                            placeholder="Reason for suspension"
                            value={banReason}
                            onChange={(e) => setBanReason(e.target.value)}
                            className="w-full bg-[#080a0f] border border-slate-900 rounded-lg p-2 text-white text-xs focus:outline-none"
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
                        className="w-full bg-red-950/20 hover:bg-red-900/35 border border-red-900/50 text-red-500 py-2 rounded-lg font-bold transition-all cursor-pointer"
                      >
                        Apply Suspension Ban
                      </button>
                    </div>
                  )}
                </div>

                {/* Delete Account */}
                <div className="p-4 bg-[#0f0a0c] border border-red-950/50 rounded-xl space-y-3 text-xs">
                  <label className="text-[9px] uppercase font-bold text-red-400 block">Dangerous: Delete Account</label>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    This will permanently excise the user account from auth system. Profiles, history, and weekly splits are cascading deleted. This cannot be undone.
                  </p>
                  <button
                    onClick={() => {
                      if (confirm(`Are you absolutely sure you want to delete user @${selectedUser.username} permanently?`)) {
                        triggerAction('delete_user', {});
                      }
                    }}
                    disabled={actionLoading}
                    className="w-full bg-red-950/30 hover:bg-red-900/30 border border-red-900 text-red-400 py-2 rounded-lg font-bold transition-all cursor-pointer"
                  >
                    Permanently Delete Account
                  </button>
                </div>

              </div>

            </div>

          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-[#090b10]">
            <User className="w-10 h-10 text-slate-800 mb-2" />
            <h3 className="font-bold text-slate-650 text-xs">Select user profile</h3>
            <p className="text-slate-700 text-[11px] mt-1 max-w-[200px] leading-relaxed">
              Click on any row in the registry database to view their profile, plans, workout history, and unlock moderator actions.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
