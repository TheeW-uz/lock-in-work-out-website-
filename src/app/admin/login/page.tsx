'use client';

import React, { useState } from 'react';
import { ShieldAlert, User, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      router.push('/admin/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-[#08080a] px-4">
      {/* Background Cyberpunk Red Glow */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-red-650/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-tr from-red-655 to-rose-600 shadow-lg shadow-red-500/20 mb-4 border border-red-500/30">
            <ShieldAlert className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            CONTROL ROOM
          </h1>
          <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest">
            Lock-In Administration
          </p>
        </div>

        <div className="glass-panel p-8 rounded-3xl shadow-2xl relative overflow-hidden border-red-950/40">
          {/* Subtle top border reflection */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-900/40 to-transparent" />

          <h2 className="text-xl font-bold text-white mb-6 text-center">
            Admin Authentication
          </h2>

          {errorMsg && (
            <div className="p-4 rounded-xl bg-red-950/30 border border-red-800 text-red-300 flex items-start gap-3 mb-6 animate-fadeIn">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-2">
                Admin Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-zinc-650" />
                </span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full bg-[#121013] border border-zinc-900 focus:border-red-500 rounded-xl py-3 pl-11 pr-4 text-white placeholder-zinc-700 focus:outline-none transition-all duration-200 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-2">
                Secret Access Key
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-zinc-650" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#121013] border border-zinc-900 focus:border-red-500 rounded-xl py-3 pl-11 pr-4 text-white placeholder-zinc-700 focus:outline-none transition-all duration-200 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold rounded-xl py-3 shadow-lg shadow-red-500/10 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 text-sm mt-2 cursor-pointer disabled:opacity-55"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                'Grant Command Access'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
