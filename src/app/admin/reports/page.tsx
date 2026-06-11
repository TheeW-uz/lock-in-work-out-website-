'use client';

import React, { useEffect, useState } from 'react';
import { 
  MessageSquare, 
  Loader2, 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  XCircle, 
  User, 
  ChevronRight,
  AlertTriangle,
  CornerDownRight,
  Send
} from 'lucide-react';

interface Report {
  id: string;
  user_id: string;
  user?: {
    username: string;
    email: string;
  };
  type: string; // 'point_recovery', 'ban_appeal', 'freeze_request', 'bug_report'
  title: string;
  description: string;
  status: string; // 'pending', 'resolved', 'rejected'
  admin_notes: string;
  created_at: string;
  updated_at: string;
}

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  
  // Update state
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

  const loadReports = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/reports');
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
        
        if (selectedReport) {
          const fresh = (data.reports || []).find((r: Report) => r.id === selectedReport.id);
          if (fresh) {
            setSelectedReport(fresh);
            setAdminNotes(fresh.admin_notes || '');
          }
        }
      }
    } catch (err) {
      console.error(err);
      showStatus('Failed to retrieve tickets registry', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const selectReport = (r: Report) => {
    setSelectedReport(r);
    setAdminNotes(r.admin_notes || '');
  };

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg({ text: '', type: '' }), 4000);
  };

  const updateReportStatus = async (status: 'resolved' | 'rejected') => {
    if (!selectedReport) return;
    setActionLoading(true);
    setStatusMsg({ text: '', type: '' });

    try {
      const res = await fetch('/api/admin/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId: selectedReport.id,
          status,
          adminNotes
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update ticket');

      showStatus(`Ticket marked as ${status}!`, 'success');
      await loadReports();
    } catch (err: any) {
      showStatus(err.message || 'Operation failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'point_recovery':
        return <span className="bg-amber-950/40 text-amber-400 border border-amber-900/30 px-2 py-0.5 rounded text-[9px] uppercase font-bold">Point Recovery</span>;
      case 'ban_appeal':
        return <span className="bg-red-950/40 text-red-500 border border-red-900/30 px-2 py-0.5 rounded text-[9px] uppercase font-bold">Ban Appeal</span>;
      case 'freeze_request':
        return <span className="bg-cyan-950/40 text-cyan-400 border border-cyan-900/30 px-2 py-0.5 rounded text-[9px] uppercase font-bold">Freeze Request</span>;
      case 'bug_report':
        return <span className="bg-violet-950/40 text-violet-400 border border-violet-900/30 px-2 py-0.5 rounded text-[9px] uppercase font-bold">Bug Report</span>;
      default:
        return <span className="bg-slate-900 text-slate-400 border border-slate-800 px-2 py-0.5 rounded text-[9px] uppercase font-bold">{type}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="flex items-center gap-1 text-[10px] text-amber-500 font-bold uppercase"><Clock className="w-3.5 h-3.5" /> Pending</span>;
      case 'resolved':
        return <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold uppercase"><CheckCircle className="w-3.5 h-3.5" /> Resolved</span>;
      case 'rejected':
        return <span className="flex items-center gap-1 text-[10px] text-red-500 font-bold uppercase"><XCircle className="w-3.5 h-3.5" /> Rejected</span>;
      default:
        return <span className="text-[10px] text-slate-500 font-bold uppercase">{status}</span>;
    }
  };

  return (
    <div className="h-full w-full flex overflow-hidden">
      
      {/* LEFT COLUMN: Tickets list */}
      <div className={`flex-1 h-full flex flex-col p-6 overflow-hidden ${selectedReport ? 'hidden xl:flex xl:w-7/12 shrink-0' : 'w-full'}`}>
        
        {/* Title */}
        <div className="flex justify-between items-center gap-4 mb-4">
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight uppercase flex items-center gap-2">
              <span>Reports & Appeals Dispatch</span>
              <span className="text-xs bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full text-slate-400 font-bold">
                {reports.length} Tickets
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">Review bug reports, ban appeals, points correction requests, and freezes.</p>
          </div>
          <button 
            onClick={loadReports}
            className="p-2 bg-[#111420] border border-slate-900 rounded-lg hover:bg-slate-900 transition-colors"
          >
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Tickets Scroll area */}
        <div className="flex-1 overflow-auto space-y-3 pr-1">
          {loading ? (
            <div className="h-full w-full flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            </div>
          ) : reports.length === 0 ? (
            <div className="h-full w-full border border-slate-900 rounded-2xl bg-[#0b0e14] flex items-center justify-center text-xs text-slate-650 italic">
              No tickets or appeals filed.
            </div>
          ) : (
            reports.map(r => (
              <div
                key={r.id}
                onClick={() => selectReport(r)}
                className={`p-4 rounded-xl border transition-all cursor-pointer text-xs ${
                  selectedReport?.id === r.id
                    ? 'bg-[#0f1420]/80 border-blue-900 shadow-lg shadow-blue-500/5'
                    : 'bg-[#0b0e14] border-slate-900 hover:border-slate-800'
                } flex flex-col md:flex-row justify-between items-start md:items-center gap-4`}
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getTypeBadge(r.type)}
                    <span className="text-slate-500">•</span>
                    <span className="font-extrabold text-slate-300">@{r.user?.username || 'user'}</span>
                  </div>
                  <h3 className="font-bold text-white text-sm truncate">{r.title}</h3>
                  <p className="text-slate-450 text-[11px] truncate">{r.description}</p>
                </div>

                <div className="flex flex-col md:items-end justify-between gap-1.5 shrink-0">
                  {getStatusBadge(r.status)}
                  <span className="text-[10px] text-slate-600 font-semibold">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* RIGHT COLUMN: Ticket Inspector */}
      <div className={`w-full xl:w-5/12 h-full border-l border-slate-900 bg-[#090b10] flex flex-col overflow-hidden shrink-0 ${selectedReport ? 'flex' : 'hidden xl:flex'}`}>
        {selectedReport ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-900 bg-[#0b0e14] flex justify-between items-start gap-4">
              <div>
                <h3 className="font-extrabold text-white text-base leading-none">Inspect Ticket</h3>
                <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mt-2.5 block">
                  ID: {selectedReport.id}
                </span>
              </div>
              <button 
                onClick={() => setSelectedReport(null)}
                className="p-1 rounded-lg hover:bg-slate-900 text-slate-500 hover:text-white"
              >
                <XCircle className="w-4.5 h-4.5" />
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

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* Requester details */}
              <div className="p-4 bg-[#0b0e14] border border-slate-900 rounded-xl space-y-3">
                <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4.5 h-4.5 text-blue-400" />
                  <span>Requester Account Info</span>
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-[#080a0f] p-2 rounded-lg border border-slate-900/50">
                    <span className="text-[9px] text-slate-500 block uppercase font-bold">Username</span>
                    <span className="text-slate-200 block font-bold mt-0.5">@{selectedReport.user?.username || 'user'}</span>
                  </div>
                  <div className="bg-[#080a0f] p-2 rounded-lg border border-slate-900/50">
                    <span className="text-[9px] text-slate-500 block uppercase font-bold">Email</span>
                    <span className="text-slate-200 block font-bold mt-0.5 truncate">{selectedReport.user?.email || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Ticket content card */}
              <div className="p-4 bg-[#0b0e14] border border-slate-900 rounded-xl space-y-3.5">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  {getTypeBadge(selectedReport.type)}
                  {getStatusBadge(selectedReport.status)}
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-white leading-snug">{selectedReport.title}</h3>
                  <span className="text-[10px] text-slate-500 font-bold block pt-0.5">Submitted: {new Date(selectedReport.created_at).toLocaleString()}</span>
                </div>

                <div className="bg-[#080a0f] border border-slate-950 p-3 rounded-lg text-xs leading-relaxed text-slate-300 whitespace-pre-wrap">
                  {selectedReport.description}
                </div>
              </div>

              {/* Action Form */}
              <div className="p-4 bg-[#0b0e14] border border-slate-900 rounded-xl space-y-4 text-xs">
                <h4 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-blue-400" />
                  <span>Confidential Staff Notes & Resolution</span>
                </h4>

                <div className="space-y-2">
                  <label className="text-[9px] uppercase font-bold text-slate-500 block">Resolution Comments</label>
                  <textarea
                    rows={4}
                    placeholder="Enter any notes, decision justification, or instructions for the user..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full bg-[#080a0f] border border-slate-900 focus:border-blue-500 rounded-lg p-2.5 text-xs text-white focus:outline-none placeholder-slate-700 resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => updateReportStatus('resolved')}
                    disabled={actionLoading || selectedReport.status === 'resolved'}
                    className="flex-1 bg-emerald-950/20 hover:bg-emerald-900/30 border border-emerald-900/50 text-emerald-400 py-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Accept & Resolve</span>
                  </button>
                  <button
                    onClick={() => updateReportStatus('rejected')}
                    disabled={actionLoading || selectedReport.status === 'rejected'}
                    className="flex-1 bg-red-950/20 hover:bg-red-900/30 border border-red-900/50 text-red-500 py-2.5 rounded-xl font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject Request</span>
                  </button>
                </div>
              </div>

            </div>

          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-[#090b10]">
            <MessageSquare className="w-10 h-10 text-slate-800 mb-2" />
            <h3 className="font-bold text-slate-650 text-xs">Select a ticket to investigate</h3>
            <p className="text-slate-700 text-[11px] mt-1 max-w-[200px] leading-relaxed">
              Click on any report in the registry to inspect user appeals, review description parameters, and authorize resolution actions.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
