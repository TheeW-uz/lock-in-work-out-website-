'use client';

import React, { useEffect, useState } from 'react';
import { 
  FileText, 
  Search, 
  Loader2, 
  RefreshCw,
  ArrowUpDown,
  User,
  Shield,
  Activity
} from 'lucide-react';

interface AuditLog {
  id: string;
  admin_username: string;
  action_type: string;
  target_user_id: string;
  details: string;
  created_at: string;
}

interface UserMap {
  [id: string]: string;
}

export default function AdminLogsPage() {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userMap, setUserMap] = useState<UserMap>({});
  const [refreshing, setRefreshing] = useState(false);

  // Sorting
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchLogs = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.auditLogs || []);
        
        // Build a quick ID -> Username map to make target IDs readable in the logs table
        const mapping: UserMap = {};
        (data.users || []).forEach((u: any) => {
          mapping[u.id] = u.username;
        });
        setUserMap(mapping);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionBadge = (type: string) => {
    const base = "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border tracking-wider ";
    switch (type) {
      case 'adjust_points':
        return <span className={base + "bg-amber-950/40 text-amber-400 border-amber-900/30"}>Points Adjustment</span>;
      case 'ban_user':
        return <span className={base + "bg-red-950/40 text-red-500 border-red-900/30"}>User Banned</span>;
      case 'unban_user':
        return <span className={base + "bg-emerald-950/40 text-emerald-400 border-emerald-900/30"}>User Unbanned</span>;
      case 'freeze_user':
        return <span className={base + "bg-cyan-950/40 text-cyan-400 border-cyan-900/30"}>User Frozen</span>;
      case 'unfreeze_user':
        return <span className={base + "bg-cyan-950/20 text-cyan-500 border-cyan-900/30"}>User Unfrozen</span>;
      case 'change_username':
        return <span className={base + "bg-violet-950/40 text-violet-400 border-violet-900/30"}>Username Change</span>;
      case 'reset_password':
        return <span className={base + "bg-rose-950/40 text-rose-400 border-rose-900/30"}>Password Reset</span>;
      case 'delete_user':
        return <span className={base + "bg-red-950/60 text-red-400 border-red-900/50"}>Account Deleted</span>;
      default:
        return <span className={base + "bg-slate-900 text-slate-400 border-slate-800"}>{type}</span>;
    }
  };

  // Filter logs by search query
  const filteredLogs = logs.filter(log => {
    const query = searchQuery.toLowerCase();
    const admin = log.admin_username.toLowerCase();
    const type = log.action_type.toLowerCase();
    const details = log.details.toLowerCase();
    const targetUsername = (userMap[log.target_user_id] || '').toLowerCase();
    
    return admin.includes(query) || 
      type.includes(query) || 
      details.includes(query) || 
      log.target_user_id.includes(query) || 
      targetUsername.includes(query);
  });

  // Sort logs by created_at
  const sortedLogs = [...filteredLogs].sort((a, b) => {
    const timeA = new Date(a.created_at).getTime();
    const timeB = new Date(b.created_at).getTime();
    return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
  });

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="h-full w-full overflow-hidden flex flex-col p-6 space-y-6">
      
      {/* Title */}
      <div className="flex justify-between items-center gap-4 shrink-0">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight uppercase flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <span>Command Audit Logs</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">Immutable register tracking every administrative decision and action.</p>
        </div>
        <button 
          onClick={fetchLogs}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#111420] hover:bg-[#181d2f] border border-slate-900 text-slate-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Refreshing...' : 'Refresh Logs'}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="relative max-w-md shrink-0">
        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-500" />
        </span>
        <input
          type="text"
          placeholder="Filter logs by admin, target user, action, or reason..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#0d1017] border border-slate-900 focus:border-blue-500 rounded-xl py-2.5 pl-11 pr-4 text-xs text-slate-200 focus:outline-none placeholder-slate-700"
        />
      </div>

      {/* Logs Table Area */}
      <div className="flex-1 overflow-auto border border-slate-900 rounded-2xl bg-[#0b0e14]">
        {loading ? (
          <div className="h-full w-full flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
          </div>
        ) : sortedLogs.length === 0 ? (
          <div className="h-full w-full flex items-center justify-center text-xs text-slate-655 italic">
            No audits registered matching criteria.
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-900 text-[10px] text-slate-500 uppercase font-extrabold tracking-wider bg-[#0d1017] sticky top-0 z-10">
                <th className="p-4">
                  <button 
                    onClick={toggleSortOrder}
                    className="flex items-center gap-1 hover:text-white cursor-pointer"
                  >
                    <span>Timestamp</span>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                </th>
                <th className="p-4">Moderator</th>
                <th className="p-4">Action Type</th>
                <th className="p-4">Target User</th>
                <th className="p-4">Operation Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/60">
              {sortedLogs.map(log => {
                const targetName = userMap[log.target_user_id] 
                  ? `@${userMap[log.target_user_id]}` 
                  : `ID: ${log.target_user_id.substring(0, 8)}...`;
                
                return (
                  <tr key={log.id} className="hover:bg-[#0e121b] transition-colors">
                    <td className="p-4 text-slate-400 font-semibold whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-4 font-bold text-slate-200">
                      @{log.admin_username}
                    </td>
                    <td className="p-4">
                      {getActionBadge(log.action_type)}
                    </td>
                    <td className="p-4 font-bold text-blue-400 whitespace-nowrap">
                      {targetName}
                    </td>
                    <td className="p-4 text-slate-300 font-medium italic max-w-sm">
                      <div className="bg-slate-950/40 p-2 rounded-lg border border-slate-900/30 leading-relaxed">
                        {log.details}
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
  );
}
