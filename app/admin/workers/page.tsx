'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { dataStore } from '@/lib/data/store';
import {
  STANDARDIZED_SERVICES,
  TAMIL_NADU_DISTRICTS,
  VIKASA_CONFIG,
} from '@/lib/constants';
import { Worker } from '@/types';
import {
  Users,
  Search,
  CheckCircle2,
  PhoneCall,
  MessageCircle,
  MapPin,
  Briefcase,
  ShieldCheck,
  UserCheck,
  Filter,
} from 'lucide-react';
import { getTelUrl, getWhatsAppUrl } from '@/lib/utils/phone';

export default function AdminWorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [serviceFilter, setServiceFilter] = useState('ALL');
  const [availabilityFilter, setAvailabilityFilter] = useState('ALL');

  const refreshWorkers = () => {
    setWorkers(dataStore.getWorkers());
  };

  useEffect(() => {
    refreshWorkers();
  }, []);

  const handleToggleAvailability = (worker: Worker) => {
    const nextAvailability =
      worker.availability === 'available'
        ? 'busy'
        : worker.availability === 'busy'
        ? 'offline'
        : 'available';

    dataStore.updateWorkerAvailability(worker.id, nextAvailability);
    refreshWorkers();
  };

  const filtered = workers.filter((w) => {
    const q = search.toLowerCase();
    const matchSearch =
      w.full_name.toLowerCase().includes(q) ||
      w.phone.includes(q) ||
      (w.district && w.district.toLowerCase().includes(q)) ||
      w.skills.some((s) => s.toLowerCase().includes(q));

    if (!matchSearch) return false;
    if (districtFilter !== 'ALL' && w.district?.toLowerCase() !== districtFilter.toLowerCase()) return false;
    if (availabilityFilter !== 'ALL' && w.availability !== availabilityFilter) return false;
    if (serviceFilter !== 'ALL') {
      const sLower = serviceFilter.toLowerCase();
      const has =
        w.service_ids.some((id) => id.toLowerCase().includes(sLower)) ||
        w.skills.some((s) => s.toLowerCase().includes(sLower));
      if (!has) return false;
    }
    return true;
  });

  return (
    <div className="flex-1 bg-slate-100 p-3 sm:p-6 space-y-4 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
            Service Personnel
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-emerald-600" />
            <span>Technicians Directory</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified local trade specialists, contact numbers, and real-time availability.
          </p>
        </div>

        <Link
          href="/worker-register"
          className="px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 self-start sm:self-auto"
        >
          + Add New Technician
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-3.5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search technician by name, phone, trade, district..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              District
            </label>
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
            >
              <option value="ALL">All Districts</option>
              {TAMIL_NADU_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Service
            </label>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
            >
              <option value="ALL">All Services</option>
              {STANDARDIZED_SERVICES.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Availability
            </label>
            <select
              value={availabilityFilter}
              onChange={(e) => setAvailabilityFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
            >
              <option value="ALL">All States</option>
              <option value="available">Available</option>
              <option value="busy">Busy</option>
              <option value="offline">Unavailable</option>
            </select>
          </div>
        </div>
      </div>

      {/* Technicians List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No technicians found</h3>
            <p className="text-xs text-slate-400">Try changing your search or filter options.</p>
          </div>
        ) : (
          filtered.map((tech) => (
            <div
              key={tech.id}
              className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900">{tech.full_name}</h3>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {tech.skills[0] || 'Technician'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                    <span>{tech.base_location_name}</span>
                    <span>•</span>
                    <strong className="text-slate-800">{tech.district || 'Salem'}</strong>
                    <span>•</span>
                    <span>{tech.experience_years}+ Yrs Exp</span>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleAvailability(tech)}
                  className={`text-[10px] font-bold px-3 py-1 rounded-full border transition-all cursor-pointer ${
                    tech.availability === 'available'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : tech.availability === 'busy'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-slate-100 text-slate-600 border-slate-300'
                  }`}
                  title="Click to toggle availability"
                >
                  {tech.availability.toUpperCase()} (Click to change)
                </button>
              </div>

              {/* Skills Tags */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tech.skills.map((skill) => (
                  <span
                    key={skill}
                    className="text-[10px] font-medium text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                <a
                  href={getTelUrl(tech.phone)}
                  className="py-2.5 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors text-center"
                >
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Call ({tech.phone})</span>
                </a>

                <a
                  href={getWhatsAppUrl(tech.phone, `Vanakkam ${tech.full_name}, VIKASA admin here.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center justify-center gap-1.5 transition-colors text-center"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
