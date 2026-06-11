'use client';

import React, { useEffect, useState } from 'react';
import { 
  ShieldAlert, 
  Lock, 
  Search, 
  Loader2, 
  RefreshCw,
  AlertTriangle,
  Calendar,
  UserCheck,
  UserX,
  XCircle,
  HelpCircle,
  Plus
} from 'lucide-react';

interface RestrictionUser {
  id: string;
  username: string;
  email: string;
  is_frozen: boolean;
  activeBan: {
    id: string;
    reason: string;
    banned_until: string | null;
    created_at: string;
  } | null;
  activeFreeze: {
    id: string;
    reason: string;
    created_at: string;
  } | null;
}

export default function AdminBansPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<RestrictionUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create restriction form states
  const [selectedUserToRestrict, setSelectedUserToRestrict] = useState<string>('');
  const [restrictionType, setRestrictionType] = useState<'ban' | 'freeze'>('ban');
  const [reasonInput, setReasonInput] = useState('');
  const [banLimit, setBanLimit] = useState('7');

  const [actionLoading, setActionLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

  const loadRestrictionDatabase = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        const rawUsers = data.users || [];
        
        const now = new Date();
        const mapped: RestrictionUser[] = rawUsers.map((u: any) => {
          // Check for active ban
          const activeBanRow = u.bans?.find((b: any) => !b.banned_until || new Date(b.banned_until) > now) || null;
          // Check for freeze
          const activeFreezeRow = u.is_frozen && u.account_freezes?.length > 0 
            ? u.account_freezes[u.account_freezes.length - 1] 
            : null;

          return {
            id: u.id,
            username: u.username,
            email: u.email,
            is_frozen: u.is_frozen,
            activeBan: activeBanRow ? {
              id: activeBanRow.id,
              reason: activeBanRow.reason,
              banned_until: activeBanRow.banned_until,
              created_at: activeBanRow.created_at
            } : null,
            activeFreeze: activeFreezeRow ? {
              id: activeFreezeRow.id,
              reason: activeFreezeRow.reason,
              created_at: activeFreezeRow.created_at
            } : null
          };
        });

        setUsers(mapped);
      }
    } catch (err) {
      console.error(err);
      showStatus('Failed to load restrictions logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRestrictionDatabase();
  }, []);

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg({ text: '', type: '' }), 4000);
  };

  const executeAction = async (action: string, userId: string, dataPayload: any) => {
    setActionLoading(true);
    setStatusMsg({ text: '', type: '' });

    try {
      const res = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          userId,
          data: dataPayload
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to complete restriction action');

      showStatus(`Action "${action}" completed successfully!`, 'success');
      await loadRestrictionDatabase();
      
      // Reset inputs if restriction creation succeeds
      if (action === 'ban_user' || action === 'freeze_user') {
        setSelectedUserToRestrict('');
        setReasonInput('');
      }
    } catch (err: any) {
      showStatus(err.message || 'Operation failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateRestriction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserToRestrict) {
      showStatus('Please select a target user to restrict', 'error');
      return;
    }

    if (restrictionType === 'ban') {
      const date = new Date();
      const until = banLimit === 'permanent' 
        ? null 
        : new Date(date.setDate(date.getDate() + parseInt(banLimit))).toISOString();
      executeAction('ban_user', selectedUserToRestrict, { reason: reasonInput, bannedUntil: until });
    } else {
      executeAction('freeze_user', selectedUserToRestrict, { reason: reasonInput });
    }
  };

  const restrictedUsers = users.filter(u => u.activeBan || u.is_frozen);
  const nonRestrictedUsers = users.filter(u => !u.activeBan && !u.is_frozen && !u.username.includes('admin'));

  // Search filtering
  const filteredBanned = restrictedUsers.filter(u => 
    (u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())) && u.activeBan
  );

  const filteredFrozen = restrictedUsers.filter(u => 
    (u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())) && u.is_frozen
  );

  return (
    <div className="h-full w-full overflow-y-auto p-6 space-y-8">
      
      {/* Title */}
      <div className="flex justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight uppercase">Bans & Freezes Center</h2>
          <p className="text-xs text-slate-500 mt-1">Impose platform suspensions and freeze accounts for security or policy enforcement.</p>
        </div>
        <button 
          onClick={loadRestrictionDatabase}
          className="p-2 bg-[#111420] border border-slate-900 rounded-lg hover:bg-slate-900 transition-colors"
        >
          <RefreshCw className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {statusMsg.text && (
        <div className={`p-4 rounded-xl border text-xs font-semibold ${
          statusMsg.type === 'error' 
            ? 'bg-red-950/20 border-red-900/60 text-red-400' 
            : 'bg-emerald-950/20 border-emerald-900/60 text-emerald-400'
        }`}>
          {statusMsg.text}
        </div>
      )}

      {/* Grid containing forms and list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Create Restriction Form */}
        <div className="lg:col-span-1 p-5 bg-[#0b0e14] border border-slate-900 rounded-2xl h-fit space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-900/60 pb-3">
            <Plus className="w-4.5 h-4.5 text-blue-400" />
            <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Impose Restriction</h3>
          </div>

          <form onSubmit={handleCreateRestriction} className="space-y-4 text-xs">
            
            {/* Target User Selector */}
            <div>
              <label className="text-[9px] uppercase font-bold text-slate-500 block mb-1">Target User</label>
              <select
                value={selectedUserToRestrict}
                onChange={(e) => setSelectedUserToRestrict(e.target.value)}
                className="w-full bg-[#080a0f] border border-slate-900 rounded-lg p-2.5 text-white focus:outline-none"
              >
                <option value="">-- Choose Athlete --</option>
                {nonRestrictedUsers.map(u => (
                  <option key={u.id} value={u.id}>@{u.username} ({u.email})</option>
                ))}
              </select>
            </div>

            {/* Restriction Type Toggle */}
            <div>
              <label className="text-[9px] uppercase font-bold text-slate-500 block mb-1">Restriction Mode</label>
              <div className="grid grid-cols-2 gap-2 bg-[#080a0f] p-1 border border-slate-900 rounded-lg">
                <button
                  type="button"
                  onClick={() => setRestrictionType('ban')}
                  className={`py-1.5 rounded-md text-[11px] font-bold cursor-pointer ${
                    restrictionType === 'ban' ? 'bg-red-950/40 text-red-500 border border-red-900/40' : 'text-slate-500'
                  }`}
                >
                  Impose Ban
                </button>
                <button
                  type="button"
                  onClick={() => setRestrictionType('freeze')}
                  className={`py-1.5 rounded-md text-[11px] font-bold cursor-pointer ${
                    restrictionType === 'freeze' ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-900/40' : 'text-slate-500'
                  }`}
                >
                  Freeze Account
                </button>
              </div>
            </div>

            {/* Ban limit selection */}
            {restrictionType === 'ban' && (
              <div>
                <label className="text-[9px] uppercase font-bold text-slate-500 block mb-1">Ban Duration</label>
                <select
                  value={banLimit}
                  onChange={(e) => setBanLimit(e.target.value)}
                  className="w-full bg-[#080a0f] border border-slate-900 rounded-lg p-2.5 text-white focus:outline-none"
                >
                  <option value="1">1 Day</option>
                  <option value="7">7 Days</option>
                  <option value="30">30 Days</option>
                  <option value="365">1 Year</option>
                  <option value="permanent">Permanent / Indefinite</option>
                </select>
              </div>
            )}

            {/* Reason */}
            <div>
              <label className="text-[9px] uppercase font-bold text-slate-500 block mb-1">Reason / Infraction Code</label>
              <textarea
                rows={3}
                placeholder="Describe details of the violation or freeze reason..."
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
                className="w-full bg-[#080a0f] border border-slate-900 focus:border-blue-500 rounded-lg p-2.5 text-white focus:outline-none placeholder-slate-700 resize-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={actionLoading || !selectedUserToRestrict}
              className={`w-full py-2.5 rounded-xl font-bold cursor-pointer text-xs transition-all disabled:opacity-40 flex items-center justify-center gap-1.5 ${
                restrictionType === 'ban' 
                  ? 'bg-red-950/20 hover:bg-red-900/30 border border-red-900/40 text-red-500' 
                  : 'bg-cyan-950/20 hover:bg-cyan-900/30 border border-cyan-900/40 text-cyan-400'
              }`}
            >
              {restrictionType === 'ban' ? <UserX className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              <span>{restrictionType === 'ban' ? 'Authorize Ban Restriction' : 'Authorize Account Freeze'}</span>
            </button>
          </form>
        </div>

        {/* Right Side: Active Restrictions Registry */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Search bar for restrictions */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-500" />
            </span>
            <input
              type="text"
              placeholder="Search restricted athletes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0d1017] border border-slate-900 focus:border-blue-500 rounded-xl py-2.5 pl-11 pr-4 text-xs text-slate-200 focus:outline-none placeholder-slate-700"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Active suspensions */}
            <div className="p-5 bg-[#0b0e14] border border-slate-900 rounded-2xl flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-slate-900/60 pb-3">
                <ShieldAlert className="w-4.5 h-4.5 text-red-400" />
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Active Suspensions</h3>
              </div>

              {loading ? (
                <div className="py-8 text-center"><Loader2 className="w-5 h-5 text-slate-755 animate-spin mx-auto" /></div>
              ) : filteredBanned.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-650 italic">No active bans registered.</p>
              ) : (
                <div className="space-y-3">
                  {filteredBanned.map(u => (
                    <div key={u.id} className="p-3 bg-[#080a0f] border border-slate-900 rounded-xl space-y-2 text-xs">
                      <div className="flex justify-between items-start gap-3">
                        <span className="font-bold text-slate-200 truncate">@{u.username}</span>
                        <button
                          onClick={() => executeAction('unban_user', u.id, {})}
                          disabled={actionLoading}
                          className="text-[9px] font-extrabold text-emerald-400 hover:text-emerald-350 bg-emerald-950/20 hover:bg-emerald-950/45 px-2 py-0.5 rounded border border-emerald-900/40 cursor-pointer"
                        >
                          Pardon
                        </button>
                      </div>
                      <p className="text-slate-400 leading-normal text-[11px] italic bg-[#0b0e14] p-2 border border-slate-900/50 rounded-lg">
                        Reason: {u.activeBan?.reason}
                      </p>
                      <div className="flex justify-between text-[9px] text-slate-500 font-semibold pt-1">
                        <span>Issued: {u.activeBan?.created_at ? new Date(u.activeBan.created_at).toLocaleDateString() : 'N/A'}</span>
                        <span>Until: {u.activeBan?.banned_until ? new Date(u.activeBan.banned_until).toLocaleDateString() : 'Permanent'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Active Freeze Locks */}
            <div className="p-5 bg-[#0b0e14] border border-slate-900 rounded-2xl flex flex-col gap-4">
              <div className="flex items-center gap-2 border-b border-slate-900/60 pb-3">
                <Lock className="w-4.5 h-4.5 text-cyan-400" />
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Active Freeze Locks</h3>
              </div>

              {loading ? (
                <div className="py-8 text-center"><Loader2 className="w-5 h-5 text-slate-755 animate-spin mx-auto" /></div>
              ) : filteredFrozen.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-655 italic">No accounts frozen currently.</p>
              ) : (
                <div className="space-y-3">
                  {filteredFrozen.map(u => (
                    <div key={u.id} className="p-3 bg-[#080a0f] border border-slate-900 rounded-xl space-y-2 text-xs">
                      <div className="flex justify-between items-start gap-3">
                        <span className="font-bold text-slate-200 truncate">@{u.username}</span>
                        <button
                          onClick={() => executeAction('unfreeze_user', u.id, {})}
                          disabled={actionLoading}
                          className="text-[9px] font-extrabold text-emerald-400 hover:text-emerald-350 bg-emerald-950/20 hover:bg-emerald-950/45 px-2 py-0.5 rounded border border-emerald-900/40 cursor-pointer"
                        >
                          Unfreeze
                        </button>
                      </div>
                      <p className="text-slate-400 leading-normal text-[11px] italic bg-[#0b0e14] p-2 border border-slate-900/50 rounded-lg">
                        Reason: {u.activeFreeze?.reason || 'Request freeze'}
                      </p>
                      <div className="text-[9px] text-slate-500 font-semibold pt-1">
                        <span>Frozen: {u.activeFreeze?.created_at ? new Date(u.activeFreeze.created_at).toLocaleString() : 'N/A'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
