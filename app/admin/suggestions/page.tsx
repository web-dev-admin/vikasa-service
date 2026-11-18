'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { dataStore } from '@/lib/data/store';
import { ServiceRequest, Worker, ServiceCategory } from '@/types';
import { useSmartPolling } from '@/lib/hooks/useSmartPolling';
import { CircuitBreaker } from '@/lib/utils/circuitBreaker';
import {
  Sparkles,
  Search,
  Filter,
  PhoneCall,
  MessageCircle,
  MapPin,
  Calendar,
  Briefcase,
  Users,
  CheckCircle2,
  ExternalLink,
  Navigation,
  Plus,
  Copy,
  Check,
  X,
  Clock,
  ArrowRight,
  ShieldCheck,
  Tag,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import {
  getTelUrl,
  getWhatsAppUrl,
  getGoogleMapsUrl,
  generateShareableJobLocationWhatsAppMessage,
  getUniversalWhatsAppShareUrl,
} from '@/lib/utils/phone';

type SuggestionTab = 'ALL' | 'CUSTOMERS' | 'TECHNICIANS';

export default function AdminSuggestionsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>(() => dataStore.getRequests());
  const [workers, setWorkers] = useState<Worker[]>(() => dataStore.getWorkers());
  const [categories, setCategories] = useState<ServiceCategory[]>(() => dataStore.getAllCategories());

  const [activeTab, setActiveTab] = useState<SuggestionTab>('ALL');
  const [search, setSearch] = useState('');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Blacklist tracking to prevent deleted suggestions from popping back during interval sync
  const [deletedCustomerSuggestionIds, setDeletedCustomerSuggestionIds] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('vikasa_admin_deleted_requests');
        if (saved) return new Set(JSON.parse(saved));
      } catch {}
    }
    return new Set();
  });

  const [deletedTechSuggestionIds, setDeletedTechSuggestionIds] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('vikasa_admin_deleted_workers');
        if (saved) return new Set(JSON.parse(saved));
      } catch {}
    }
    return new Set();
  });

  // Delete / Dismiss Modal State
  const [deleteModalData, setDeleteModalData] = useState<{
    type: 'customer' | 'technician';
    id: string;
    name: string;
    title: string;
    token?: string;
    requestNumber?: number;
    phone?: string;
    detail?: string;
  } | null>(null);
  const [isDeletingSuggestion, setIsDeletingSuggestion] = useState(false);

  // Quick "Add to Catalog" Modal State
  const [catalogModalData, setCatalogModalData] = useState<{
    source: 'customer' | 'technician';
    serviceName: string;
    description: string;
    categoryId: string;
    priceEstimate: string;
  } | null>(null);
  const [isSubmittingCatalog, setIsSubmittingCatalog] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const refreshData = useCallback(() => {
    setRequests(
      dataStore.getRequests().filter(
        (r) =>
          !deletedCustomerSuggestionIds.has(r.id) &&
          !deletedCustomerSuggestionIds.has(r.tracking_token) &&
          !deletedCustomerSuggestionIds.has(String(r.request_number))
      )
    );
    setWorkers(
      dataStore.getWorkers().filter(
        (w) => !deletedTechSuggestionIds.has(w.id) && (!w.phone || !deletedTechSuggestionIds.has(w.phone))
      )
    );
    setCategories(dataStore.getAllCategories());

    const token = typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('vikasa_admin_auth') || '{}').token
      : null;

    const headers: Record<string, string> = {
      'x-admin-portal': 'true',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    Promise.all([
      fetch('/api/requests', { headers, credentials: 'include' }).then((r) => {
        CircuitBreaker.reportStatus(r.status, 'requests');
        return r.ok ? r.json() : null;
      }),
      fetch('/api/technicians', { headers, credentials: 'include' }).then((r) => {
        CircuitBreaker.reportStatus(r.status, 'technicians');
        return r.ok ? r.json() : null;
      }),
      fetch('/api/categories', { credentials: 'include' }).then((r) => {
        CircuitBreaker.reportStatus(r.status, 'categories');
        return r.ok ? r.json() : null;
      }),
    ])
      .then(([reqRes, techRes, catRes]) => {
        if (reqRes?.success && Array.isArray(reqRes.data)) {
          const cleanReqs = reqRes.data.filter(
            (r: ServiceRequest) =>
              !deletedCustomerSuggestionIds.has(r.id) &&
              !deletedCustomerSuggestionIds.has(r.tracking_token) &&
              !deletedCustomerSuggestionIds.has(String(r.request_number))
          );
          dataStore.mergeRequests(cleanReqs);
          setRequests(
            dataStore.getRequests().filter(
              (r) =>
                !deletedCustomerSuggestionIds.has(r.id) &&
                !deletedCustomerSuggestionIds.has(r.tracking_token) &&
                !deletedCustomerSuggestionIds.has(String(r.request_number))
            )
          );
        }
        if (techRes?.success && Array.isArray(techRes.data)) {
          const cleanTechs = techRes.data.filter(
            (w: Worker) =>
              !deletedTechSuggestionIds.has(w.id) &&
              (!w.phone || !deletedTechSuggestionIds.has(w.phone))
          );
          dataStore.mergeWorkers(cleanTechs);
          setWorkers(
            dataStore.getWorkers().filter(
              (w) => !deletedTechSuggestionIds.has(w.id) && (!w.phone || !deletedTechSuggestionIds.has(w.phone))
            )
          );
        }
        if (catRes?.success && Array.isArray(catRes.data)) {
          setCategories(catRes.data);
        }
      })
      .catch((err) => {
        CircuitBreaker.reportError(err, 'suggestions');
      });
  }, [deletedCustomerSuggestionIds, deletedTechSuggestionIds]);

  // Smart visibility-aware polling (30s interval, instant sync on focus, zero compute in background)
  useSmartPolling(refreshData, { intervalMs: 30000, endpoint: 'suggestions' });

  useEffect(() => {
    const handleUpdate = () => refreshData();
    window.addEventListener('vikasa_services_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('vikasa_services_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [refreshData]);

  // 1. Identify Customer Suggestions (Requests booked under "Other" or having custom requirement notes)
  const customerSuggestions = requests.filter((r) => {
    const isOther =
      r.service_id === 'srv-other' ||
      r.service_name.toLowerCase().includes('other') ||
      r.service_name.toLowerCase().includes('custom') ||
      Boolean(r.custom_service_note);
    return isOther;
  });

  // 2. Identify Technician Suggestions (Workers with custom trade note or has_custom_skill)
  const technicianSuggestions = workers.filter((w) => {
    const isCustom =
      Boolean(w.has_custom_skill) ||
      Boolean(w.custom_trade_note) ||
      w.skills.some((s) => s.toLowerCase().includes('other') || s.toLowerCase().includes('custom'));
    return isCustom;
  });

  // Filtered lists based on search and district
  const filteredCustomerSuggestions = customerSuggestions.filter((r) => {
    if (districtFilter !== 'ALL' && r.district !== districtFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = r.customer_name.toLowerCase().includes(q);
      const matchPhone = r.customer_phone.includes(q);
      const matchService = r.service_name.toLowerCase().includes(q);
      const matchNote = (r.custom_service_note || '').toLowerCase().includes(q);
      const matchDesc = (r.description || '').toLowerCase().includes(q);
      const matchDistrict = (r.district || '').toLowerCase().includes(q);
      return matchName || matchPhone || matchService || matchNote || matchDesc || matchDistrict;
    }
    return true;
  });

  const filteredTechnicianSuggestions = technicianSuggestions.filter((w) => {
    if (districtFilter !== 'ALL' && w.district !== districtFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = w.full_name.toLowerCase().includes(q);
      const matchPhone = w.phone.includes(q);
      const matchSkills = w.skills.some((s) => s.toLowerCase().includes(q));
      const matchNote = (w.custom_trade_note || '').toLowerCase().includes(q);
      const matchDistrict = (w.district || '').toLowerCase().includes(q);
      return matchName || matchPhone || matchSkills || matchNote || matchDistrict;
    }
    return true;
  });

  // Copy helper
  const handleCopySuggestion = (text: string, id: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopiedId(id);
        showToast('Copied to clipboard!');
        setTimeout(() => setCopiedId(null), 2500);
      });
    }
  };

  // Open Add to Catalog Modal
  const openAddToCatalogModal = (
    name: string,
    description: string,
    source: 'customer' | 'technician'
  ) => {
    setCatalogModalData({
      source,
      serviceName: name,
      description: description || `${name} doorstep home service in Tamil Nadu`,
      categoryId: categories[0]?.id || 'cat-general',
      priceEstimate: 'Custom Quote',
    });
  };

  // Submit to official services catalog
  const handlePublishToCatalog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catalogModalData || !catalogModalData.serviceName.trim()) return;

    setIsSubmittingCatalog(true);
    const token = typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('vikasa_admin_auth') || '{}').token
      : null;

    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-portal': 'true',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: catalogModalData.serviceName.trim(),
          category_id: catalogModalData.categoryId,
          description: catalogModalData.description.trim(),
          price_estimate: catalogModalData.priceEstimate.trim() || 'Custom Quote',
          is_active: true,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to add service to catalog');
      }

      dataStore.addCustomService(json.data);
      showToast(`Service "${json.data.name}" published to official catalog & booking dropdown!`);
      setCatalogModalData(null);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to publish service';
      showToast(msg);
    } finally {
      setIsSubmittingCatalog(false);
    }
  };

  // Open Delete / Dismiss Modal for Customer Suggestion
  const handleOpenDeleteCustomerSuggestion = (req: ServiceRequest) => {
    const suggestedTitle = req.custom_service_note?.split(' - ')[0] || req.service_name || 'Custom Home Service';
    setDeleteModalData({
      type: 'customer',
      id: req.id,
      name: req.customer_name,
      title: suggestedTitle,
      token: req.tracking_token,
      requestNumber: req.request_number,
      phone: req.customer_phone,
      detail: req.custom_service_note || req.description,
    });
  };

  // Open Delete / Dismiss Modal for Technician Suggestion
  const handleOpenDeleteTechnicianSuggestion = (tech: Worker) => {
    const suggestedTrade = tech.custom_trade_note || tech.skills[0] || 'Specialized Trade';
    setDeleteModalData({
      type: 'technician',
      id: tech.id,
      name: tech.full_name,
      title: suggestedTrade,
      phone: tech.phone,
      detail: tech.custom_trade_note || tech.skills.join(', '),
    });
  };

  // Execute Permanent Delete for Customer Suggestion
  const executeDeleteCustomerSuggestion = async () => {
    if (!deleteModalData) return;
    const { id, token, requestNumber, title } = deleteModalData;
    setIsDeletingSuggestion(true);

    // 1. Immediately add to blacklist in memory & session
    const nextBlacklist = new Set(deletedCustomerSuggestionIds);
    nextBlacklist.add(id);
    if (token) nextBlacklist.add(token);
    if (requestNumber) nextBlacklist.add(String(requestNumber));
    setDeletedCustomerSuggestionIds(nextBlacklist);

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('vikasa_admin_deleted_requests', JSON.stringify(Array.from(nextBlacklist)));
      } catch {}
    }

    // 2. Optimistically purge from dataStore and UI state
    dataStore.deleteRequest(id);
    if (token) dataStore.deleteRequest(token);
    if (requestNumber) dataStore.deleteRequest(String(requestNumber));
    setRequests((prev) =>
      prev.filter(
        (r) =>
          r.id !== id &&
          r.tracking_token !== token &&
          r.request_number !== requestNumber &&
          !nextBlacklist.has(r.id) &&
          !nextBlacklist.has(r.tracking_token)
      )
    );

    // 3. Delete from backend database
    const authToken = typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('vikasa_admin_auth') || '{}').token
      : null;

    const headers: Record<string, string> = {
      'x-admin-portal': 'true',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    };

    const queryParams = new URLSearchParams();
    if (token) queryParams.set('token', token);
    if (requestNumber) queryParams.set('num', String(requestNumber));

    try {
      const res = await fetch(`/api/requests/${encodeURIComponent(id)}?${queryParams.toString()}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to delete service request');
      }
      showToast(`Customer request for "${title}" permanently deleted from database.`);
      setDeleteModalData(null);
    } catch (err) {
      console.warn('Delete suggestion warning:', err);
      const msg = err instanceof Error ? err.message : 'Notice: Record removed locally';
      showToast(msg);
      setDeleteModalData(null);
    } finally {
      setIsDeletingSuggestion(false);
    }
  };

  // Execute Dismiss or Permanent Delete for Technician Suggestion
  const executeDismissTechnicianSuggestion = async (mode: 'dismiss_trade' | 'delete_technician') => {
    if (!deleteModalData) return;
    const { id, name, title } = deleteModalData;
    setIsDeletingSuggestion(true);

    const authToken = typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('vikasa_admin_auth') || '{}').token
      : null;

    const headers: Record<string, string> = {
      'x-admin-portal': 'true',
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    };

    try {
      if (mode === 'dismiss_trade') {
        // Clear custom trade note from technician record
        const res = await fetch(`/api/technicians/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          headers,
          credentials: 'include',
          body: JSON.stringify({
            custom_trade_note: null,
            has_custom_skill: false,
          }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to dismiss trade suggestion');
        }
        dataStore.updateWorker(id, { custom_trade_note: undefined, has_custom_skill: false });
        setWorkers(dataStore.getWorkers());
        showToast(`Custom trade suggestion for "${name}" dismissed.`);
      } else {
        // Permanently delete technician
        const nextBlacklist = new Set(deletedTechSuggestionIds);
        nextBlacklist.add(id);
        if (deleteModalData.phone) nextBlacklist.add(deleteModalData.phone);
        setDeletedTechSuggestionIds(nextBlacklist);

        if (typeof window !== 'undefined') {
          try {
            sessionStorage.setItem('vikasa_admin_deleted_workers', JSON.stringify(Array.from(nextBlacklist)));
          } catch {}
        }

        dataStore.deleteWorker(id);
        setWorkers((prev) => prev.filter((w) => w.id !== id && !nextBlacklist.has(w.id)));

        const res = await fetch(`/api/technicians/${encodeURIComponent(id)}`, {
          method: 'DELETE',
          headers,
          credentials: 'include',
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Failed to delete technician record');
        }
        showToast(`Technician "${name}" permanently deleted from database.`);
      }
      setDeleteModalData(null);
    } catch (err) {
      console.warn('Technician suggestion action error:', err);
      const msg = err instanceof Error ? err.message : 'Error processing request';
      showToast(msg);
      setDeleteModalData(null);
    } finally {
      setIsDeletingSuggestion(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-100 p-3 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 p-3.5 bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-xs font-bold mb-1.5 border border-amber-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Community Intelligence</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Customer &amp; Technician Suggestions
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Review uncataloged services and custom trades requested by homeowners and technicians when selecting &quot;Other Services&quot;. Add high-demand suggestions directly to your official services catalog with 1-click.
          </p>
        </div>

        <Link
          href="/admin/services"
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0 min-h-[42px] self-start sm:self-auto"
        >
          <Briefcase className="w-4 h-4 text-emerald-400" />
          <span>Manage Services Catalog</span>
        </Link>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Total Suggestions
          </span>
          <div className="text-2xl font-black text-slate-900">
            {customerSuggestions.length + technicianSuggestions.length}
          </div>
          <p className="text-[11px] text-slate-500">From &quot;Other Services&quot; &amp; Trades</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
            <span>👤</span>
            <span>Customer Needs</span>
          </span>
          <div className="text-2xl font-black text-amber-900">
            {customerSuggestions.length}
          </div>
          <p className="text-[11px] text-amber-700/80">Homeowner custom requests</p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider flex items-center gap-1">
            <span>🔧</span>
            <span>Technician Trades</span>
          </span>
          <div className="text-2xl font-black text-purple-900">
            {technicianSuggestions.length}
          </div>
          <p className="text-[11px] text-purple-700/80">Partner trade specialties</p>
        </div>

        <div className="p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200 shadow-2xs space-y-1">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Catalog Ready</span>
          </span>
          <div className="text-2xl font-black text-emerald-950">
            {customerSuggestions.length + technicianSuggestions.length}
          </div>
          <p className="text-[11px] text-emerald-700 font-medium">1-Click Publish to Booking Dropdown</p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Segmented Queue Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <span>All Suggestions</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${activeTab === 'ALL' ? 'bg-slate-800 text-white' : 'bg-slate-200 text-slate-800'}`}>
                {customerSuggestions.length + technicianSuggestions.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('CUSTOMERS')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'CUSTOMERS'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
              }`}
            >
              <span>👤 Customer Needs</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${activeTab === 'CUSTOMERS' ? 'bg-amber-800 text-white' : 'bg-amber-200 text-amber-950'}`}>
                {customerSuggestions.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('TECHNICIANS')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'TECHNICIANS'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'bg-purple-50 text-purple-900 hover:bg-purple-100 border border-purple-200'
              }`}
            >
              <span>🔧 Technician Trades</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${activeTab === 'TECHNICIANS' ? 'bg-purple-900 text-white' : 'bg-purple-200 text-purple-950'}`}>
                {technicianSuggestions.length}
              </span>
            </button>
          </div>

          {/* District Filter Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap hidden sm:inline">District:</span>
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white"
            >
              <option value="ALL">All Districts</option>
              {Array.from(new Set([...requests.map((r) => r.district), ...workers.map((w) => w.district)].filter(Boolean))).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer/technician name, phone, suggested service, or custom notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
      </div>

      {/* Grid of Suggestions */}
      <div className="space-y-6">
        {/* SECTION 1: CUSTOMER SUGGESTIONS */}
        {(activeTab === 'ALL' || activeTab === 'CUSTOMERS') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Customer Requested Services ({filteredCustomerSuggestions.length})</span>
              </h2>
              <span className="text-xs text-slate-500 font-medium">From Homeowner Bookings</span>
            </div>

            {filteredCustomerSuggestions.length === 0 ? (
              <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-1">
                <Sparkles className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-600">No customer custom suggestions found</p>
                <p className="text-[11px] text-slate-400">When customers select &quot;Other Services&quot;, their suggestions appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredCustomerSuggestions.map((req) => {
                  const suggestedTitle = req.custom_service_note?.split(' - ')[0] || req.service_name || 'Custom Home Service';
                  const detailedScope = req.custom_service_note || req.description;

                  const shareMsg = generateShareableJobLocationWhatsAppMessage({
                    requestNumber: req.request_number,
                    customerName: req.customer_name,
                    customerPhone: req.customer_phone,
                    serviceName: suggestedTitle,
                    district: req.district,
                    formattedAddress: req.formatted_address,
                    latitude: req.latitude,
                    longitude: req.longitude,
                    preferredDate: req.preferred_date,
                    preferredTimeSlot: req.preferred_time_slot,
                    description: req.description,
                    customServiceNote: req.custom_service_note,
                    technicianName: req.assigned_worker_name,
                  });

                  return (
                    <div
                      key={req.id}
                      className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 hover:border-amber-400 transition-all shadow-xs space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 inline-block mb-1">
                              👤 Customer Suggested Service
                            </span>
                            <h3 className="text-base font-black text-slate-900 leading-snug">
                              {suggestedTitle}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              Booking #{req.request_number} • {req.district || 'Erode'} • {req.preferred_date || 'Today'}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => openAddToCatalogModal(suggestedTitle, detailedScope, 'customer')}
                              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs flex items-center gap-1 shadow-xs transition-colors shrink-0 cursor-pointer"
                              title="Publish this suggestion to the official services catalog"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add to Catalog</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenDeleteCustomerSuggestion(req)}
                              className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 border border-rose-200 transition-colors shrink-0 cursor-pointer"
                              title="Permanently delete this customer request"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Customer Scope / Description Callout */}
                        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-1">
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-900 block">
                            Customer Specified Scope:
                          </span>
                          <p className="text-xs text-amber-950 font-semibold leading-relaxed italic">
                            &quot;{detailedScope}&quot;
                          </p>
                        </div>

                        {/* Customer & Location */}
                        <div className="text-xs space-y-1 pt-1 text-slate-600">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Customer:</span>
                            <span className="font-bold text-slate-800">{req.customer_name}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Contact:</span>
                            <span className="font-mono font-bold text-slate-900">{req.customer_phone}</span>
                          </div>
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-slate-400 shrink-0">Exact Location:</span>
                            <div className="text-right">
                              <span className="font-medium text-slate-800 block text-[11px]">{req.formatted_address}</span>
                              <a
                                href={getGoogleMapsUrl(req.latitude, req.longitude, req.formatted_address, req.district)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 hover:text-emerald-900 pt-0.5"
                              >
                                <Navigation className="w-2.5 h-2.5" />
                                <span>Google Maps Navigation</span>
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Actions Footer */}
                      <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                        <a
                          href={getTelUrl(req.customer_phone)}
                          className="py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                        >
                          <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Call</span>
                        </a>

                        <a
                          href={getUniversalWhatsAppShareUrl(shareMsg)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold flex items-center justify-center gap-1 transition-colors text-center"
                          title="Share exact location & details on WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Share Location (WhatsApp)</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => handleCopySuggestion(shareMsg, req.id)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors shrink-0 cursor-pointer"
                          title="Copy details to clipboard"
                        >
                          {copiedId === req.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenDeleteCustomerSuggestion(req)}
                          className="py-2 px-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer shrink-0"
                          title="Permanently delete this customer request"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SECTION 2: TECHNICIAN SUGGESTIONS */}
        {(activeTab === 'ALL' || activeTab === 'TECHNICIANS') && (
          <div className="space-y-3 pt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                <span>Technician Suggested Trades ({filteredTechnicianSuggestions.length})</span>
              </h2>
              <span className="text-xs text-slate-500 font-medium">From Partner Registrations</span>
            </div>

            {filteredTechnicianSuggestions.length === 0 ? (
              <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-1">
                <Briefcase className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-600">No technician trade suggestions found</p>
                <p className="text-[11px] text-slate-400">When technicians register with &quot;Other Trades&quot; or custom notes, they appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTechnicianSuggestions.map((tech) => {
                  const suggestedTrade = tech.custom_trade_note || tech.skills[0] || 'Specialized Trade';

                  return (
                    <div
                      key={tech.id}
                      className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 hover:border-purple-400 transition-all shadow-xs space-y-3 flex flex-col justify-between"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10px] font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 inline-block mb-1">
                              🔧 Technician Suggested Trade
                            </span>
                            <h3 className="text-base font-black text-slate-900 leading-snug">
                              {tech.custom_trade_note ? `⭐ ${tech.custom_trade_note}` : tech.skills.join(', ')}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {tech.experience_years} Years Experience • {tech.district || 'Erode'} • {tech.base_location_name}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => openAddToCatalogModal(tech.custom_trade_note || tech.skills[0], `${tech.full_name} custom trade specialization in ${tech.district}`, 'technician')}
                              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs flex items-center gap-1 shadow-xs transition-colors shrink-0 cursor-pointer"
                              title="Add this trade to official catalog"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add to Catalog</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenDeleteTechnicianSuggestion(tech)}
                              className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 border border-rose-200 transition-colors shrink-0 cursor-pointer"
                              title="Dismiss or delete this technician suggestion"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Specialization Notes */}
                        {tech.custom_trade_note && (
                          <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-1">
                            <span className="text-[10px] font-black uppercase tracking-wider text-purple-900 block">
                              Technician Custom Specialization:
                            </span>
                            <p className="text-xs text-purple-950 font-semibold leading-relaxed italic">
                              &quot;{tech.custom_trade_note}&quot;
                            </p>
                          </div>
                        )}

                        {/* Technician Profile Details */}
                        <div className="text-xs space-y-1 pt-1 text-slate-600">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Technician:</span>
                            <span className="font-bold text-slate-800">{tech.full_name}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Phone:</span>
                            <span className="font-mono font-bold text-slate-900">{tech.phone}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">All Registered Skills:</span>
                            <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
                              {tech.skills.map((s, idx) => (
                                <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-bold text-[10px]">
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Actions Footer */}
                      <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                        <a
                          href={getTelUrl(tech.phone)}
                          className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                        >
                          <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Call Technician</span>
                        </a>

                        <a
                          href={getWhatsAppUrl(
                            tech.phone,
                            `Vanakkam ${tech.full_name}, VIKASA here regarding your ${tech.custom_trade_note || tech.skills[0]} trade specialization.`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold flex items-center justify-center gap-1 transition-colors text-center"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>WhatsApp Chat</span>
                        </a>

                        <Link
                          href="/admin/workers"
                          className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
                        >
                          Edit Profile
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleOpenDeleteTechnicianSuggestion(tech)}
                          className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer shrink-0"
                          title="Dismiss or delete this technician suggestion"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* QUICK ADD TO SERVICES CATALOG MODAL */}
      {catalogModalData && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                  Community Suggestion to Catalog
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  Publish to Official Services Catalog
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCatalogModalData(null)}
                className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePublishToCatalog} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Service Name (As shown in dropdown)</label>
                <input
                  type="text"
                  required
                  value={catalogModalData.serviceName}
                  onChange={(e) => setCatalogModalData({ ...catalogModalData, serviceName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Parent Service Category</label>
                <select
                  value={catalogModalData.categoryId}
                  onChange={(e) => setCatalogModalData({ ...catalogModalData, categoryId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-emerald-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Short Description (&quot;i&quot; button tooltip copy)</label>
                <textarea
                  rows={3}
                  required
                  value={catalogModalData.description}
                  onChange={(e) => setCatalogModalData({ ...catalogModalData, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Price Estimate / Standard Rate</label>
                <input
                  type="text"
                  value={catalogModalData.priceEstimate}
                  onChange={(e) => setCatalogModalData({ ...catalogModalData, priceEstimate: e.target.value })}
                  placeholder="e.g. ₹350 onwards or Custom Quote"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setCatalogModalData(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCatalog}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isSubmittingCatalog ? 'Publishing...' : 'Publish to Catalog'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE / DISMISS CONFIRMATION MODAL */}
      {deleteModalData && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    {deleteModalData.type === 'customer'
                      ? 'Delete Customer Suggestion'
                      : 'Dismiss / Delete Trade Suggestion'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {deleteModalData.type === 'customer'
                      ? `Booking #${deleteModalData.requestNumber || 'Custom'}`
                      : `${deleteModalData.name}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModalData(null)}
                className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content summary */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Target:</span>
                <span className="font-bold text-slate-800">{deleteModalData.name} ({deleteModalData.phone})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Service / Trade:</span>
                <span className="font-bold text-slate-900">{deleteModalData.title}</span>
              </div>
              {deleteModalData.detail && (
                <div className="pt-1 border-t border-slate-200/60">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Detail Scope:</span>
                  <p className="text-[11px] text-slate-700 italic font-medium leading-relaxed">&quot;{deleteModalData.detail}&quot;</p>
                </div>
              )}
            </div>

            {deleteModalData.type === 'customer' ? (
              <div className="space-y-4">
                <p className="text-xs text-rose-700 font-medium bg-rose-50 p-3 rounded-xl border border-rose-200 leading-relaxed">
                  ⚠️ This action will permanently remove booking #{deleteModalData.requestNumber} from the database and suggestions queue. It cannot be undone.
                </p>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setDeleteModalData(null)}
                    disabled={isDeletingSuggestion}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={executeDeleteCustomerSuggestion}
                    disabled={isDeletingSuggestion}
                    className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isDeletingSuggestion ? 'Deleting...' : 'Permanently Delete'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Choose how to handle this technician suggestion:
                </p>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => executeDismissTechnicianSuggestion('dismiss_trade')}
                    disabled={isDeletingSuggestion}
                    className="w-full p-3 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 text-xs font-bold flex items-start gap-2.5 text-left transition-colors cursor-pointer"
                  >
                    <span className="text-base">🧹</span>
                    <div>
                      <span className="block font-black text-amber-900">Dismiss Custom Trade Only</span>
                      <span className="text-[11px] text-amber-700 font-normal">Removes this custom trade note from suggestions, but keeps the technician active in the directory.</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => executeDismissTechnicianSuggestion('delete_technician')}
                    disabled={isDeletingSuggestion}
                    className="w-full p-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-950 border border-rose-200 text-xs font-bold flex items-start gap-2.5 text-left transition-colors cursor-pointer"
                  >
                    <span className="text-base">🗑️</span>
                    <div>
                      <span className="block font-black text-rose-900">Permanently Delete Technician</span>
                      <span className="text-[11px] text-rose-700 font-normal">Permanently removes technician {deleteModalData.name} from the database.</span>
                    </div>
                  </button>
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setDeleteModalData(null)}
                    disabled={isDeletingSuggestion}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
