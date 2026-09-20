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
} from 'lucide-react';

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
    return true;
  });

  return (
    <div className="flex-1 bg-slate-100 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            Technician Network Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Admin verification, availability control, and geographic coverage radius for all registered technicians.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search technician..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700"
          >
            <option value="ALL">All Technicians</option>
            <option value="VERIFIED">Verified Only</option>
            <option value="PENDING">Pending Verification</option>
            <option value="AVAILABLE">Currently Available</option>
          </select>
        </div>
      </div>

      {/* Workers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((worker) => {
          const isVerified = worker.verification_status === 'verified';
          const isPending = worker.verification_status === 'pending_verification';

          return (
            <div
              key={worker.id}
              className={`p-5 rounded-2xl border bg-white shadow-xs flex flex-col justify-between transition-all ${
                isPending ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200'
              }`}
            >
              <div className="space-y-3">
                {/* Header info */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-black text-slate-900">{worker.full_name}</h3>
                    <div className="text-xs font-mono font-bold text-emerald-800 mt-0.5">
                      {worker.phone}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        isVerified
                          ? 'bg-emerald-100 text-emerald-800'
                          : isPending
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {worker.verification_status.replace('_', ' ')}
                    </span>

                    <button
                      onClick={() => handleToggleAvailability(worker)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1 cursor-pointer transition-colors ${
                        worker.availability === 'available'
                          ? 'bg-emerald-600 text-white'
                          : worker.availability === 'busy'
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-300 text-slate-700'
                      }`}
                      title="Click to toggle availability"
                    >
                      <Power className="w-2.5 h-2.5" />
                      {worker.availability}
                    </button>
                  </div>
                </div>

                {/* Location & Coverage */}
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{worker.base_location_name}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 pl-5">
                    Service Coverage: <span className="font-bold text-slate-800">{worker.service_radius_km} km</span> radius
                  </div>
                </div>

                {/* Skills & Experience */}
                <div className="space-y-1.5 text-xs">
                  <div className="text-[11px] text-slate-500">
                    Experience: <span className="font-bold text-slate-800">{worker.experience_years} years</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {worker.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <a
                  href={`tel:${worker.phone.replace(/\s/g, '')}`}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold flex items-center gap-1"
                >
                  <Phone className="w-3 h-3 text-emerald-600" />
                  <span>Call</span>
                </a>

                <div className="flex items-center gap-1.5">
                  {isPending ? (
                    <button
                      onClick={() => handleVerify(worker.id)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve</span>
                    </button>
                  ) : isVerified ? (
                    <button
                      onClick={() => handleSuspend(worker.id)}
                      className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold"
                    >
                      Suspend
                    </button>
                  ) : (
                    <button
                      onClick={() => handleVerify(worker.id)}
                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold"
                    >
                      Re-activate
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
