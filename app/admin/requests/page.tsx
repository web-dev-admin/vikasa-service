'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { dataStore } from '@/lib/data/store';
import {
  STANDARDIZED_SERVICES,
  TAMIL_NADU_DISTRICTS,
  REQUEST_STATUS_LABELS,
  getStatusBadgeInfo,
  VIKASA_CONFIG,
} from '@/lib/constants';
import {
  calculateDistanceKm,
  matchServiceOrTrade,
  matchDistrict,
} from '@/lib/matching/algorithm';
import { ServiceRequest, Worker, RequestStatus } from '@/types';
import { useSmartPolling } from '@/lib/hooks/useSmartPolling';
import { CircuitBreaker } from '@/lib/utils/circuitBreaker';
import {
  FileText,
  Search,
  Filter,
  PhoneCall,
  MessageCircle,
  UserCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  X,
  Check,
  AlertCircle,
  Sparkles,
  Trash2,
  Share2,
  Copy,
  ExternalLink,
  Navigation,
  Lock,
} from 'lucide-react';
import DeleteConfirmationModal from '@/components/admin/DeleteConfirmationModal';
import { audioAlert } from '@/lib/utils/audioAlert';
import {
  getTelUrl,
  getWhatsAppUrl,
  getGoogleMapsUrl,
  generateShareableJobLocationWhatsAppMessage,
  getUniversalWhatsAppShareUrl,
} from '@/lib/utils/phone';

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>(() => dataStore.getRequests());
  const [workers, setWorkers] = useState<Worker[]>(() => dataStore.getWorkers());
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [districtFilter, setDistrictFilter] = useState('ALL');
  const [requesterFilter, setRequesterFilter] = useState<'ALL' | 'CLIENT_CUSTOM' | 'TECHNICIAN'>('ALL');
  const [copiedLocationId, setCopiedLocationId] = useState<string | null>(null);

  // Customer Detail Modal
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);

  // Technician Assignment Modal
  const [assigningRequest, setAssigningRequest] = useState<ServiceRequest | null>(null);
  const [techFilterService, setTechFilterService] = useState<string>('ALL');
  const [techFilterDistrict, setTechFilterDistrict] = useState<string>('ALL');
  const [techFilterAvailability, setTechFilterAvailability] = useState<string>('ALL');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Deletion State with Persistent Session Blacklist
  const [deleteTarget, setDeleteTarget] = useState<ServiceRequest | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const deletedIdsRef = useRef<Set<string>>(new Set());

  // Hydrate deleted IDs from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('vikasa_admin_deleted_requests');
        if (saved) {
          const arr = JSON.parse(saved);
          if (Array.isArray(arr)) {
            arr.forEach((id: string) => deletedIdsRef.current.add(id));
          }
        }
      } catch {}
    }
  }, []);

  const handleDeleteRequestClick = (req: ServiceRequest) => {
    setDeleteTarget(req);
  };

  const handleConfirmDeleteRequest = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    const targetId = deleteTarget.id;
    const targetToken = deleteTarget.tracking_token;
    const targetNum = String(deleteTarget.request_number);

    // Register into memory & session blacklist immediately to prevent any polling race reintroduction
    deletedIdsRef.current.add(targetId);
    if (targetToken) deletedIdsRef.current.add(targetToken);
    if (targetNum) deletedIdsRef.current.add(targetNum);

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(
          'vikasa_admin_deleted_requests',
          JSON.stringify(Array.from(deletedIdsRef.current))
        );
      } catch {}
    }

    // Immediately purge from dataStore and UI state
    dataStore.deleteRequest(targetId);
    if (targetToken) dataStore.deleteRequest(targetToken);
    setRequests((prev) =>
      prev.filter(
        (r) =>
          r.id !== targetId &&
          r.tracking_token !== targetToken &&
          String(r.request_number) !== targetNum &&
          !deletedIdsRef.current.has(r.id) &&
          !deletedIdsRef.current.has(r.tracking_token)
      )
    );
    if (selectedRequest?.id === targetId || selectedRequest?.tracking_token === targetToken) {
      setSelectedRequest(null);
    }
    if (assigningRequest?.id === targetId) {
      setAssigningRequest(null);
    }

    const token = typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('vikasa_admin_auth') || '{}').token
      : null;

    const headers: Record<string, string> = {
      'x-admin-portal': 'true',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const queryParams = new URLSearchParams();
    if (targetToken) queryParams.set('token', targetToken);
    if (targetNum) queryParams.set('num', targetNum);

    try {
      const res = await fetch(`/api/requests/${encodeURIComponent(targetId)}?${queryParams.toString()}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to delete service request');
      }

      showToast(`Service enquiry #${targetNum} deleted permanently.`);
      setDeleteTarget(null);
    } catch (err) {
      // Keep in blacklist so UI does NOT glitch back on screen
      const msg = err instanceof Error ? err.message : 'Notice: Record removed locally';
      showToast(msg);
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const loadData = useCallback(() => {
    // 1. Immediately hydrate from local store, strictly filtering deleted records
    const allRequests = dataStore.getRequests().filter(
      (r) => !deletedIdsRef.current.has(r.id) && !deletedIdsRef.current.has(r.tracking_token)
    );
    const allWorkers = dataStore.getWorkers();
    setRequests(allRequests);
    setWorkers(allWorkers);

    setSelectedRequest((prev) => {
      if (!prev) return null;
      return allRequests.find((r) => r.id === prev.id) || null;
    });

    // 2. Fetch latest server queue
    const token = typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('vikasa_admin_auth') || '{}').token
      : null;

    fetch('/api/requests', {
      headers: {
        'x-admin-portal': 'true',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
      .then((res) => {
        CircuitBreaker.reportStatus(res.status, 'requests');
        return res.ok ? res.json() : null;
      })
      .then((json) => {
        if (json?.success && Array.isArray(json.data)) {
          const cleanList = json.data.filter(
            (r: ServiceRequest) =>
              !deletedIdsRef.current.has(r.id) &&
              !deletedIdsRef.current.has(r.tracking_token) &&
              !deletedIdsRef.current.has(String(r.request_number))
          );
          dataStore.mergeRequests(cleanList);
          const current = dataStore.getRequests().filter(
            (r: ServiceRequest) =>
              !deletedIdsRef.current.has(r.id) &&
              !deletedIdsRef.current.has(r.tracking_token) &&
              !deletedIdsRef.current.has(String(r.request_number))
          );
          setRequests(current);
          setSelectedRequest((prev) => {
            if (!prev) return null;
            return current.find((r: ServiceRequest) => r.id === prev.id) || null;
          });
        }
      })
      .catch((err) => {
        CircuitBreaker.reportError(err, 'requests');
      });

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
          dataStore.mergeWorkers(json.data);
          setWorkers(dataStore.getWorkers());
        }
      })
      .catch((err) => {
        CircuitBreaker.reportError(err, 'technicians');
      });
  }, []);

  // Smart visibility-aware polling (30s interval, instant sync on focus, zero compute in background)
  useSmartPolling(loadData, { intervalMs: 30000, endpoint: 'requests' });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const copyShareableLocation = (req: ServiceRequest, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const msg = generateShareableJobLocationWhatsAppMessage({
      requestNumber: req.request_number,
      customerName: req.customer_name,
      customerPhone: req.customer_phone,
      serviceName: req.service_name,
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

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(msg).then(() => {
        setCopiedLocationId(req.id);
        showToast('Exact location & job details copied in shareable WhatsApp format!');
        setTimeout(() => setCopiedLocationId(null), 2500);
      }).catch(() => {
        showToast('Could not copy to clipboard');
      });
    }
  };

  const handleConfirmRequest = (requestId: string) => {
    dataStore.confirmCustomerRequirement(requestId, 'Confirmed with customer by Admin');
    showToast('Request status changed to Confirmed');
    loadData();
  };

  const openAssignModal = (request: ServiceRequest, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAssigningRequest(request);
    // Find matching standardized service if available, otherwise 'ALL'
    const stdMatch = STANDARDIZED_SERVICES.find((s) =>
      matchServiceOrTrade([request.service_name], [request.service_id], s.name, s.id)
    );
    setTechFilterService(stdMatch ? stdMatch.name : 'ALL');
    setTechFilterDistrict(request.district || 'ALL');
    setTechFilterAvailability('ALL');
  };

  const handleAssignTechnician = (technicianId: string) => {
    if (!assigningRequest) return;
    try {
      const worker = workers.find((w) => w.id === technicianId);
      if (worker && worker.verification_status !== 'verified') {
        dataStore.verifyWorker(technicianId, 'admin-1', 'Verified on assignment dispatch');
      }
      dataStore.assignWorker(assigningRequest.id, technicianId);
      showToast('Technician assigned successfully.');
      setAssigningRequest(null);
      if (selectedRequest && selectedRequest.id === assigningRequest.id) {
        setSelectedRequest(null);
      }
      loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to assign technician');
    }
  };

  const handleCompleteJob = (requestId: string) => {
    dataStore.completeJob(requestId);
    showToast('Work completed successfully.');
    if (selectedRequest && selectedRequest.id === requestId) {
      setSelectedRequest(null);
    }
    loadData();
  };

  const handleCancelRequest = (requestId: string) => {
    dataStore.updateRequestStatus(requestId, 'CANCELLED', 'Archived by Admin');
    showToast('Booking archived as Cancelled.');
    if (selectedRequest && selectedRequest.id === requestId) {
      setSelectedRequest(null);
    }
    loadData();
  };

  const clientCustomCount = requests.filter(
    (r) =>
      (r.service_name.toLowerCase().includes('other') ||
        r.service_id === 'srv-other' ||
        Boolean(r.custom_service_note)) &&
      r.requester_type !== 'technician'
  ).length;

  const technicianReqsCount = requests.filter(
    (r) => r.requester_type === 'technician'
  ).length;

  const filtered = requests.filter((r) => {
    const matchSearch =
      r.request_number.toString().includes(search) ||
      r.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      r.customer_phone.includes(search) ||
      r.service_name.toLowerCase().includes(search.toLowerCase()) ||
      (r.custom_service_note && r.custom_service_note.toLowerCase().includes(search.toLowerCase())) ||
      r.formatted_address.toLowerCase().includes(search.toLowerCase()) ||
      (r.district && r.district.toLowerCase().includes(search.toLowerCase()));

    if (!matchSearch) return false;

    if (requesterFilter === 'CLIENT_CUSTOM') {
      const isCustom =
        r.service_name.toLowerCase().includes('other') ||
        r.service_id === 'srv-other' ||
        Boolean(r.custom_service_note);
      if (!isCustom || r.requester_type === 'technician') return false;
    }

    if (requesterFilter === 'TECHNICIAN') {
      if (r.requester_type !== 'technician') return false;
    }

    if (statusFilter !== 'ALL') {
      if (statusFilter === 'NEW' && r.status !== 'NEW' && r.status !== 'CUSTOMER_TO_CALL') return false;
      if (statusFilter === 'CONFIRMED' && r.status !== 'CUSTOMER_CONFIRMED' && r.status !== 'MATCHING' && r.status !== 'WORKER_CONTACTING') return false;
      if (statusFilter === 'ASSIGNED' && r.status !== 'ASSIGNED' && r.status !== 'IN_PROGRESS') return false;
      if (statusFilter === 'COMPLETED' && r.status !== 'COMPLETED') return false;
    }

    if (districtFilter !== 'ALL' && r.district?.toLowerCase() !== districtFilter.toLowerCase()) {
      return false;
    }

    return true;
  });

  const recommendedTechnicians = assigningRequest
    ? workers
        .map((w) => {
          const dist = calculateDistanceKm(
            assigningRequest.latitude || VIKASA_CONFIG.coordinates.lat,
            assigningRequest.longitude || VIKASA_CONFIG.coordinates.lon,
            w.latitude || VIKASA_CONFIG.coordinates.lat,
            w.longitude || VIKASA_CONFIG.coordinates.lon
          );

          const matchesService = matchServiceOrTrade(
            w.skills,
            w.service_ids,
            assigningRequest.service_name,
            assigningRequest.service_id
          );

          const matchesDistrict = matchDistrict(w.district, assigningRequest.district);

          return {
            ...w,
            distance_km: dist,
            matchesService,
            matchesDistrict,
          };
        })
        .filter((w) => {
          if (techFilterService !== 'ALL') {
            const hasService = matchServiceOrTrade(
              w.skills,
              w.service_ids,
              techFilterService
            );
            if (!hasService) return false;
          }

          if (techFilterDistrict !== 'ALL' && !matchDistrict(w.district, techFilterDistrict)) {
            return false;
          }

          if (techFilterAvailability !== 'ALL' && w.availability !== techFilterAvailability) {
            return false;
          }

          return true;
        })
        .sort((a, b) => {
          // 1. Same district first
          if (a.matchesDistrict && !b.matchesDistrict) return -1;
          if (!a.matchesDistrict && b.matchesDistrict) return 1;

          // 2. Matching trade service first
          if (a.matchesService && !b.matchesService) return -1;
          if (!a.matchesService && b.matchesService) return 1;

          // 3. Available first
          if (a.availability === 'available' && b.availability !== 'available') return -1;
          if (a.availability !== 'available' && b.availability === 'available') return 1;

          // 4. Distance nearest first
          if (a.distance_km !== b.distance_km) return a.distance_km - b.distance_km;

          // 5. Higher experience first
          return b.experience_years - a.experience_years;
        })
    : [];

  return (
    <div className="flex-1 bg-slate-100 p-3 sm:p-6 space-y-4 max-w-4xl mx-auto w-full">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 p-3.5 bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <span>Service Requests</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View, confirm, and assign all customer requests across districts.
          </p>
        </div>

        <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 self-start sm:self-auto">
          {filtered.length} Requests
        </span>
      </div>

      {/* Search & Predefined Dropdown Filters */}
      <div className="bg-white p-3.5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        {/* Requester & Custom Requirement Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-100">
          <button
            type="button"
            onClick={() => setRequesterFilter('ALL')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
              requesterFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>All Requests ({requests.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setRequesterFilter('CLIENT_CUSTOM')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              requesterFilter === 'CLIENT_CUSTOM'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <span>⭐ Client Custom (Others)</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                requesterFilter === 'CLIENT_CUSTOM' ? 'bg-amber-800 text-white' : 'bg-amber-200/80 text-amber-950'
              }`}
            >
              {clientCustomCount}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setRequesterFilter('TECHNICIAN')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
              requesterFilter === 'TECHNICIAN'
                ? 'bg-purple-700 text-white shadow-xs'
                : 'bg-purple-50 text-purple-900 border border-purple-200 hover:bg-purple-100'
            }`}
          >
            <span>🔧 Technician Requests</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                requesterFilter === 'TECHNICIAN' ? 'bg-purple-900 text-white' : 'bg-purple-200/80 text-purple-950'
              }`}
            >
              {technicianReqsCount}
            </span>
          </button>

          <Link
            href="/admin/suggestions"
            className="ml-auto px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100 flex items-center gap-1.5 transition-all shadow-2xs"
            title="View dedicated suggestions and custom trade requests hub"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <span>Dedicated Suggestions Hub &rarr;</span>
          </Link>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name, phone, service, district..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Status Filter
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">New Requests</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="ASSIGNED">Technician Assigned</option>
              <option value="COMPLETED">Work Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              District Filter
            </label>
            <select
              value={districtFilter}
              onChange={(e) => setDistrictFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white"
            >
              <option value="ALL">All Districts</option>
              {TAMIL_NADU_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Customer Tiles List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">No matching requests found</h3>
            <p className="text-xs text-slate-400">Try adjusting your search or filter options above.</p>
          </div>
        ) : (
          filtered.map((req) => {
            const badge = getStatusBadgeInfo(req.status);
            const isAssigned = req.status === 'ASSIGNED' || req.status === 'IN_PROGRESS';
            const isCompleted = req.status === 'COMPLETED';

            return (
              /* Simple Customer Tile */
              <div
                key={req.id}
                onClick={() => {
                  audioAlert.acknowledgeHeavyAlarm(req.id);
                  setSelectedRequest(req);
                }}
                className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 hover:border-emerald-500/80 hover:shadow-md transition-all cursor-pointer space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-slate-900 leading-tight">
                        {req.customer_name}
                      </h3>
                      <span className="text-[10px] text-slate-400 font-bold">
                        #{req.request_number}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                        {req.service_name}
                      </span>
                      {req.requester_type === 'technician' ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200">
                          🔧 Technician
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                          👤 Client
                        </span>
                      )}
                      <span className="text-xs text-slate-500">
                        {req.preferred_date || 'Today'} · <strong className="text-slate-800">{req.district || 'Erode'}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[220px]" title={req.formatted_address}>{req.formatted_address}</span>
                      <a
                        href={getGoogleMapsUrl(req.latitude, req.longitude, req.formatted_address, req.district)}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-1.5 py-0.5 rounded border border-emerald-200 transition-colors shrink-0"
                        title="Open exact GPS location in Google Maps"
                      >
                        <Navigation className="w-2.5 h-2.5" />
                        <span>Maps</span>
                      </a>
                    </div>

                    {(req.custom_service_note || req.service_name.toLowerCase().includes('other') || req.service_id === 'srv-other') && (
                      <div className="mt-2 p-2.5 bg-amber-50/90 border border-amber-300 text-xs rounded-xl space-y-1">
                        <div className="flex items-center gap-1 font-bold text-amber-900 text-[11px]">
                          <span>⭐</span>
                          <span>Custom Requirement ({req.requester_type === 'technician' ? 'Technician Need' : 'Client Specification'}):</span>
                        </div>
                        <p className="text-amber-950 font-medium leading-relaxed italic">
                          &quot;{req.custom_service_note || req.description}&quot;
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badge.className}`}>
                      {badge.label}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteRequestClick(req);
                      }}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete Service Enquiry"
                      aria-label={`Delete enquiry #${req.request_number}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {isAssigned && req.assigned_worker_name && (
                  <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 text-xs rounded-xl flex items-center justify-between text-emerald-900">
                    <span>Assigned Tech: <strong>{req.assigned_worker_name}</strong></span>
                    <span className="text-[11px] text-emerald-700 font-bold">{req.assigned_worker_phone}</span>
                  </div>
                )}

                {/* Quick Actions: Call, WhatsApp, Assign */}
                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                  <a
                    href={getTelUrl(req.customer_phone)}
                    className="py-2.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors text-center"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Call</span>
                  </a>

                  <a
                    href={getWhatsAppUrl(
                      req.customer_phone,
                      `Vanakkam ${req.customer_name}, VIKASA here regarding your ${req.service_name} request #${req.request_number}.`
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center justify-center gap-1.5 transition-colors text-center"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp</span>
                  </a>

                  {isCompleted ? (
                    <span className="py-2.5 px-2 rounded-xl bg-slate-50 text-slate-400 text-xs font-bold flex items-center justify-center text-center">
                      Completed
                    </span>
                  ) : isAssigned ? (
                    <button
                      type="button"
                      onClick={() => handleCompleteJob(req.id)}
                      className="py-2.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer text-center"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Complete</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => openAssignModal(req, e)}
                      className="py-2.5 px-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer text-center"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Assign</span>
                    </button>
                  )}
                </div>

                {/* Single Share Button - Enabled ONLY After Allocation */}
                <div className="flex items-center gap-1.5 pt-1 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
                  {req.assigned_worker_id ? (
                    <>
                      <a
                        href={getUniversalWhatsAppShareUrl(
                          generateShareableJobLocationWhatsAppMessage({
                            requestNumber: req.request_number,
                            customerName: req.customer_name,
                            customerPhone: req.customer_phone,
                            serviceName: req.service_name,
                            district: req.district,
                            formattedAddress: req.formatted_address,
                            latitude: req.latitude,
                            longitude: req.longitude,
                            preferredDate: req.preferred_date,
                            preferredTimeSlot: req.preferred_time_slot,
                            description: req.description,
                            customServiceNote: req.custom_service_note,
                            technicianName: req.assigned_worker_name,
                          }),
                          req.assigned_worker_phone
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-1.5 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors text-center cursor-pointer"
                        title={`Share dispatch order & exact Google Maps location to ${req.assigned_worker_name || 'Technician'}`}
                      >
                        <Share2 className="w-3.5 h-3.5 text-white" />
                        <span>Share to {req.assigned_worker_name ? req.assigned_worker_name.split(' ')[0] : 'Tech'} (WhatsApp)</span>
                      </a>

                      <button
                        type="button"
                        onClick={(e) => copyShareableLocation(req, e)}
                        className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors shrink-0 flex items-center justify-center cursor-pointer"
                        title="Copy shareable WhatsApp location format to clipboard"
                      >
                        {copiedLocationId === req.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-slate-600" />
                        )}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-100 text-slate-400 border border-slate-200 text-[11px] font-bold flex items-center justify-center gap-1.5 cursor-not-allowed"
                      title="Location sharing is locked until a technician is allocated to this request"
                    >
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Share Location (Allocate Tech First)</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Customer Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Customer Request Details
                </span>
                <h2 className="text-xl font-black text-slate-900">
                  {selectedRequest.customer_name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700">
              {selectedRequest.requester_type === 'technician' && (
                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-400 font-semibold">Requester:</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 bg-purple-50 text-purple-800 border-purple-200">
                    🔧 Technician Partner
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400 font-semibold">Service:</span>
                <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                  {selectedRequest.service_name}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400 font-semibold">Mobile:</span>
                <span className="font-mono font-bold text-slate-900">{selectedRequest.customer_phone}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400 font-semibold">District:</span>
                <span className="font-bold text-slate-900">{selectedRequest.district || 'Erode'}</span>
              </div>
              <div className="py-2 border-b border-slate-100 space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-slate-400 font-semibold shrink-0">Exact Location:</span>
                  <div className="text-right space-y-1">
                    <span className="font-bold text-slate-900 block leading-snug">{selectedRequest.formatted_address}</span>
                    {typeof selectedRequest.latitude === 'number' && typeof selectedRequest.longitude === 'number' && selectedRequest.latitude !== 0 && (
                      <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md inline-block">
                        GPS: {selectedRequest.latitude.toFixed(5)}, {selectedRequest.longitude.toFixed(5)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex justify-end">
                  <a
                    href={getGoogleMapsUrl(
                      selectedRequest.latitude,
                      selectedRequest.longitude,
                      selectedRequest.formatted_address,
                      selectedRequest.district
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-all shadow-2xs"
                    title="Open turn-by-turn navigation in Google Maps"
                  >
                    <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Open Google Maps</span>
                    <ExternalLink className="w-3 h-3 text-emerald-500" />
                  </a>
                </div>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400 font-semibold">Date:</span>
                <span className="font-bold text-slate-800">{selectedRequest.preferred_date || 'Today'}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400 font-semibold">Status:</span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadgeInfo(selectedRequest.status).className}`}>
                  {getStatusBadgeInfo(selectedRequest.status).label}
                </span>
              </div>

              {selectedRequest.custom_service_note && (
                <div className="p-3 bg-amber-50/90 rounded-2xl border border-amber-300 text-amber-950">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                      ⭐ Custom / Other Service Details
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 bg-amber-200 text-amber-900 rounded-full">
                      Client Specified
                    </span>
                  </div>
                  <p className="text-xs font-semibold leading-relaxed">
                    {selectedRequest.custom_service_note}
                  </p>
                </div>
              )}

              {selectedRequest.description && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Problem Description:
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed italic">
                    &quot;{selectedRequest.description}&quot;
                  </p>
                </div>
              )}

              {/* Single Share Button - Enabled ONLY After Allocation */}
              {selectedRequest.assigned_worker_id ? (
                <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-300/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Share2 className="w-4 h-4 text-emerald-700" />
                      <span className="text-[11px] font-black uppercase tracking-wider text-emerald-950">
                        Dispatched to {selectedRequest.assigned_worker_name}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyShareableLocation(selectedRequest)}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-900 bg-white hover:bg-emerald-100 px-2 py-1 rounded-lg border border-emerald-200 shadow-2xs transition-colors cursor-pointer"
                    >
                      {copiedLocationId === selectedRequest.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-slate-500" />
                          <span>Copy Format</span>
                        </>
                      )}
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Single share button generates pre-formatted order with customer name, phone number, service, and direct clickable Google Maps GPS navigation link.
                  </p>

                  <div className="pt-1">
                    <a
                      href={getUniversalWhatsAppShareUrl(
                        generateShareableJobLocationWhatsAppMessage({
                          requestNumber: selectedRequest.request_number,
                          customerName: selectedRequest.customer_name,
                          customerPhone: selectedRequest.customer_phone,
                          serviceName: selectedRequest.service_name,
                          district: selectedRequest.district,
                          formattedAddress: selectedRequest.formatted_address,
                          latitude: selectedRequest.latitude,
                          longitude: selectedRequest.longitude,
                          preferredDate: selectedRequest.preferred_date,
                          preferredTimeSlot: selectedRequest.preferred_time_slot,
                          description: selectedRequest.description,
                          customServiceNote: selectedRequest.custom_service_note,
                          technicianName: selectedRequest.assigned_worker_name,
                        }),
                        selectedRequest.assigned_worker_phone
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors text-center cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Share Location to {selectedRequest.assigned_worker_name} (WhatsApp)</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center gap-1.5 text-slate-500">
                    <Lock className="w-4 h-4 text-slate-400" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                      Location Sharing (Locked)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Technician allocation required. Once you assign a technician to this order, the single share button will be enabled to dispatch the customer name, mobile number, service, and exact Google Maps location directly to the technician&apos;s WhatsApp.
                  </p>
                  <button
                    type="button"
                    disabled
                    className="w-full py-2.5 px-3 rounded-xl bg-slate-200 text-slate-400 text-xs font-bold flex items-center justify-center gap-1.5 cursor-not-allowed border border-slate-300"
                  >
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Share Location (Allocate Tech First)</span>
                  </button>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-2">
              <a
                href={getTelUrl(selectedRequest.customer_phone)}
                className="py-3 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors text-center"
              >
                <PhoneCall className="w-4 h-4 text-emerald-600" />
                <span>Call</span>
              </a>

              <a
                href={getWhatsAppUrl(
                  selectedRequest.customer_phone,
                  `Vanakkam ${selectedRequest.customer_name}, VIKASA here regarding your ${selectedRequest.service_name} request #${selectedRequest.request_number}.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center justify-center gap-1.5 transition-colors text-center"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>WhatsApp</span>
              </a>

              {selectedRequest.status === 'NEW' ? (
                <button
                  type="button"
                  onClick={() => handleConfirmRequest(selectedRequest.id)}
                  className="py-3 px-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-sm transition-colors cursor-pointer text-center"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirm</span>
                </button>
              ) : selectedRequest.status === 'ASSIGNED' ? (
                <button
                  type="button"
                  onClick={() => handleCompleteJob(selectedRequest.id)}
                  className="py-3 px-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-sm transition-colors cursor-pointer text-center"
                >
                  <Check className="w-4 h-4" />
                  <span>Complete</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => openAssignModal(selectedRequest)}
                  className="py-3 px-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors cursor-pointer text-center"
                >
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                  <span>Assign</span>
                </button>
              )}
            </div>

            {selectedRequest.status !== 'CANCELLED' && (
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Are you sure you want to cancel and archive booking #${selectedRequest.request_number}?`)) {
                    handleCancelRequest(selectedRequest.id);
                  }
                }}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-500 hover:text-rose-600 text-xs font-bold transition-colors min-h-[38px]"
              >
                Cancel &amp; Archive Booking
              </button>
            )}

            <button
              type="button"
              onClick={() => handleDeleteRequestClick(selectedRequest)}
              className="w-full py-2.5 px-3 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Service Enquiry Record</span>
            </button>
          </div>
        </div>
      )}

      {/* Technician Assignment Modal */}
      {assigningRequest && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-xl rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto p-5 sm:p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  Nearby Technician Matching
                </span>
                <h2 className="text-lg font-black text-slate-900">
                  Assign for: {assigningRequest.customer_name}
                </h2>
                <p className="text-xs text-slate-500">
                  {assigningRequest.service_name} • {assigningRequest.district || 'Erode'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAssigningRequest(null)}
                className="p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Service</label>
                <select
                  value={techFilterService}
                  onChange={(e) => setTechFilterService(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
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
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">District</label>
                <select
                  value={techFilterDistrict}
                  onChange={(e) => setTechFilterDistrict(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
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
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Availability</label>
                <select
                  value={techFilterAvailability}
                  onChange={(e) => setTechFilterAvailability(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                >
                  <option value="available">Available</option>
                  <option value="ALL">All</option>
                  <option value="busy">Busy</option>
                </select>
              </div>
            </div>

            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              {recommendedTechnicians.length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-3">
                  <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-800">No matching technicians for current filter</p>
                    <p className="text-[11px] text-slate-500">
                      Total in directory: {workers.length} technician{workers.length === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setTechFilterService('ALL');
                        setTechFilterDistrict('ALL');
                        setTechFilterAvailability('ALL');
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      Reset Filters (Show All)
                    </button>
                    <Link
                      href="/admin/workers"
                      className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-colors"
                    >
                      + Add Technician
                    </Link>
                  </div>
                </div>
              ) : (
                recommendedTechnicians.map((tech) => (
                  <div
                    key={tech.id}
                    className="p-3.5 bg-slate-50 hover:bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900">{tech.full_name}</h4>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              tech.availability === 'available'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {tech.availability.toUpperCase()}
                          </span>
                          {tech.verification_status !== 'verified' ? (
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                              PENDING REVIEW
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ✓ VERIFIED
                            </span>
                          )}
                          {tech.matchesService && (
                            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" />
                              TRADE MATCH
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {tech.skills[0] || 'Technician'} • <strong>{tech.distance_km} km away</strong> • {tech.district || 'Erode'}
                        </p>
                      </div>

                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
                        {tech.experience_years}+ Yrs
                      </span>
                    </div>

                    {(() => {
                      const techDispatchMsg = generateShareableJobLocationWhatsAppMessage({
                        requestNumber: assigningRequest.request_number,
                        customerName: assigningRequest.customer_name,
                        customerPhone: assigningRequest.customer_phone,
                        serviceName: assigningRequest.service_name,
                        district: assigningRequest.district,
                        formattedAddress: assigningRequest.formatted_address,
                        latitude: assigningRequest.latitude,
                        longitude: assigningRequest.longitude,
                        preferredDate: assigningRequest.preferred_date,
                        preferredTimeSlot: assigningRequest.preferred_time_slot,
                        description: assigningRequest.description,
                        customServiceNote: assigningRequest.custom_service_note,
                        technicianName: tech.full_name,
                      });

                      return (
                        <div className="space-y-1.5 pt-1 border-t border-slate-200/60">
                          <div className="grid grid-cols-3 gap-2">
                            <a
                              href={getTelUrl(tech.phone)}
                              className="py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors text-center"
                            >
                              <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Call</span>
                            </a>

                            <a
                              href={getWhatsAppUrl(tech.phone, techDispatchMsg)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-2 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center justify-center gap-1.5 transition-colors text-center"
                              title="Send exact location & Google Maps navigation to technician"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>WhatsApp</span>
                            </a>

                            <button
                              type="button"
                              onClick={() => handleAssignTechnician(tech.id)}
                              className="py-2 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer text-center shadow-xs"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>{tech.verification_status === 'verified' ? 'Assign' : 'Verify & Assign'}</span>
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              handleAssignTechnician(tech.id);
                              if (typeof window !== 'undefined') {
                                window.open(getWhatsAppUrl(tech.phone, techDispatchMsg), '_blank');
                              }
                            }}
                            className="w-full py-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                          >
                            <Navigation className="w-3 h-3 text-emerald-400" />
                            <span>Assign &amp; WhatsApp Location to {tech.full_name.split(' ')[0]}</span>
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={Boolean(deleteTarget)}
        title="Delete this record?"
        message="Are you sure you want to permanently delete this customer enquiry? This action cannot be undone."
        recordName={
          deleteTarget
            ? `#${deleteTarget.request_number} — ${deleteTarget.customer_name} (${deleteTarget.service_name})`
            : undefined
        }
        isDeleting={isDeleting}
        onConfirm={handleConfirmDeleteRequest}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
