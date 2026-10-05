'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { dataStore } from '@/lib/data/store';
import {
  LayoutDashboard,
  FileText,
  Users,
  Briefcase,
  History,
  PhoneCall,
  UserCheck,
  RefreshCw,
  ExternalLink,
  Menu,
  X,
  HelpCircle,
  Wrench,
  CheckCircle2,
  ChevronRight,
  ShieldCheck,
  LogOut,
  Radio,
  BookOpen,
  Sparkles,
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [adminUser, setAdminUser] = useState<string>('Admin');

  const [stats, setStats] = useState({
    newLeads: 0,
    inProgress: 0,
    completed: 0,
    totalWorkers: 0,
  });

  const isLoginPage = pathname === '/admin/login';

  // Check authentication
  useEffect(() => {
    if (isLoginPage) {
      setIsAuthenticated(true);
      return;
    }

    try {
      const auth = localStorage.getItem('vikasa_admin_auth');
      if (!auth) {
        setIsAuthenticated(false);
        router.replace('/admin/login');
      } else {
        const parsed = JSON.parse(auth);
        setAdminUser(parsed.name || parsed.user || 'Admin');
        setIsAuthenticated(true);
      }
    } catch {
      setIsAuthenticated(false);
      router.replace('/admin/login');
    }
  }, [pathname, isLoginPage, router]);

  const refreshStats = () => {
    const all = dataStore.getRequests();
    const workers = dataStore.getWorkers();
    setStats({
      newLeads: all.filter((r) => r.status === 'NEW' || r.status === 'CUSTOMER_TO_CALL').length,
      inProgress: all.filter(
        (r) =>
          r.status === 'CUSTOMER_CONFIRMED' ||
          r.status === 'MATCHING' ||
          r.status === 'WORKER_CONTACTING' ||
          r.status === 'ASSIGNED' ||
          r.status === 'IN_PROGRESS'
      ).length,
      completed: all.filter((r) => r.status === 'COMPLETED').length,
      totalWorkers: workers.length,
    });
  };

  useEffect(() => {
    if (!isLoginPage) {
      refreshStats();
      const interval = setInterval(refreshStats, 4000);
      return () => clearInterval(interval);
    }
  }, [isLoginPage]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleSignOut = () => {
    try {
      localStorage.removeItem('vikasa_admin_auth');
      document.cookie = 'vikasa_admin_token=; path=/; max-age=0';
    } catch {
      // ignore
    }
    router.replace('/admin/login');
  };

  // If on login page, render children directly without admin chrome
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white font-black text-lg flex items-center justify-center animate-pulse">
          V
        </div>
        <span className="text-xs font-mono">Securing admin session...</span>
      </div>
    );
  }

  if (isAuthenticated === false) {
    return null;
  }

  // Simplified, intuitive categories (No rocket-science dispatch terms)
  const navItems = [
    { label: 'Overview', shortLabel: 'Overview', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Bookings & Requests', shortLabel: 'Bookings', href: '/admin/requests', icon: FileText, badge: stats.newLeads },
    { label: 'Contacts Directory', shortLabel: 'Contacts', href: '/admin/contacts', icon: PhoneCall },
    { label: 'Service Team', shortLabel: 'Team', href: '/admin/workers', icon: Users },
    { label: 'Services Catalog', shortLabel: 'Services', href: '/admin/services', icon: Briefcase },
    { label: 'Admin User Guide', shortLabel: 'Guide', href: '/admin/guide', icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased text-slate-900">
      {/* ========================================================================= */}
      {/* TOP LUXURY ADMIN BAR */}
      {/* ========================================================================= */}
      <header className="bg-slate-950 text-white border-b border-slate-800 sticky top-0 z-40">
        <div className="px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3 text-xs">
          {/* Brand & Mobile Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            <Link href="/admin/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl overflow-hidden shadow-md ring-1 ring-emerald-500/30 group-hover:scale-105 transition-transform shrink-0">
                <Image
                  src="/logo/vikasa_interior_logo.png"
                  alt="VIKASA Logo"
                  width={32}
                  height={32}
                  className="object-cover w-full h-full"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold tracking-tight text-white text-xs sm:text-sm">
                  VIKASA <span className="text-emerald-400 font-black">ADMIN</span>
                </span>
                <span className="text-[10px] text-slate-400 leading-none hidden sm:inline">
                  Client &amp; Service Portal
                </span>
              </div>
            </Link>
          </div>

          {/* Quick Real-Time Status Counters */}
          <div className="flex items-center gap-2">
            {stats.newLeads > 0 && (
              <Link
                href="/admin/requests"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/80 text-amber-300 border border-amber-700/60 font-bold hover:bg-amber-900 transition-colors animate-pulse"
                title="New customer inquiries waiting for confirmation call"
              >
                <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] font-mono">{stats.newLeads} New Inquiries</span>
              </Link>
            )}

            <Link
              href="/admin/contacts"
              className="hidden md:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/90 text-slate-300 border border-slate-700/60 font-semibold hover:bg-slate-700 transition-colors"
              title="Open Client & Technician Contacts"
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px]">Contacts</span>
            </Link>

            <Link
              href="/admin/guide"
              className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/70 text-emerald-300 border border-emerald-700/50 text-[11px] font-medium hover:bg-emerald-900/80 transition-colors"
              title="Admin User Guide"
            >
              <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>How To Use</span>
            </Link>

            {/* Refresh Data */}
            <button
              onClick={refreshStats}
              title="Refresh live data"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors active:rotate-180"
              aria-label="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* Sign Out Button */}
            <button
              onClick={handleSignOut}
              title="Sign Out of Admin Portal"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-950/50 hover:bg-red-900/80 text-red-300 border border-red-800/40 text-[11px] font-semibold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Desktop Primary Nav Bar */}
        <nav className="hidden lg:block bg-slate-900 border-t border-slate-800 px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 py-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-md font-bold'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span
                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                          isActive ? 'bg-white text-emerald-900' : 'bg-amber-500 text-slate-950'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400 py-2">
              <Link
                href="/admin/operations"
                className="text-[11px] text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1"
                title="Advanced Geo Dispatch Radar"
              >
                <Radio className="w-3 h-3 text-emerald-500" />
                <span>Live Radar</span>
              </Link>
              <span className="text-slate-700">•</span>
              <span className="text-[11px] text-slate-400 font-medium">Logged in as {adminUser}</span>
            </div>
          </div>
        </nav>
      </header>

      {/* ========================================================================= */}
      {/* MOBILE FLYOUT NAVIGATION DRAWER */}
      {/* ========================================================================= */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex">
          <div className="w-72 bg-slate-900 h-full text-white p-4 flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-200">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                    V
                  </div>
                  <span className="font-extrabold text-sm text-white">Vikasa Admin Menu</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-emerald-600 text-white font-bold shadow-xs'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>

              <div className="pt-2 border-t border-slate-800">
                <Link
                  href="/admin/operations"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <Radio className="w-4 h-4 text-emerald-500" />
                  <span>Advanced Geo Dispatch Radar</span>
                </Link>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-2">
              <button
                onClick={handleSignOut}
                className="w-full py-2 px-3 rounded-xl bg-red-950/60 hover:bg-red-900/80 text-red-300 border border-red-800/40 text-xs font-bold flex items-center justify-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
              <div className="text-[10px] text-slate-500 text-center">
                Vikasa Service Admin • Authenticated
              </div>
            </div>
          </div>

          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN CONTENT AREA */}
      {/* ========================================================================= */}
      <main className="flex-1 flex flex-col pb-16 lg:pb-0">{children}</main>

      {/* ========================================================================= */}
      {/* MOBILE BOTTOM NAVIGATION DOCK (VISIBLE ON MOBILE SCREENS) */}
      {/* ========================================================================= */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 shadow-lg">
        <div className="grid grid-cols-5 gap-1">
          {navItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[10px] font-semibold transition-all relative ${
                  isActive
                    ? 'text-emerald-700 font-bold bg-emerald-50'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-emerald-600' : 'text-slate-500'}`} />
                <span className="truncate">{item.shortLabel}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute top-0.5 right-2 w-4 h-4 bg-amber-500 text-slate-950 text-[9px] font-black rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* 5th tab: Guide */}
          <Link
            href="/admin/guide"
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[10px] font-semibold transition-all ${
              pathname === '/admin/guide'
                ? 'text-emerald-700 font-bold bg-emerald-50'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-4 h-4 mb-0.5 text-slate-500" />
            <span>Guide</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
