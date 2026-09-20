'use client';

import React, { useState, useEffect } from 'react';
import { dataStore } from '@/lib/data/store';
import { AuditLog } from '@/types';
import { History, Shield, Clock, Search, Terminal, Activity, User } from 'lucide-react';

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLogs(dataStore.getAuditLogs());
  }, []);

  const filtered = logs.filter(
    (l) =>
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      l.entity_type.toLowerCase().includes(search.toLowerCase()) ||
      l.entity_id.toLowerCase().includes(search.toLowerCase()) ||
      (l.user_name && l.user_name.toLowerCase().includes(search.toLowerCase()))
  );

  const formatAction = (action: string) => {
    switch (action) {
      case 'create_request':
        return { label: 'New Lead Created', color: 'bg-blue-100 text-blue-800' };
      case 'status_change':
        return { label: 'Status Updated', color: 'bg-purple-100 text-purple-800' };
      case 'customer_confirmed':
        return { label: 'Customer Confirmed', color: 'bg-teal-100 text-teal-800' };
      case 'worker_contact_attempt':
        return { label: 'Worker Called', color: 'bg-amber-100 text-amber-900' };
      case 'assign_worker':
        return { label: 'Worker Assigned', color: 'bg-emerald-100 text-emerald-800' };
      case 'complete_job':
        return { label: 'Job Completed', color: 'bg-emerald-600 text-white' };
      default:
        return { label: action.replace(/_/g, ' '), color: 'bg-slate-100 text-slate-800' };
    }
  };

  return (
    <div className="flex-1 bg-slate-100 p-3 sm:p-6 space-y-5 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-600" />
            Operations Audit Trail
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Chronological activity record of operator phone dials, customer confirmations, and technician dispatches.
          </p>
        </div>

        <div className="relative flex-1 sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search action, technician, user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
          />
        </div>
      </div>

      {/* MOBILE CARD STREAM (VISIBLE ON PHONES) */}
      <div className="md:hidden space-y-2.5">
        {filtered.map((log) => {
          const actionBadge = formatAction(log.action);
          return (
            <div
              key={log.id}
              className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${actionBadge.color}`}>
                  {actionBadge.label}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-700">
                <span className="font-bold text-slate-900 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" />
                  {log.user_name || 'System / Operator'}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {log.entity_type} #{log.entity_id}
                </span>
              </div>

              {log.metadata && (
                <div className="text-[11px] bg-slate-50 p-2 rounded-xl border border-slate-100 text-slate-600 font-mono break-all">
                  {Object.entries(log.metadata)
                    .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
                    .join(' • ')}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">Operator</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Entity</th>
                <th className="py-3.5 px-4">Entity ID</th>
                <th className="py-3.5 px-4">Details &amp; Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filtered.map((log) => {
                const actionBadge = formatAction(log.action);
                return (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                      {new Date(log.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {log.user_name || 'System Dispatcher'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${actionBadge.color}`}>
                        {actionBadge.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-semibold">{log.entity_type}</td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">#{log.entity_id}</td>
                    <td className="py-3.5 px-4 max-w-md truncate text-[11px] text-slate-600 font-mono">
                      {log.metadata
                        ? Object.entries(log.metadata)
                            .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`)
                            .join(' • ')
                        : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
