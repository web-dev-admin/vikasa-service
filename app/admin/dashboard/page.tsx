'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { dataStore } from '@/lib/data/store';
import { ServiceRequest } from '@/types';
import {
  Flame,
  PhoneCall,
  UserCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Radio,
  Sparkles,
  MapPin,
  ChevronRight,
  Activity,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);

  useEffect(() => {
    setRequests(dataStore.getRequests());
  }, []);

  const urgentReqs = requests.filter((r) => r.urgency === 'emergency' || r.urgency === 'high');
  const customerCallsReqs = requests.filter((r) => r.status === 'NEW' || r.status === 'CUSTOMER_TO_CALL');
  const workerCallsReqs = requests.filter(
    (r) => r.status === 'CUSTOMER_CONFIRMED' || r.status === 'MATCHING' || r.status === 'WORKER_CONTACTING'
  );
  const waitingAssignmentReqs = requests.filter((r) => r.status === 'WORKER_ACCEPTED');
  const assignedReqs = requests.filter((r) => r.status === 'ASSIGNED');
  const inProgressReqs = requests.filter((r) => r.status === 'IN_PROGRESS');
  const completedReqs = requests.filter((r) => r.status === 'COMPLETED');
  const noWorkerReqs = requests.filter((r) => r.status === 'NO_WORKER_AVAILABLE');

  return (
    <div className="flex-1 bg-slate-100 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full mb-1">
            <Radio className="w-3.5 h-3.5 animate-pulse" /> Live Dispatch Cockpit
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Operational Action Center
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time status overview of customer calls, technician matching, and active job dispatches.
          </p>
        </div>

        <Link
          href="/admin/operations"
          className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all shrink-0"
        >
          <Radio className="w-4 h-4" />
          <span>Go to 3-Panel Dispatch Board</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* ========================================================================= */}
      {/* ACTION REQUIRED: WHAT DO I NEED TO DO RIGHT NOW? */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 p-5 rounded-3xl border border-amber-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-amber-950 uppercase tracking-wide flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-600 animate-pulse" />
            Action Required Right Now
          </h2>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
            {urgentReqs.length + customerCallsReqs.length + workerCallsReqs.length} Critical Items
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Action 1: Urgent */}
          <Link
            href="/admin/operations"
            className="p-4 rounded-2xl bg-white border border-amber-200/80 hover:border-red-400 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-red-600">{urgentReqs.length}</span>
                <Flame className="w-5 h-5 text-red-500 group-hover:animate-bounce" />
              </div>
              <h3 className="text-xs font-bold text-slate-800 mt-1">Urgent Requests</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">High priority emergency leads needing fast response.</p>
            </div>
            <span className="mt-3 text-[11px] font-bold text-red-600 flex items-center gap-1">
              Process Urgents <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          {/* Action 2: Customer Calls */}
          <Link
            href="/admin/operations"
            className="p-4 rounded-2xl bg-white border border-amber-200/80 hover:border-amber-400 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-amber-700">{customerCallsReqs.length}</span>
                <PhoneCall className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-xs font-bold text-slate-800 mt-1">Customer Calls Required</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Call customer to confirm requirement before matching.</p>
            </div>
            <span className="mt-3 text-[11px] font-bold text-amber-700 flex items-center gap-1">
              Dial Customers <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          {/* Action 3: Worker Calls */}
          <Link
            href="/admin/operations"
            className="p-4 rounded-2xl bg-white border border-amber-200/80 hover:border-blue-400 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-blue-700">{workerCallsReqs.length}</span>
                <UserCheck className="w-5 h-5 text-blue-500 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-xs font-bold text-slate-800 mt-1">Technicians To Contact</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Confirmed requests ready for sequential worker dial.</p>
            </div>
            <span className="mt-3 text-[11px] font-bold text-blue-700 flex items-center gap-1">
              Start Matching <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          {/* Action 4: Waiting Assignment */}
          <Link
            href="/admin/operations"
            className="p-4 rounded-2xl bg-white border border-amber-200/80 hover:border-emerald-400 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-emerald-700">{waitingAssignmentReqs.length}</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-500 group-hover:scale-110 transition-transform" />
              </div>
              <h3 className="text-xs font-bold text-slate-800 mt-1">Pending Confirmation</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Worker accepted call, waiting for operator confirmation.</p>
            </div>
            <span className="mt-3 text-[11px] font-bold text-emerald-700 flex items-center gap-1">
              Confirm Assign <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 8 TOP OPERATIONAL METRIC CARDS */}
      {/* ========================================================================= */}
      <div>
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Dispatch Pipeline Metrics
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {[
            { label: 'Urgent', count: urgentReqs.length, color: 'text-red-600 bg-red-50 border-red-200' },
            { label: 'To Call', count: customerCallsReqs.length, color: 'text-amber-700 bg-amber-50 border-amber-200' },
            { label: 'Matching', count: workerCallsReqs.length, color: 'text-purple-700 bg-purple-50 border-purple-200' },
            { label: 'Accepted', count: waitingAssignmentReqs.length, color: 'text-teal-700 bg-teal-50 border-teal-200' },
            { label: 'Assigned', count: assignedReqs.length, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
            { label: 'In Progress', count: inProgressReqs.length, color: 'text-blue-700 bg-blue-50 border-blue-200' },
            { label: 'Completed', count: completedReqs.length, color: 'text-slate-700 bg-slate-100 border-slate-200' },
            { label: 'No Worker', count: noWorkerReqs.length, color: 'text-rose-700 bg-rose-50 border-rose-200' },
          ].map((m, idx) => (
            <div key={idx} className={`p-3 rounded-2xl border text-center ${m.color}`}>
              <div className="text-xl font-black">{m.count}</div>
              <div className="text-[10px] font-bold uppercase tracking-tight mt-0.5">{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RECENT OPERATIONAL REQUESTS TABLE */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-900">Recent Service Requests</h2>
            <p className="text-xs text-slate-500">Live feed of incoming customer service requirements.</p>
          </div>
          <Link
            href="/admin/operations"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            Open in Cockpit <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-4">Req #</th>
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Urgency</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {requests.slice(0, 8).map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    #{req.request_number}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{req.service_name}</div>
                    <div className="text-[10px] text-slate-400">{req.category_name}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-800">{req.customer_name}</div>
                    <div className="text-[10px] font-mono text-emerald-800 font-bold">{req.customer_phone}</div>
                  </td>
                  <td className="py-3 px-4 max-w-xs truncate text-slate-600">
                    {req.formatted_address}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        req.urgency === 'emergency'
                          ? 'bg-red-100 text-red-800'
                          : req.urgency === 'high'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {req.urgency.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                      {req.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href="/admin/operations"
                      className="px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 font-bold text-[11px]"
                    >
                      Dispatch
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
