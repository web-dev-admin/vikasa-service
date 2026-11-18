'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { dataStore } from '@/lib/data/store';
import { Worker, WorkerStatus, ServiceItem } from '@/types';
import { INITIAL_CATEGORIES } from '@/lib/taxonomy/catalog';
import { TAMIL_NADU_DISTRICTS } from '@/lib/constants';
import { sanitizeIndianMobile10, getTelUrl, getWhatsAppUrl } from '@/lib/utils/phone';
import { useSmartPolling } from '@/lib/hooks/useSmartPolling';
import { CircuitBreaker } from '@/lib/utils/circuitBreaker';
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
  X,
  Tag,
  Wrench,
  Lock,
  MessageSquare,
  Check,
} from 'lucide-react';

export default function AdminWorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>(() => dataStore.getWorkers());
  const [availableServices, setAvailableServices] = useState<ServiceItem[]>(() => dataStore.getAllServices());
  const [view, setView] = useState<'list' | 'form' | 'delete'>('list');
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [tradeFilter, setTradeFilter] = useState<'ALL' | 'CUSTOM_ONLY'>('ALL');
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form skill addition inputs
  const [selectedServiceToAdd, setSelectedServiceToAdd] = useState('');
  const [customTradeInput, setCustomTradeInput] = useState('');

  // Call Validation Modal State
  const [validatingWorker, setValidatingWorker] = useState<Worker | null>(null);
  const [callNotes, setCallNotes] = useState('');
  const [callConfirmed, setCallConfirmed] = useState(false);
  const [isValidatingCall, setIsValidatingCall] = useState(false);

  // Persistent deleted technician IDs across session and background intervals
  const deletedWorkerIdsRef = React.useRef<Set<string>>((() => {
    try {
      if (typeof window !== 'undefined') {
        const stored = sessionStorage.getItem('vikasa_admin_deleted_workers');
        if (stored) {
          return new Set<string>(JSON.parse(stored));
        }
      }
    } catch {
      // ignore
    }
    return new Set<string>();
  })());

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    skills: [INITIAL_CATEGORIES[0]?.name || 'Carpentry & Plywood Work'] as string[],
    customTradeNote: '',
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
    // 1. Immediate local hydration, filtering deleted
    setWorkers(
      dataStore.getWorkers().filter((w) => !deletedWorkerIdsRef.current.has(w.id))
    );

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
      .then((res) => {
        CircuitBreaker.reportStatus(res.status, 'technicians');
        return res.ok ? res.json() : null;
      })
      .then((json) => {
        if (json?.success && Array.isArray(json.data)) {
          const cleanWorkers = json.data.filter(
            (w: Worker) => !deletedWorkerIdsRef.current.has(w.id)
          );
          dataStore.mergeWorkers(cleanWorkers);
          setWorkers(cleanWorkers);
        }
      })
      .catch((err) => {
        CircuitBreaker.reportError(err, 'technicians');
        console.warn('Technician list refresh warning:', err);
      });
  }, []);

  // Smart visibility-aware polling (30s interval, instant sync on focus, zero compute in background)
  useSmartPolling(refreshWorkers, { intervalMs: 30000, endpoint: 'technicians' });

  useEffect(() => {
    const handleServicesUpdate = () => {
      setAvailableServices(dataStore.getAllServices());
    };
    window.addEventListener('vikasa_services_updated', handleServicesUpdate);
    return () => {
      window.removeEventListener('vikasa_services_updated', handleServicesUpdate);
    };
  }, []);

  const handleAddClick = () => {
    setFormData({
      fullName: '',
      phone: '',
      skills: [availableServices[0]?.name || INITIAL_CATEGORIES[0]?.name || 'Carpentry & Plywood Work'],
      customTradeNote: '',
      district: 'Erode',
      area: 'Erode City',
      experienceYears: 3,
      status: 'verified',
    });
    setSelectedServiceToAdd('');
    setCustomTradeInput('');
    setSelectedWorker(null);
    setView('form');
  };

  const handleEditClick = (worker: Worker) => {
    setFormData({
      fullName: worker.full_name,
      phone: worker.phone,
      skills: Array.isArray(worker.skills) && worker.skills.length > 0 ? [...worker.skills] : ['General Technician'],
      customTradeNote: worker.custom_trade_note || '',
      district: worker.district || 'Erode',
      area: worker.base_location_name,
      experienceYears: worker.experience_years || 1,
      status: worker.verification_status,
    });
    setSelectedServiceToAdd('');
    setCustomTradeInput('');
    setSelectedWorker(worker);
    setView('form');
  };

  const handleAddSkillToTechnician = (skillName: string) => {
    const trimmed = skillName.trim();
    if (!trimmed) return;
    if (!formData.skills.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, trimmed],
      }));
    }
    setSelectedServiceToAdd('');
    setCustomTradeInput('');
  };

  const handleRemoveSkillFromTechnician = (skillToRemove: string) => {
    if (formData.skills.length <= 1) {
      showToast('A technician must have at least one trade skill.');
      return;
    }
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skillToRemove),
    }));
  };

  const handleDeleteClick = (worker: Worker) => {
    setSelectedWorker(worker);
    setView('delete');
  };

  const openCallValidation = (worker: Worker) => {
    setValidatingWorker(worker);
    setCallNotes(worker.call_notes || '');
    setCallConfirmed(Boolean(worker.call_validated));
  };

  const handleCompleteCallValidation = async () => {
    if (!validatingWorker || !callConfirmed || isValidatingCall) return;
    setIsValidatingCall(true);
    const workerId = validatingWorker.id;
    const workerName = validatingWorker.full_name;

    try {
      dataStore.validateWorkerCall(workerId, callNotes.trim() || undefined);

      const token = typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('vikasa_admin_auth') || '{}').token
        : null;

      await fetch(`/api/technicians/${encodeURIComponent(workerId)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-portal': 'true',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          call_validated: true,
          call_validated_at: new Date().toISOString(),
          call_notes: callNotes.trim() || undefined,
        }),
      });

      refreshWorkers();
      showToast(`Phone validation completed for ${workerName}. Verification is now unlocked!`);
      setValidatingWorker(null);
    } catch (err) {
      console.warn('Call validation update error:', err);
      showToast(`Recorded phone validation for ${workerName}`);
      setValidatingWorker(null);
    } finally {
      setIsValidatingCall(false);
    }
  };

  const handleVerifyStatus = async (worker: Worker, newStatus: WorkerStatus) => {
    // Gate: Telephonic interview must be confirmed before verifying a technician
    if (newStatus === 'verified' && !worker.call_validated) {
      showToast('Phone validation required: You must conduct and confirm a phone call before approving this technician.');
      openCallValidation(worker);
      return;
    }

    dataStore.updateWorker(worker.id, {
      verification_status: newStatus,
      verified_at: newStatus === 'verified' ? new Date().toISOString() : undefined,
    });

    const token = typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('vikasa_admin_auth') || '{}').token
      : null;

    try {
      await fetch(`/api/technicians/${encodeURIComponent(worker.id)}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-portal': 'true',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          verification_status: newStatus,
          verified_at: newStatus === 'verified' ? new Date().toISOString() : null,
        }),
      });
    } catch (patchErr) {
      console.warn('Technician status API update warning:', patchErr);
    }

    refreshWorkers();
    showToast(`Technician ${worker.full_name} status updated to ${newStatus}`);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = sanitizeIndianMobile10(formData.phone);

    const matchedServiceIds = availableServices
      .filter((s) => formData.skills.includes(s.name))
      .map((s) => s.id);

    const token = typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('vikasa_admin_auth') || '{}').token
      : null;

    const payload = {
      full_name: formData.fullName.trim(),
      phone: clean,
      skills: formData.skills.length > 0 ? formData.skills : ['General Technician'],
      service_ids: matchedServiceIds,
      custom_trade_note: formData.customTradeNote.trim() || undefined,
      has_custom_skill: Boolean(formData.customTradeNote.trim()),
      district: formData.district,
      base_location_name: formData.area.trim() || `${formData.district}, Tamil Nadu`,
      experience_years: Number(formData.experienceYears) || 1,
      verification_status: formData.status,
    };

    if (selectedWorker) {
      dataStore.updateWorker(selectedWorker.id, payload);
      try {
        await fetch(`/api/technicians/${encodeURIComponent(selectedWorker.id)}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-portal': 'true',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });
      } catch (patchErr) {
        console.warn('Technician API update warning:', patchErr);
      }
      showToast(`Updated technician details & trade services for ${formData.fullName}`);
    } else {
      dataStore.registerWorker({
        ...payload,
        availability: 'available',
        latitude: 11.3410,
        longitude: 77.7172,
        service_radius_km: 20,
        service_area_names: [formData.area.trim() || formData.district],
      });
      showToast(`Registered technician ${formData.fullName}`);
    }
    refreshWorkers();
    setView('list');
  };

  const confirmDelete = async () => {
    if (!selectedWorker || isDeleting) return;
    const workerId = selectedWorker.id;
    const workerName = selectedWorker.full_name;
    setIsDeleting(true);

    // 1. Instantly register in persistent memory & session storage
    deletedWorkerIdsRef.current.add(workerId);
    try {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(
          'vikasa_admin_deleted_workers',
          JSON.stringify(Array.from(deletedWorkerIdsRef.current))
        );
      }
    } catch {
      // ignore
    }

    // 2. Optimistically update local data store & UI state
    dataStore.deleteWorker(workerId);
    setWorkers((prev) => prev.filter((w) => w.id !== workerId));

    const token = typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('vikasa_admin_auth') || '{}').token
      : null;

    const headers: Record<string, string> = {
      'x-admin-portal': 'true',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    try {
      const res = await fetch(`/api/technicians/${encodeURIComponent(workerId)}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to delete technician');
      }
      refreshWorkers();
      showToast(`Technician "${workerName}" permanently deleted from database.`);
    } catch (err) {
      console.warn('Delete technician warning:', err);
      // Keep in deletedWorkerIdsRef to prevent UI glitching or flashing back
      const msg = err instanceof Error ? err.message : 'Failed to delete technician';
      showToast(msg);
    } finally {
      setIsDeleting(false);
      setView('list');
      setSelectedWorker(null);
    }
  };

  const customTradesCount = workers.filter(
    (w) => Boolean(w.has_custom_skill) || Boolean(w.custom_trade_note) || w.skills.some((s) => s.toLowerCase().includes('other'))
  ).length;

  const filteredWorkers = workers.filter((w) => {
    if (statusFilter !== 'ALL' && w.verification_status !== statusFilter) {
      return false;
    }
    if (tradeFilter === 'CUSTOM_ONLY') {
      const isCustom = Boolean(w.has_custom_skill) || Boolean(w.custom_trade_note) || w.skills.some((s) => s.toLowerCase().includes('other'));
      if (!isCustom) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = w.full_name.toLowerCase().includes(q);
      const matchPhone = w.phone.includes(q);
      const matchSkill = w.skills.some((s) => s.toLowerCase().includes(q));
      const matchCustomNote = (w.custom_trade_note || '').toLowerCase().includes(q);
      const matchDistrict = w.district?.toLowerCase().includes(q);
      return matchName || matchPhone || matchSkill || matchCustomNote || matchDistrict;
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
              <button
                onClick={() => setTradeFilter(tradeFilter === 'ALL' ? 'CUSTOM_ONLY' : 'ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all min-h-[38px] shrink-0 flex items-center gap-1.5 ${
                  tradeFilter === 'CUSTOM_ONLY'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <span>⭐ Custom Trades (Others)</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    tradeFilter === 'CUSTOM_ONLY' ? 'bg-amber-800 text-white' : 'bg-amber-200 text-amber-950'
                  }`}
                >
                  {customTradesCount}
                </span>
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
                          <div className="flex flex-wrap gap-1 max-w-[240px]">
                            {worker.skills.map((skill, sIdx) => (
                              <span
                                key={sIdx}
                                className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                          {worker.custom_trade_note && (
                            <div
                              className="mt-1 px-2 py-0.5 bg-amber-50 rounded-md border border-amber-200/90 text-[10px] text-amber-900 font-semibold max-w-[200px] truncate"
                              title={worker.custom_trade_note}
                            >
                              ⭐ {worker.custom_trade_note}
                            </div>
                          )}
                          <span className="text-[10px] text-slate-400 block mt-0.5">
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
                          <div className="space-y-1">
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

                            {/* Call Validation Badge */}
                            <div>
                              {worker.call_validated ? (
                                <span
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50/90 px-2 py-0.5 rounded-md border border-emerald-200"
                                  title={worker.call_notes ? `Call validated: ${worker.call_notes}` : 'Phone interview verified'}
                                >
                                  <Check className="w-2.5 h-2.5 text-emerald-600" />
                                  <span>Phone Verified</span>
                                </span>
                              ) : isPending ? (
                                <span
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200"
                                  title="Phone interview required before approval"
                                >
                                  <Phone className="w-2.5 h-2.5 text-amber-600" />
                                  <span>Call Required</span>
                                </span>
                              ) : null}
                            </div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-4 py-3.5 text-right space-x-1.5">
                          {isPending && (
                            <>
                              {!worker.call_validated ? (
                                <>
                                  <button
                                    onClick={() => openCallValidation(worker)}
                                    className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] shadow-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                                    title="Call candidate to interview and validate credentials"
                                  >
                                    <Phone className="w-3 h-3" />
                                    <span>Validate by Call</span>
                                  </button>
                                  <button
                                    disabled
                                    className="px-2 py-1 rounded-lg bg-slate-100 text-slate-400 font-bold text-[11px] border border-slate-200 cursor-not-allowed inline-flex items-center gap-1"
                                    title="Verify button is locked until phone call interview is completed"
                                  >
                                    <Lock className="w-3 h-3 text-slate-400" />
                                    <span>Verify (Locked)</span>
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={() => handleVerifyStatus(worker, 'verified')}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-xs transition-colors inline-flex items-center gap-1 cursor-pointer"
                                  title="Approve and activate technician in dispatch pool"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Verify &amp; Approve</span>
                                </button>
                              )}
                            </>
                          )}

                          {isVerified && (
                            <button
                              onClick={() => handleVerifyStatus(worker, 'rejected')}
                              className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-bold text-[11px] transition-colors cursor-pointer"
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

            {/* Technician Services & Skills Management (Add, Delete, Edit) */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Assigned Trade Services ({formData.skills.length})</span>
                </label>
                <span className="text-[10px] text-slate-500">Click ✕ to remove any service</span>
              </div>

              {/* Active Skills Badges with Delete button */}
              <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-white rounded-xl border border-slate-200">
                {formData.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-200"
                  >
                    <span>{skill}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkillFromTechnician(skill)}
                      className="p-0.5 hover:bg-emerald-200/80 rounded text-emerald-700 hover:text-emerald-950 transition-colors"
                      title={`Remove ${skill}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Add Service from Catalog or Custom */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">
                    + Add from Services Catalog:
                  </label>
                  <select
                    value={selectedServiceToAdd}
                    onChange={(e) => {
                      setSelectedServiceToAdd(e.target.value);
                      if (e.target.value) handleAddSkillToTechnician(e.target.value);
                    }}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 min-h-[38px] bg-white"
                  >
                    <option value="">Select official service...</option>
                    {availableServices
                      .filter((s) => !formData.skills.includes(s.name))
                      .map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-600 block mb-1">
                    + Add Custom Trade / Skill:
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="text"
                      placeholder="e.g. CCTV, Inverter, Solar"
                      value={customTradeInput}
                      onChange={(e) => setCustomTradeInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSkillToTechnician(customTradeInput);
                        }
                      }}
                      className="flex-1 px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 min-h-[38px] bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddSkillToTechnician(customTradeInput)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold min-h-[38px]"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Custom Trade Note */}
              <div className="pt-1">
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Custom Trade Notes / Specializations:
                </label>
                <textarea
                  rows={2}
                  value={formData.customTradeNote}
                  onChange={(e) => setFormData({ ...formData, customTradeNote: e.target.value })}
                  placeholder="e.g. Specialized in 3-phase wiring, inverter installation, or custom furniture design"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 bg-white resize-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">Experience (Years)</label>
              <input
                type="number"
                min={0}
                max={50}
                value={formData.experienceYears}
                onChange={(e) => setFormData({ ...formData, experienceYears: Number(e.target.value) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
              />
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
            <h2 className="text-base font-black text-slate-900">Delete technician profile?</h2>
            <p className="text-xs text-slate-600">
              Are you sure you want to permanently delete <strong>{selectedWorker.full_name}</strong> and all associated technician records? This action cannot be undone.
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setView('list')}
              disabled={isDeleting}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs font-bold min-h-[42px] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="flex-1 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold min-h-[42px] cursor-pointer flex items-center justify-center gap-1.5"
            >
              {isDeleting ? 'Deleting...' : 'Delete Permanently'}
            </button>
          </div>
        </div>
      )}

      {/* Call Validation & Verification Modal */}
      {validatingWorker && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white p-5 sm:p-7 rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <Phone className="w-4 h-4 text-amber-700" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    Candidate Call Validation
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Mandatory step: Conduct phone interview before approving technician
                  </p>
                </div>
              </div>
              <button
                onClick={() => setValidatingWorker(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Candidate Details Card */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-black text-slate-900 text-sm block">
                    {validatingWorker.full_name}
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    {validatingWorker.district || 'Erode'} • {validatingWorker.base_location_name}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                  {validatingWorker.experience_years || 1} Yrs Experience
                </span>
              </div>

              <div className="flex flex-wrap gap-1 pt-1">
                {validatingWorker.skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-slate-800 border border-slate-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              {validatingWorker.custom_trade_note && (
                <p className="text-[11px] text-amber-900 bg-amber-50 p-2 rounded-xl border border-amber-200/80 font-medium">
                  ⭐ <strong>Custom Trade:</strong> {validatingWorker.custom_trade_note}
                </p>
              )}
            </div>

            {/* Calling & Messaging Quick Triggers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <a
                href={getTelUrl(validatingWorker.phone)}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Call Candidate (+91 {validatingWorker.phone})</span>
              </a>
              <a
                href={getWhatsAppUrl(
                  validatingWorker.phone,
                  `Vanakkam ${validatingWorker.full_name}, this is VIKASA Services regarding your technician registration application. We would like to connect for a quick validation call.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5 text-white" />
                <span>WhatsApp Interview</span>
              </a>
            </div>

            {/* Call Notes */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 block">
                Call &amp; Interview Notes (Optional)
              </label>
              <textarea
                rows={3}
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
                placeholder="e.g. Confirmed experience in wiring and inverter repairs, holds necessary tools, operates in Erode North, ID verified."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-amber-500 bg-white resize-none"
              />
            </div>

            {/* Mandatory Checkbox Gate */}
            <label className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={callConfirmed}
                onChange={(e) => setCallConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <span className="text-xs text-amber-950 font-medium leading-snug">
                I have spoken with <strong>{validatingWorker.full_name}</strong> by phone and verified their identity, trade skills, equipment, and readiness for service allocation.
              </span>
            </label>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setValidatingWorker(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!callConfirmed || isValidatingCall}
                onClick={handleCompleteCallValidation}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isValidatingCall ? 'Validating...' : 'Complete Call Validation & Unlock Verify'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
