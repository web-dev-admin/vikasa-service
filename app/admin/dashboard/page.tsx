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
  FileText,
  Users,
  Layers,
  Phone,
  MessageCircle,
} from 'lucide-react';
import { getTelUrl, getWhatsAppUrl, generateCustomerWhatsAppMessage } from '@/lib/utils/phone';

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
  const assignedReqs = requests.filter((r) => r.status === 'ASSIGNED' || r.status === 'IN_PROGRESS');
  const completedReqs = requests.filter((r) => r.status === 'COMPLETED');

  return (
    <div className="flex-1 bg-slate-100 p-3 sm:p-6 space-y-5 max-w-7xl mx-auto w-full">
      {/* Top Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full mb-1.5">
            <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" /> Live Dispatch Cockpit
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Operational Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track customer bookings, technician assignments, and service delivery across Salem.
          </p>
        </div>

        <Link
          href="/admin/operations"
          className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all shrink-0 active:scale-95"
        >
          <Radio className="w-4 h-4" />
          <span>Open Live Dispatch Radar</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* ========================================================================= */}
      {/* ACTION REQUIRED: WHAT DO I NEED TO DO RIGHT NOW? */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50/60 p-4 sm:p-5 rounded-3xl border border-amber-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs sm:text-sm font-black text-amber-950 uppercase tracking-wide flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-600 animate-pulse" />
            Action Required Right Now
          </h2>
          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-950">
            {urgentReqs.length + customerCallsReqs.length + workerCallsReqs.length} Pending Actions
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
                <div className="p-2 rounded-xl bg-red-50 text-red-500">
                  <Flame className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <h3 className="text-xs font-bold text-slate-800 mt-2">Urgent Requests</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">High priority emergency jobs needing fast dispatch.</p>
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
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <PhoneCall className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <h3 className="text-xs font-bold text-slate-800 mt-2">Call Customer First</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Confirm requirement and address before matching.</p>
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
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <UserCheck className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <h3 className="text-xs font-bold text-slate-800 mt-2">Technicians To Contact</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Confirmed requests ready for technician assignment.</p>
            </div>
            <span className="mt-3 text-[11px] font-bold text-blue-700 flex items-center gap-1">
              Start Matching <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </Link>

          {/* Action 4: Active / Completed */}
          <Link
            href="/admin/requests"
            className="p-4 rounded-2xl bg-white border border-amber-200/80 hover:border-emerald-400 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-emerald-700">{assignedReqs.length}</span>
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </div>
              </div>
              <h3 className="text-xs font-bold text-slate-800 mt-2">Active Jobs On-Site</h3>
              <p className="text-[11px] text-slate-500 mt-0.5">Technicians currently performing service at home.</p>
            </div>
            <span className="mt-3 text-[11px] font-bold text-emerald-700 flex items-center gap-1">
              View All Jobs <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* QUICK STATUS OVERVIEW GRID */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase">Total Leads</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{requests.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">All time records</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase">Jobs Done</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{completedReqs.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Successfully closed</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase">Registered Techs</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{dataStore.getWorkers().length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Plumbers, Electricians, etc.</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-xs font-bold text-slate-500 uppercase">Dispatch Hub</div>
          <div className="text-sm font-black text-slate-900 mt-2 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Salem, TN
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">15 km operational zone</div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RECENT INCOMING LEADS */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
              Recent Incoming Requests
            </h2>
            <p className="text-xs text-slate-500">Click any request to open live dispatch console</p>
          </div>
          <Link
            href="/admin/requests"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            View All ({requests.length}) <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {requests.slice(0, 6).map((req) => (
            <div
              key={req.id}
              className="py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50/80 rounded-xl px-2 transition-colors"
            >
              <div className="flex items-start sm:items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-mono font-bold text-xs shrink-0">
                  #{req.request_number}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900">{req.service_name}</span>
                    {req.urgency === 'emergency' && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-red-100 text-red-700">
                        EMERGENCY
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 flex flex-wrap items-center gap-2 mt-0.5">
                    <span className="font-bold text-slate-700">{req.customer_name}</span>
                    <span>•</span>
                    <span className="font-mono text-emerald-800 font-bold">{req.customer_phone}</span>
                    <span>•</span>
                    <span className="truncate max-w-[150px]">{req.formatted_address.split(',')[0]}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <a
                  href={getTelUrl(req.customer_phone)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                  title="Call Customer"
                >
                  <PhoneCall className="w-4 h-4 text-emerald-600" />
                </a>

                <a
                  href={getWhatsAppUrl(
                    req.customer_phone,
                    generateCustomerWhatsAppMessage(req.customer_name, req.request_number, req.service_name)
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                  title="WhatsApp Customer"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>

                <Link
                  href="/admin/operations"
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-colors"
                >
                  <span>Dispatch</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
