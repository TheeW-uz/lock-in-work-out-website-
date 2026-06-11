'use client';

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import { Dumbbell, Mail, Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // If already logged in, show loading or let AuthProvider redirect
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#08090d]">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setAuthLoading(true);

    try {
      if (isSignUp) {
        if (!username || username.trim().length < 3) {
          throw new Error('Username must be at least 3 characters');
        }
        
        // Register user
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username.trim(),
            },
          },
        });

        if (error) throw error;
        
        // Show check email message or info
        if (data.session) {
          router.replace('/dashboard');
        } else {
          setErrorMsg('Registration successful! Please check your email for verification.');
        }
      } else {
        // Sign in user
        let loginEmail = email.trim();
        if (!loginEmail.includes('@')) {
          // Look up username to get email
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('email')
            .eq('username', loginEmail)
            .single();

          if (profileError || !profileData?.email) {
            throw new Error('Username not found');
          }
          loginEmail = profileData.email;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password,
        });

        if (error) throw error;
        if (data.session) {
          router.replace('/dashboard');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center overflow-hidden bg-[#08090d] px-4 py-12">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />

      {/* Main Container */}
      <div className="w-full max-w-[450px] z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-xl shadow-violet-500/20 mb-5">
            <Dumbbell className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-3" style={{ fontFamily: 'var(--font-display)' }}>
            LOCK-IN
          </h1>
          <p className="text-zinc-400 text-sm md:text-base font-medium">
            AI-powered workout tracking and routine builder
          </p>
        </div>

        <div className="glass-panel p-10 md:p-12 rounded-3xl shadow-2xl relative overflow-hidden">
          {/* Subtle top border reflection */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent" />

          <h2 className="text-2xl font-bold text-white mb-8 text-center">
            {isSignUp ? 'Create your Account' : 'Sign In to Dashboard'}
          </h2>

          {errorMsg && (
            <div className={`p-4 rounded-xl flex items-start gap-3 mb-6 border ${
              errorMsg.includes('successful') 
                ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300' 
                : 'bg-red-950/30 border-red-800 text-red-300'
            }`}>
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="text-sm font-medium">{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleAuth} className="flex flex-col gap-6">
            {isSignUp && (
              <div className="flex flex-col gap-2">
                <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-zinc-500" />
                  </span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="fit_warrior"
                    className="w-full bg-[#11131c] border border-zinc-800 focus:border-violet-500 rounded-xl py-4 pl-12 pr-4 text-white placeholder-zinc-600 focus:outline-none transition-all duration-200 text-sm"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider">
                {isSignUp ? 'Email Address' : 'Username or Email'}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  {isSignUp ? (
                    <Mail className="h-5 w-5 text-zinc-500" />
                  ) : (
                    <User className="h-5 w-5 text-zinc-500" />
                  )}
                </span>
                <input
                  type={isSignUp ? 'email' : 'text'}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isSignUp ? 'you@example.com' : 'you@example.com or username'}
                  className="w-full bg-[#11131c] border border-zinc-800 focus:border-violet-500 rounded-xl py-4 pl-12 pr-4 text-white placeholder-zinc-600 focus:outline-none transition-all duration-200 text-sm"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-zinc-500" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#11131c] border border-zinc-800 focus:border-violet-500 rounded-xl py-4 pl-12 pr-4 text-white placeholder-zinc-600 focus:outline-none transition-all duration-200 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl py-4 shadow-xl shadow-violet-500/25 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 text-base mt-4 cursor-pointer disabled:opacity-50"
            >
              {authLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isSignUp ? (
                'Create Account'
              ) : (
                'Log In'
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm border-t border-zinc-800/80 pt-6">
            <span className="text-zinc-500">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            </span>
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg('');
              }}
              className="text-violet-400 hover:text-violet-300 font-semibold transition-colors focus:outline-none cursor-pointer"
            >
              {isSignUp ? 'Sign In' : 'Create an Account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
