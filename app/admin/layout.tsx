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
  LogOut,
  ExternalLink,
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
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

  const navItems = [
    { label: 'Operations Dispatch', href: '/admin/operations', icon: Radio },
    { label: 'Action Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'All Requests', href: '/admin/requests', icon: FileText },
    { label: 'Technicians', href: '/admin/workers', icon: Users },
    { label: 'Service Taxonomy', href: '/admin/services', icon: Briefcase },
    { label: 'Audit Trail', href: '/admin/audit', icon: History },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Top Operational Urgent Alert Ribbon */}
      <div className="bg-slate-900 text-white px-4 py-2 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <Link href="/admin/operations" className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
              V
            </div>
            <span className="font-bold tracking-tight text-white">VIKASA DISPATCH SYSTEM</span>
          </Link>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400 font-medium">Operator Cockpit</span>
        </div>

        {/* Live Action Metric Pills */}
        <div className="flex items-center gap-2">
          {stats.urgent > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-950/80 text-red-300 border border-red-800/80 font-bold">
              <AlertOctagon className="w-3.5 h-3.5 text-red-400 animate-pulse" />
              <span>{stats.urgent} Urgent</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-950/80 text-amber-300 border border-amber-800/80 font-bold">
            <PhoneCall className="w-3.5 h-3.5 text-amber-400" />
            <span>{stats.customerCalls} Customer Calls</span>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-950/80 text-blue-300 border border-blue-800/80 font-bold">
            <UserCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>{stats.workerCalls} Worker Calls</span>
          </div>

          <button
            onClick={refreshStats}
            title="Refresh active state"
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <Link
            href="/"
            target="_blank"
            className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 transition-colors"
          >
            <span>Public Site</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Main Admin Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 px-4">
        <div className="flex items-center justify-between overflow-x-auto py-1">
          <div className="flex items-center gap-1 min-w-max">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 border-b-2 border-emerald-600 font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Operator: Admin (Salem Hub)</span>
          </div>
        </div>
      </nav>

      {/* Content Area */}
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
}
