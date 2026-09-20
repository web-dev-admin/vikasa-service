'use client';

import React, { useState, useEffect } from 'react';
import { dataStore } from '@/lib/data/store';
import { Worker, WorkerStatus, WorkerAvailability } from '@/types';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Phone,
  MapPin,
  Briefcase,
  ShieldCheck,
  Power,
  RotateCcw,
  PhoneCall,
  MessageCircle,
  Clock,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { getTelUrl, getWhatsAppUrl } from '@/lib/utils/phone';

export default function AdminWorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const refreshWorkers = () => {
    setWorkers(dataStore.getWorkers());
  };

  useEffect(() => {
    refreshWorkers();
  }, []);

  const handleVerify = (workerId: string) => {
    dataStore.updateWorkerStatus(workerId, {
      verification_status: 'verified',
      availability: 'available',
      verification_notes: 'Verified by operator after credential inspection.',
    });
    refreshWorkers();
  };

  const handleSuspend = (workerId: string) => {
    dataStore.updateWorkerStatus(workerId, {
      verification_status: 'suspended',
      availability: 'offline',
      verification_notes: 'Temporarily suspended by operator.',
    });
    refreshWorkers();
  };

  const handleToggleAvailability = (worker: Worker) => {
    const nextAvailability: WorkerAvailability =
      worker.availability === 'available'
        ? 'busy'
        : worker.availability === 'busy'
        ? 'offline'
        : 'available';

    dataStore.updateWorkerStatus(worker.id, { availability: nextAvailability });
    refreshWorkers();
  };

  const filtered = workers.filter((w) => {
    const matchText =
      w.full_name.toLowerCase().includes(search.toLowerCase()) ||
      w.phone.includes(search) ||
      w.base_location_name.toLowerCase().includes(search.toLowerCase()) ||
      w.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()));

    if (!matchText) return false;
    if (statusFilter === 'VERIFIED') return w.verification_status === 'verified';
    if (statusFilter === 'PENDING') return w.verification_status === 'pending_verification';
    if (statusFilter === 'AVAILABLE') return w.availability === 'available';
    if (statusFilter === 'BUSY') return w.availability === 'busy';
    return true;
  });

  return (
    <div className="flex-1 bg-slate-100 p-3 sm:p-6 space-y-5 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            Technician &amp; Worker Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage technician verification, live availability (Available / Busy / Offline), and skillsets.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search technician name, skill, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by Technician Status"
            className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700"
          >
            <option value="ALL">All Technicians</option>
            <option value="AVAILABLE">🟢 Available Now</option>
            <option value="BUSY">🟡 Busy on Job</option>
            <option value="VERIFIED">Verified Only</option>
            <option value="PENDING">Pending Verification</option>
          </select>
        </div>
      </div>

      {/* Workers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((worker) => {
          const isVerified = worker.verification_status === 'verified';
          const isPending = worker.verification_status === 'pending_verification';
          const isAvailable = worker.availability === 'available';
          const isBusy = worker.availability === 'busy';

          return (
            <div
              key={worker.id}
              className={`p-5 rounded-3xl border bg-white shadow-xs flex flex-col justify-between transition-all ${
                isPending ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200'
              }`}
            >
              <div className="space-y-3">
                {/* Header info */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                      {worker.full_name}
                      {isVerified && <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />}
                    </h3>
                    <div className="text-xs font-mono font-bold text-emerald-800 mt-0.5">
                      {worker.phone}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        isVerified
                          ? 'bg-emerald-100 text-emerald-800'
                          : isPending
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {worker.verification_status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Location & Experience */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Base Area</span>
                    <span className="font-bold text-slate-800 truncate block mt-0.5">{worker.base_location_name}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Experience</span>
                    <span className="font-bold text-slate-800 block mt-0.5">{worker.experience_years} Years</span>
                  </div>
                </div>

                {/* Skills tags */}
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                    Skills &amp; Expertise
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {worker.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[10px] font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Direct Contact Buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <a
                    href={getTelUrl(worker.phone)}
                    className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Call Worker</span>
                  </a>

                  <a
                    href={getWhatsAppUrl(worker.phone, `Hello ${worker.full_name}, this is Vikasa Dispatch Salem.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleToggleAvailability(worker)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                    isAvailable
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                      : isBusy
                      ? 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                  title="Click to toggle Available -> Busy -> Offline"
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isAvailable ? 'bg-emerald-500' : isBusy ? 'bg-amber-500' : 'bg-slate-400'
                    }`}
                  />
                  <span>
                    {isAvailable ? 'Available' : isBusy ? 'Busy On-Site' : 'Offline'}
                  </span>
                </button>

                {isPending ? (
                  <button
                    onClick={() => handleVerify(worker.id)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                  >
                    Verify Technician
                  </button>
                ) : isVerified ? (
                  <button
                    onClick={() => handleSuspend(worker.id)}
                    className="text-[11px] text-slate-400 hover:text-red-600 font-medium transition-colors"
                  >
                    Suspend
                  </button>
                ) : (
                  <button
                    onClick={() => handleVerify(worker.id)}
                    className="text-xs text-emerald-700 font-bold hover:underline"
                  >
                    Re-verify
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
