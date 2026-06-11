'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  Trophy, 
  ShieldAlert, 
  FileText, 
  Settings, 
  LogOut, 
  Loader2,
  Lock,
  ChevronRight,
  Shield,
  MessageSquare
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [adminUsername, setAdminUsername] = useState('admin');

  // Check admin session
  useEffect(() => {
    if (pathname === '/admin/login') {
      setCheckingAuth(false);
      return;
    }

    const checkSession = async () => {
      try {
        const res = await fetch('/api/admin/users');
        if (res.status === 401) {
          router.push('/admin/login');
        } else {
          // Success
          setCheckingAuth(false);
        }
      } catch (err) {
        router.push('/admin/login');
      }
    };

    checkSession();
  }, [pathname, router]);

  const handleLogout = () => {
    document.cookie = 'lockin_admin_session=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    router.push('/admin/login');
  };

  if (checkingAuth && pathname !== '/admin/login') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#07090e]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
        <p className="text-slate-500 text-xs tracking-wider uppercase">Verifying Command Credentials...</p>
      </div>
    );
  }

  // Render plain page if login screen
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const sidebarLinks = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Leaderboard', path: '/admin/leaderboard', icon: Trophy },
    { name: 'Bans & Freezes', path: '/admin/bans', icon: ShieldAlert },
    { name: 'Reports & Appeals', path: '/admin/reports', icon: MessageSquare },
    { name: 'Admin Logs', path: '/admin/logs', icon: FileText },
    { name: 'System Settings', path: '/admin/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen w-screen bg-[#07090e] text-slate-100 overflow-hidden font-sans">
      
      {/* ADMIN SIDEBAR */}
      <aside className="w-64 h-full bg-[#0b0e14] border-r border-slate-900 flex flex-col justify-between shrink-0 select-none">
        
        {/* Top Branding */}
        <div className="p-5 border-b border-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/10 border border-blue-400/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-sm font-extrabold tracking-tight text-white block leading-none">
                LOCK-IN
              </span>
              <span className="text-blue-400 text-[9px] uppercase font-bold tracking-widest block mt-1">
                Admin Control
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <span className="px-3 text-[9px] font-bold text-slate-600 uppercase tracking-widest block mb-2">
            Navigation Menu
          </span>
          <nav className="space-y-1">
            {sidebarLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 border ${
                    isActive
                      ? 'bg-blue-600/10 text-blue-400 border-blue-900/40 shadow-sm shadow-blue-500/5'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/50 border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-500'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Admin Account HUD */}
        <div className="p-3 border-t border-slate-900/60 bg-[#080b10] flex flex-col gap-2">
          <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-[#0e121a] border border-slate-900">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-700/30 to-cyan-700/30 border border-blue-900/30 flex items-center justify-center font-bold text-xs text-blue-300 uppercase shrink-0">
              AD
            </div>
            <div className="min-w-0 flex-1 text-left">
              <span className="text-xs font-bold text-slate-200 block truncate leading-none">
                @{adminUsername}
              </span>
              <span className="text-[9px] text-blue-500 font-semibold uppercase block mt-1 tracking-wider leading-none">
                Super Admin
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-3 py-2 text-xs font-bold text-red-400 hover:text-red-300 bg-red-950/10 hover:bg-red-950/20 border border-red-950/30 rounded-xl transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* TOP STATUS HEADER */}
        <header className="h-14 border-b border-slate-900/60 bg-[#080b10] px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Live Mod Status: Active
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>Server: <strong className="text-slate-300">Production-V2</strong></span>
            <span className="h-4 w-[1px] bg-slate-900" />
            <span>Time: <strong className="text-slate-300">GMT+5</strong></span>
          </div>
        </header>

        {/* ROUTE VIEW AREA */}
        <main className="flex-1 overflow-hidden relative bg-[#07090e]">
          {children}
        </main>
      </div>

    </div>
  );
}
