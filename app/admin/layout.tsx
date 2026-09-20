'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { dataStore } from '@/lib/data/store';
import {
  LayoutDashboard,
  Radio,
  FileText,
  Users,
  Briefcase,
  History,
  AlertOctagon,
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
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [stats, setStats] = useState({
    urgent: 0,
    customerCalls: 0,
    workerCalls: 0,
    waiting: 0,
  });

  const refreshStats = () => {
    const all = dataStore.getRequests();
    setStats({
      urgent: all.filter((r) => r.urgency === 'emergency' || r.urgency === 'high').length,
      customerCalls: all.filter((r) => r.status === 'NEW' || r.status === 'CUSTOMER_TO_CALL').length,
      workerCalls: all.filter((r) => r.status === 'CUSTOMER_CONFIRMED' || r.status === 'WORKER_CONTACTING').length,
      waiting: all.filter((r) => r.status === 'WORKER_ACCEPTED').length,
    });
  };

  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 3000);
    return () => clearInterval(interval);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const navItems = [
    { label: 'Live Dispatch', shortLabel: 'Dispatch', href: '/admin/operations', icon: Radio, badge: stats.urgent + stats.customerCalls + stats.workerCalls },
    { label: 'Action Dashboard', shortLabel: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'All Requests', shortLabel: 'Requests', href: '/admin/requests', icon: FileText },
    { label: 'Technicians', shortLabel: 'Workers', href: '/admin/workers', icon: Users },
    { label: 'Services Catalog', shortLabel: 'Services', href: '/admin/services', icon: Briefcase },
    { label: 'Audit Trail', shortLabel: 'Audit', href: '/admin/audit', icon: History },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased text-slate-900">
      {/* ========================================================================= */}
      {/* TOP URGENT ALERT & LIVE DISPATCH BANNER */}
      {/* ========================================================================= */}
      <header className="bg-slate-950 text-white border-b border-slate-800 sticky top-0 z-40">
        <div className="px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 text-xs">
          {/* Brand & Hub */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 focus:outline-none"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            <Link href="/admin/operations" className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-emerald-600 to-teal-400 text-white font-black text-xs flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                V
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold tracking-tight text-white text-xs sm:text-sm">
                  VIKASA <span className="text-emerald-400">ADMIN</span>
                </span>
                <span className="text-[10px] text-slate-400 leading-none hidden sm:inline">
                  Salem Central Dispatch
                </span>
              </div>
            </Link>
          </div>

          {/* Real-time Status Counters */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {stats.urgent > 0 && (
              <Link
                href="/admin/operations"
                className="flex items-center gap-1 px-2 py-1 rounded-md bg-red-950/90 text-red-300 border border-red-700/80 font-bold hover:bg-red-900 transition-colors animate-pulse"
                title="Urgent emergencies needing quick dispatch"
              >
                <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
                <span className="text-[11px] font-mono">{stats.urgent} Urgent</span>
              </Link>
            )}

            <Link
              href="/admin/operations"
              className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-950/80 text-amber-300 border border-amber-700/60 font-semibold hover:bg-amber-900 transition-colors"
              title="Customers waiting for callback"
            >
              <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] font-mono">{stats.customerCalls} <span className="hidden sm:inline">To Call</span></span>
            </Link>

            <Link
              href="/admin/operations"
              className="hidden md:flex items-center gap-1 px-2 py-1 rounded-md bg-blue-950/80 text-blue-300 border border-blue-700/60 font-semibold hover:bg-blue-900 transition-colors"
              title="Technicians to be contacted"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[11px] font-mono">{stats.workerCalls} Workers</span>
            </Link>

            <button
              onClick={refreshStats}
              title="Refresh live data"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors active:rotate-180"
              aria-label="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setShowHelpModal(true)}
              title="How Admin Workflow Works"
              className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors"
            >
              <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Guide</span>
            </button>

            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <span className="hidden sm:inline">Public</span> Site
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Desktop Primary Nav Bar */}
        <nav className="hidden lg:block bg-slate-900 border-t border-slate-800 px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 py-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-sm font-bold'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        isActive ? 'bg-white text-emerald-800' : 'bg-amber-500 text-slate-950'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-mono text-[11px]">Salem Dispatch Console</span>
            </div>
          </div>
        </nav>
      </header>

      {/* ========================================================================= */}
      {/* MOBILE DRAWER / FLYOUT NAVIGATION */}
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
                          ? 'bg-emerald-600 text-white font-bold'
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

              {/* Quick Onboarding Guide Button */}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowHelpModal(true);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white text-xs font-medium"
              >
                <HelpCircle className="w-4 h-4 text-emerald-400" />
                <span>How Vikasa Dispatch Works</span>
              </button>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-2">
              <Link
                href="/"
                target="_blank"
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2"
              >
                <span>View Customer Website</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <div className="text-[10px] text-slate-500 text-center">
                Vikasa Service Admin v2.0 • Mobile Ready
              </div>
            </div>
          </div>

          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* ========================================================================= */}
      {/* HOW DISPATCH WORKS MODAL / GUIDE */}
      {/* ========================================================================= */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-lg w-full shadow-2xl border border-slate-200 text-slate-900 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">How Vikasa Dispatch Works</h3>
                  <p className="text-[11px] text-slate-500">4 Simple Steps from Lead to Completion</p>
                </div>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-amber-950">Customer Submits Request</h4>
                  <p className="text-amber-900/80 mt-0.5">
                    Lead shows up in the <strong>Request Queue</strong>. Check their problem description, address, and preferred time slot.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 flex gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-blue-950">Call Customer & Confirm Requirement</h4>
                  <p className="text-blue-900/80 mt-0.5">
                    Tap <strong>CALL</strong> or <strong>WHATSAPP</strong> to speak with the customer. Clarify the repair details and click <strong>&quot;Confirm Requirement&quot;</strong>.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 flex gap-3">
                <div className="w-6 h-6 rounded-full bg-purple-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-purple-950">Call Nearest Technician & Assign</h4>
                  <p className="text-purple-900/80 mt-0.5">
                    The radar automatically sorts verified workers by distance (km). Call technician #1. If they accept, tap <strong>&quot;ACCEPTED&quot;</strong> to assign the job!
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                  4
                </div>
                <div>
                  <h4 className="font-bold text-emerald-950">Service Delivered & Completed</h4>
                  <p className="text-emerald-900/80 mt-0.5">
                    Technician visits the customer. Once work is finished, tap <strong>&quot;Mark Job Completed&quot;</strong> to close the ticket.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-colors"
            >
              Got it, let&apos;s start!
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN CONTENT AREA */}
      {/* ========================================================================= */}
      <main className="flex-1 flex flex-col pb-16 lg:pb-0">{children}</main>

      {/* ========================================================================= */}
      {/* MOBILE BOTTOM NAVIGATION DOCK (VISIBLE ON SMALL SCREENS) */}
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
                  <span className="absolute top-0.5 right-2 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* 5th tab: Menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center py-1 px-1 rounded-xl text-[10px] font-semibold text-slate-500 hover:text-slate-900"
          >
            <Menu className="w-4 h-4 mb-0.5 text-slate-500" />
            <span>More</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
