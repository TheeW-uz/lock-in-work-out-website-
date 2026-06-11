'use client';

import React, { useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { supabase } from '@/lib/supabase';
import { 
  User, 
  Mail, 
  Lock, 
  Sun, 
  Moon, 
  Trophy, 
  Flame, 
  Loader2, 
  CheckCircle, 
  Info,
  ShieldCheck
} from 'lucide-react';

export default function SettingsPage() {
  const { profile, stats, theme, toggleTheme, refreshProfile } = useAuth();

  // Username edit states
  const [username, setUsername] = useState(profile?.username || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  
  // Password change states
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  
  // Notification states
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

  const showStatus = (text: string, type: 'success' | 'error' = 'success') => {
    setStatusMsg({ text, type });
    setTimeout(() => setStatusMsg({ text: '', type: '' }), 4000);
  };

  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;
    if (!username.trim() || username.trim().length < 3) {
      showStatus('Username must be at least 3 characters.', 'error');
      return;
    }

    setUpdatingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: username.trim() })
        .eq('id', profile.id);

      if (error) throw error;

      // Update auth user metadata
      await supabase.auth.updateUser({
        data: { username: username.trim() }
      });

      showStatus('Username updated successfully!', 'success');
      await refreshProfile();
    } catch (err: any) {
      console.error(err);
      showStatus(err.message || 'Failed to update username. It might be already taken.', 'error');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      showStatus('Password must be at least 6 characters.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showStatus('Passwords do not match.', 'error');
      return;
    }

    setUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      showStatus('Password updated successfully!', 'success');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error(err);
      showStatus(err.message || 'Failed to update password.', 'error');
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-8 md:px-10">
      
      {/* HEADER */}
      <header className="mb-8 border-b border-zinc-900 pb-6">
        <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider block">
          Control Panel
        </span>
        <h1 className="text-3xl font-extrabold text-white mt-1" style={{ fontFamily: 'var(--font-display)' }}>
          Settings
        </h1>
      </header>

      {/* STATUS BANNER */}
      {statusMsg.text && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 mb-6 animate-fadeIn ${
          statusMsg.type === 'error' 
            ? 'bg-red-950/20 border-red-900 text-red-400' 
            : 'bg-emerald-950/20 border-emerald-900 text-emerald-400'
        }`}>
          <Info className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{statusMsg.text}</p>
        </div>
      )}

      <div className="max-w-3xl space-y-6">
        
        {/* SMALL SCORE & STATS HUDBAR */}
        <div className="glass-panel p-5 rounded-2xl border-zinc-900 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-900/30 text-violet-400 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <span className="text-zinc-400 text-xs font-bold block leading-tight">Total Points Score</span>
              <span className="text-[10px] text-zinc-500 font-semibold block leading-none mt-1">Real-time database stats</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-center">
              <span className="text-lg font-extrabold text-white block leading-none">{stats?.points || 0}</span>
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block mt-1.5 leading-none">points</span>
            </div>
            <div className="text-center border-l border-zinc-900 pl-6">
              <span className="text-lg font-extrabold text-white block leading-none flex items-center justify-center gap-1">
                <Flame className="w-4.5 h-4.5 text-amber-500 inline shrink-0" />
                <span>{stats?.streak || 0}d</span>
              </span>
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block mt-1.5 leading-none">streak</span>
            </div>
            <div className="text-center border-l border-zinc-900 pl-6">
              <span className="text-lg font-extrabold text-emerald-400 block leading-none">{stats?.completed_count || 0}</span>
              <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block mt-1.5 leading-none">logs</span>
            </div>
          </div>
        </div>

        {/* THEME TOGGLE */}
        <div className="glass-panel p-6 rounded-2xl border-zinc-900 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">App Interface Theme</h3>
            <p className="text-zinc-500 text-xs mt-1">Toggle between obsidian dark mode and light theme layouts.</p>
          </div>

          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 bg-[#0b0c11] border border-zinc-900 hover:border-zinc-800 text-zinc-300 hover:text-white px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-[0.97]"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Light Theme</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-violet-400" />
                <span>Obsidian Dark</span>
              </>
            )}
          </button>
        </div>

        {/* ACCOUNT SETTINGS FORM */}
        <div className="glass-panel p-6 rounded-2xl border-zinc-900 space-y-5">
          <h3 className="text-base font-bold text-white border-b border-zinc-900 pb-3 flex items-center gap-2">
            <User className="w-4.5 h-4.5 text-violet-400" />
            <span>Profile Details</span>
          </h3>

          <form onSubmit={handleUpdateUsername} className="space-y-4">
            <div>
              <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1.5">Email Address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-zinc-600" />
                </span>
                <input
                  type="email"
                  disabled
                  value={profile?.email || ''}
                  className="w-full bg-[#0d0f16]/40 border border-zinc-900 rounded-xl py-2.5 pl-11 pr-4 text-zinc-500 text-xs focus:outline-none cursor-not-allowed"
                />
              </div>
              <span className="text-[9px] text-zinc-600 mt-1 block">Email updates are handled via authentication security.</span>
            </div>

            <div>
              <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1.5">Username</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-zinc-500" />
                </span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="fit_warrior"
                  className="w-full bg-[#0d0f16] border border-zinc-850 focus:border-violet-500 rounded-xl py-2.5 pl-11 pr-4 text-white text-xs focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={updatingProfile}
              className="bg-[#121622] border border-zinc-800 text-zinc-300 hover:text-white font-bold rounded-xl px-4 py-2 text-xs flex items-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-55"
            >
              {updatingProfile ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Save Profile Settings'
              )}
            </button>
          </form>
        </div>

        {/* SECURITY PASSWORD CHANGE FORM */}
        <div className="glass-panel p-6 rounded-2xl border-zinc-900 space-y-5">
          <h3 className="text-base font-bold text-white border-b border-zinc-900 pb-3 flex items-center gap-2">
            <Lock className="w-4.5 h-4.5 text-violet-400" />
            <span>Update Account Password</span>
          </h3>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1.5">New Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-zinc-500" />
                </span>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full bg-[#0d0f16] border border-zinc-850 focus:border-violet-500 rounded-xl py-2.5 pl-11 pr-4 text-white text-xs focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-zinc-500 uppercase font-semibold block mb-1.5">Confirm New Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-zinc-500" />
                </span>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full bg-[#0d0f16] border border-zinc-850 focus:border-violet-500 rounded-xl py-2.5 pl-11 pr-4 text-white text-xs focus:outline-none transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={updatingPassword}
              className="bg-[#121622] border border-zinc-800 text-zinc-300 hover:text-white font-bold rounded-xl px-4 py-2 text-xs flex items-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-55"
            >
              {updatingPassword ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Update Password'
              )}
            </button>
          </form>
        </div>

      </div>

    </div>
  );
}
