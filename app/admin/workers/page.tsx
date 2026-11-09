'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { dataStore } from '@/lib/data/store';
import { Worker, WorkerStatus } from '@/types';
import { INITIAL_CATEGORIES } from '@/lib/taxonomy/catalog';
import { TAMIL_NADU_DISTRICTS } from '@/lib/constants';
import { sanitizeIndianMobile10 } from '@/lib/utils/phone';
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Phone,
  MapPin,
  Briefcase,
  AlertCircle,
  Filter,
} from 'lucide-react';

export default function AdminWorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>(() => dataStore.getWorkers());
  const [view, setView] = useState<'list' | 'form' | 'delete'>('list');
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    service: INITIAL_CATEGORIES[0]?.name || 'Carpentry & Plywood Work',
    district: 'Erode',
    area: 'Erode City',
    experienceYears: 3,
    status: 'verified' as WorkerStatus,
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const refreshWorkers = useCallback(() => {
    // 1. Immediate local hydration
    setWorkers(dataStore.getWorkers());

    // 2. Server API fetch
    const token = typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('vikasa_admin_auth') || '{}').token
      : null;

    fetch('/api/technicians', {
      headers: {
        'x-admin-portal': 'true',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.success && Array.isArray(json.data)) {
          dataStore.mergeWorkers(json.data);
          setWorkers(dataStore.getWorkers());
        }
      })
      .catch((err) => {
        console.warn('Technician list refresh warning:', err);
      });
  }, []);

  useEffect(() => {
    refreshWorkers();
    const interval = setInterval(refreshWorkers, 8000);
    return () => clearInterval(interval);
  }, [refreshWorkers]);

  const handleAddClick = () => {
    setFormData({
      fullName: '',
      phone: '',
      service: INITIAL_CATEGORIES[0]?.name || 'Carpentry & Plywood Work',
      district: 'Erode',
      area: 'Erode City',
      experienceYears: 3,
      status: 'verified',
    });
    setSelectedWorker(null);
    setView('form');
  };

  const handleEditClick = (worker: Worker) => {
    setFormData({
      fullName: worker.full_name,
      phone: worker.phone,
      service: worker.skills[0] || INITIAL_CATEGORIES[0]?.name || '',
      district: worker.district || 'Erode',
      area: worker.base_location_name,
      experienceYears: worker.experience_years || 1,
      status: worker.verification_status,
    });
    setSelectedWorker(worker);
    setView('form');
  };

  const handleDeleteClick = (worker: Worker) => {
    setSelectedWorker(worker);
    setView('delete');
  };

  const handleVerifyStatus = (worker: Worker, newStatus: WorkerStatus) => {
    dataStore.updateWorker(worker.id, {
      verification_status: newStatus,
      verified_at: newStatus === 'verified' ? new Date().toISOString() : undefined,
    });
    refreshWorkers();
    showToast(`Technician ${worker.full_name} status updated to ${newStatus}`);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = sanitizeIndianMobile10(formData.phone);

    if (selectedWorker) {
      dataStore.updateWorker(selectedWorker.id, {
        full_name: formData.fullName.trim(),
        phone: clean,
        skills: [formData.service],
        district: formData.district,
        base_location_name: formData.area.trim() || `${formData.district}, Tamil Nadu`,
        experience_years: Number(formData.experienceYears) || 1,
        verification_status: formData.status,
      });
      showToast(`Updated technician ${formData.fullName}`);
    } else {
      dataStore.registerWorker({
        full_name: formData.fullName.trim(),
        phone: clean,
        experience_years: Number(formData.experienceYears) || 1,
        skills: [formData.service],
        verification_status: formData.status,
        availability: 'available',
        district: formData.district,
        base_location_name: formData.area.trim() || `${formData.district}, Tamil Nadu`,
        latitude: 11.3410,
        longitude: 77.7172,
        service_radius_km: 20,
        service_area_names: [formData.area.trim() || formData.district],
        service_ids: [],
      });
      showToast(`Registered technician ${formData.fullName}`);
    }
    refreshWorkers();
    setView('list');
  };

  const confirmDelete = () => {
    if (selectedWorker) {
      dataStore.deleteWorker(selectedWorker.id);
      refreshWorkers();
      showToast(`Technician ${selectedWorker.full_name} archived.`);
    }
    setView('list');
  };

  const filteredWorkers = workers.filter((w) => {
    if (statusFilter !== 'ALL' && w.verification_status !== statusFilter) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = w.full_name.toLowerCase().includes(q);
      const matchPhone = w.phone.includes(q);
      const matchSkill = w.skills.some((s) => s.toLowerCase().includes(q));
      const matchDistrict = w.district?.toLowerCase().includes(q);
      return matchName || matchPhone || matchSkill || matchDistrict;
    }
    return true;
  });

  return (
    <div className="flex-1 bg-slate-100 p-3 sm:p-6 space-y-5 max-w-6xl mx-auto w-full">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 p-3.5 bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-1 border border-emerald-200">
            <Users className="w-3.5 h-3.5 text-emerald-700" />
            <span>Technician Pool</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Verified Technicians Directory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage background-verified trade specialists, review incoming applications, and update trade profiles.
          </p>
        </div>

        <button
          onClick={handleAddClick}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0 min-h-[42px]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Technician Manually</span>
        </button>
      </div>

      {view === 'list' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search technician by name, phone, trade, district..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[40px]"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[38px] shrink-0 ${
                  statusFilter === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                All ({workers.length})
              </button>
              <button
                onClick={() => setStatusFilter('pending_verification')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[38px] shrink-0 ${
                  statusFilter === 'pending_verification'
                    ? 'bg-amber-600 text-white'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                Pending Review ({workers.filter((w) => w.verification_status === 'pending_verification').length})
              </button>
              <button
                onClick={() => setStatusFilter('verified')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[38px] shrink-0 ${
                  statusFilter === 'verified'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                Verified Active ({workers.filter((w) => w.verification_status === 'verified').length})
              </button>
            </div>
          </div>

          {/* Table / Cards */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3.5">Technician</th>
                    <th className="px-4 py-3.5">Primary Trade</th>
                    <th className="px-4 py-3.5">District / Area</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Verification &amp; Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredWorkers.map((worker) => {
                    const isPending = worker.verification_status === 'pending_verification';
                    const isVerified = worker.verification_status === 'verified';

                    return (
                      <tr key={worker.id} className="hover:bg-slate-50/80 transition-colors">
                        {/* Name & Phone */}
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-900 text-xs sm:text-sm">
                            {worker.full_name}
                          </div>
                          <div className="font-mono text-slate-500 text-[11px] flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-emerald-600" />
                            <span>{worker.phone}</span>
                          </div>
                        </td>

                        {/* Trade & Exp */}
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-800 text-xs">
                            {worker.skills[0] || 'Technician'}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {worker.experience_years || 1} yrs experience
                          </span>
                        </td>

                        {/* Location */}
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-slate-800 flex items-center gap-1 text-xs">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{worker.district || 'Erode'}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 truncate max-w-[140px] block">
                            {worker.base_location_name}
                          </span>
                        </td>

                        {/* Status Badge */}
                        <td className="px-4 py-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border inline-flex items-center gap-1 ${
                              isVerified
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : isPending
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}
                          >
                            {isVerified ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            ) : isPending ? (
                              <Clock className="w-3 h-3 text-amber-600" />
                            ) : (
                              <XCircle className="w-3 h-3 text-rose-600" />
                            )}
                            <span className="capitalize">{worker.verification_status.replace('_', ' ')}</span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right space-x-2">
                          {isPending && (
                            <button
                              onClick={() => handleVerifyStatus(worker, 'verified')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs transition-colors"
                              title="Approve and verify technician"
                            >
                              Verify
                            </button>
                          )}

                          {isVerified && (
                            <button
                              onClick={() => handleVerifyStatus(worker, 'rejected')}
                              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-bold text-[11px] transition-colors"
                              title="Suspend or reject technician"
                            >
                              Suspend
                            </button>
                          )}

                          <button
                            onClick={() => handleEditClick(worker)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                            title="Edit technician details"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDeleteClick(worker)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Archive technician"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredWorkers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-slate-400 space-y-1">
                        <Users className="w-8 h-8 mx-auto text-slate-300 stroke-1" />
                        <p className="text-xs font-bold text-slate-600">No technicians found</p>
                        <p className="text-[11px]">Try adjusting your search query or filter.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Form Modal */}
      {view === 'form' && (
        <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-200 shadow-xl max-w-lg mx-auto space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-black text-slate-900">
              {selectedWorker ? 'Edit Technician Details' : 'Add New Technician to Pool'}
            </h2>
            <button
              onClick={() => setView('list')}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Full Name</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[44px]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Mobile Number (10 Digits)</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono min-h-[44px]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Primary Trade Service</label>
                <select
                  value={formData.service}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                >
                  {INITIAL_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                  <option value="Carpentry & Plywood Work">Carpentry &amp; Plywood Work</option>
                  <option value="Modular Kitchen Specialist">Modular Kitchen Specialist</option>
                  <option value="Other">Other Trade</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Experience (Years)</label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={formData.experienceYears}
                  onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">District</label>
                <select
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                >
                  {TAMIL_NADU_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Verification Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as WorkerStatus })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                >
                  <option value="verified">Verified &amp; Active</option>
                  <option value="pending_verification">Pending Verification</option>
                  <option value="rejected">Rejected</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Operating Area / Landmark</label>
              <input
                type="text"
                value={formData.area}
                onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setView('list')}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold min-h-[42px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs min-h-[42px]"
              >
                Save Technician
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {view === 'delete' && selectedWorker && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl max-w-sm mx-auto space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <Trash2 className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <h2 className="text-base font-black text-slate-900">Archive Technician?</h2>
            <p className="text-xs text-slate-600">
              Are you sure you want to remove <strong>{selectedWorker.full_name}</strong> from the active technician directory? Historical records will remain preserved in audit logs.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => setView('list')}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold min-h-[42px]"
            >
              Cancel
            </button>
            <button
              onClick={confirmDelete}
              className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold min-h-[42px]"
            >
              Confirm Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
