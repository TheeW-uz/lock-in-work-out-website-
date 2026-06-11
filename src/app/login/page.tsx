'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';
import { Dumbbell, Mail, Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import LockInBackground from '@/components/lock-in-background';

const quotes = [
  "Discipline beats motivation.",
  "Progress compounds.",
  "One day or day one.",
  "Stay locked in."
];

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Quote cycle animation states
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [fadeQuote, setFadeQuote] = useState(true);

  useEffect(() => {
    const quoteInterval = setInterval(() => {
      setFadeQuote(false);
      setTimeout(() => {
        setQuoteIdx((prev) => (prev + 1) % quotes.length);
        setFadeQuote(true);
      }, 600);
    }, 6000);

    return () => clearInterval(quoteInterval);
  }, []);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  if (loading || user) {
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
      
      {/* Premium Canvas Interactive Network Animation */}
      <LockInBackground />

      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[130px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-emerald-600/5 rounded-full blur-[130px] pointer-events-none animate-pulse" />

      {/* Main Container */}
      <div className="w-full max-w-[450px] z-10">
        <div className="text-center mb-10 select-none">
          <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 shadow-xl shadow-violet-500/10 mb-5 border border-violet-400/20">
            <Dumbbell className="w-9 h-9 text-white animate-bounce" style={{ animationDuration: '3s' }} />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-3" style={{ fontFamily: 'var(--font-display)' }}>
            LOCK-IN
          </h1>
          <p className="text-zinc-500 text-xs md:text-sm font-semibold uppercase tracking-wider">
            AI Workout Companion & Registry
          </p>
        </div>

        <div className="glass-panel p-10 md:p-12 rounded-3xl shadow-2xl relative overflow-hidden bg-zinc-950/60 border border-zinc-900/60 backdrop-blur-md">
          {/* Subtle top border reflection */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-800/40 to-transparent" />

          <h2 className="text-xl font-extrabold text-white mb-8 text-center tracking-wide uppercase text-zinc-300">
            {isSignUp ? 'Create Athlete Account' : 'Sign In to Platform'}
          </h2>

          {errorMsg && (
            <div className={`p-4 rounded-xl flex items-start gap-3 mb-6 border text-xs font-semibold ${
              errorMsg.includes('successful') 
                ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400' 
                : 'bg-red-950/20 border-red-900/40 text-red-400'
            }`}>
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{errorMsg}</p>
            </div>
          )}

          <form onSubmit={handleAuth} className="flex flex-col gap-6">
            {isSignUp && (
              <div className="flex flex-col gap-2">
                <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                  Username
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-zinc-650" />
                  </span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="fit_warrior"
                    className="w-full bg-[#0d0e15]/75 border border-zinc-900 focus:border-violet-600 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-zinc-700 focus:outline-none transition-all text-xs"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                {isSignUp ? 'Email Address' : 'Username or Email'}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  {isSignUp ? (
                    <Mail className="h-4 w-4 text-zinc-655" />
                  ) : (
                    <User className="h-4 w-4 text-zinc-655" />
                  )}
                </span>
                <input
                  type={isSignUp ? 'email' : 'text'}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={isSignUp ? 'you@example.com' : 'you@example.com or username'}
                  className="w-full bg-[#0d0e15]/75 border border-zinc-900 focus:border-violet-600 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-zinc-700 focus:outline-none transition-all text-xs"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="block text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-zinc-655" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0d0e15]/75 border border-zinc-900 focus:border-violet-600 rounded-xl py-3.5 pl-12 pr-4 text-white placeholder-zinc-700 focus:outline-none transition-all text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-650 hover:from-violet-550 hover:to-indigo-550 text-white font-bold rounded-xl py-3.5 shadow-xl shadow-violet-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-xs mt-4 cursor-pointer disabled:opacity-50"
            >
              {authLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isSignUp ? (
                'Create Athlete Account'
              ) : (
                'Log In'
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-xs border-t border-zinc-900/60 pt-6">
            <span className="text-zinc-550 font-medium">
              {isSignUp ? 'Already registered?' : "New to the platform?"}{' '}
            </span>
            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrorMsg('');
              }}
              className="text-violet-400 hover:text-violet-300 font-bold transition-colors focus:outline-none cursor-pointer"
            >
              {isSignUp ? 'Sign In' : 'Create an Account'}
            </button>
          </div>
        </div>

        {/* Elegant fading quote HUD cycle */}
        <div className={`mt-8 text-center select-none transition-opacity duration-1000 ${fadeQuote ? 'opacity-40' : 'opacity-0'}`}>
          <p className="text-[10px] text-white uppercase tracking-[0.25em] font-bold italic">
            "{quotes[quoteIdx]}"
          </p>
        </div>

      </div>
    </div>
  );
}
