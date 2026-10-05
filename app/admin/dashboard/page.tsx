'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { dataStore } from '@/lib/data/store';
import {
  STANDARDIZED_SERVICES,
  TAMIL_NADU_DISTRICTS,
  REQUEST_STATUS_LABELS,
  getStatusBadgeInfo,
  VIKASA_CONFIG,
} from '@/lib/constants';
import { calculateDistanceKm } from '@/lib/matching/algorithm';
import { ServiceRequest, Worker, RequestStatus } from '@/types';
import {
  PhoneCall,
  MessageCircle,
  UserCheck,
  CheckCircle2,
  Clock,
  MapPin,
  Calendar,
  X,
  Search,
  Filter,
  Check,
  Navigation,
  ChevronRight,
  ShieldCheck,
  Wrench,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { getTelUrl, getWhatsAppUrl } from '@/lib/utils/phone';

type CategoryFilter = 'NEW' | 'CONFIRMED' | 'ASSIGNED' | 'COMPLETED' | 'ALL';

export default function AdminDashboardPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>('NEW');

  // Customer Detail Modal
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);

  // Technician Assignment Modal
  const [assigningRequest, setAssigningRequest] = useState<ServiceRequest | null>(null);
  const [techFilterService, setTechFilterService] = useState<string>('ALL');
  const [techFilterDistrict, setTechFilterDistrict] = useState<string>('ALL');
  const [techFilterAvailability, setTechFilterAvailability] = useState<string>('available');

  // Toast message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = () => {
    const allRequests = dataStore.getRequests();
    const allWorkers = dataStore.getWorkers().filter((w) => w.verification_status === 'verified');
    setRequests(allRequests);
    setWorkers(allWorkers);

    // Keep active selected request in sync if open
    if (selectedRequest) {
      const refreshed = allRequests.find((r) => r.id === selectedRequest.id);
      if (refreshed) setSelectedRequest(refreshed);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Status Counts
  const countNew = requests.filter((r) => r.status === 'NEW' || r.status === 'CUSTOMER_TO_CALL').length;
  const countConfirmed = requests.filter(
    (r) =>
      r.status === 'CUSTOMER_CONFIRMED' ||
      r.status === 'MATCHING' ||
      r.status === 'WORKER_CONTACTING'
  ).length;
  const countAssigned = requests.filter((r) => r.status === 'ASSIGNED' || r.status === 'IN_PROGRESS').length;
  const countCompleted = requests.filter((r) => r.status === 'COMPLETED').length;

  // Filter requests by active category
  const filteredRequests = requests.filter((r) => {
    if (activeCategory === 'NEW') {
      return r.status === 'NEW' || r.status === 'CUSTOMER_TO_CALL';
    }
    if (activeCategory === 'CONFIRMED') {
      return (
        r.status === 'CUSTOMER_CONFIRMED' ||
        r.status === 'MATCHING' ||
        r.status === 'WORKER_CONTACTING'
      );
    }
    if (activeCategory === 'ASSIGNED') {
      return r.status === 'ASSIGNED' || r.status === 'IN_PROGRESS';
    }
    if (activeCategory === 'COMPLETED') {
      return r.status === 'COMPLETED';
    }
    return true;
  });

  // Action: Confirm Customer Request
  const handleConfirmRequest = (requestId: string) => {
    dataStore.confirmCustomerRequirement(requestId, 'Confirmed with customer by Admin');
    showToast('Request status changed to Confirmed');
    loadData();
  };

  // Action: Open Assign Modal
  const openAssignModal = (request: ServiceRequest, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAssigningRequest(request);
    setTechFilterService(request.service_name || 'ALL');
    setTechFilterDistrict(request.district || 'ALL');
    setTechFilterAvailability('available');
  };

  // Action: Assign Technician
  const handleAssignTechnician = (technicianId: string) => {
    if (!assigningRequest) return;
    try {
      dataStore.assignWorker(assigningRequest.id, technicianId);
      showToast('Technician assigned successfully.');
      setAssigningRequest(null);
      if (selectedRequest && selectedRequest.id === assigningRequest.id) {
        setSelectedRequest(null);
      }
      loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to assign technician');
    }
  };

  // Action: Complete Job
  const handleCompleteJob = (requestId: string) => {
    dataStore.completeJob(requestId);
    showToast('Work completed successfully.');
    if (selectedRequest && selectedRequest.id === requestId) {
      setSelectedRequest(null);
    }
    loadData();
  };

  // Ranked recommended technicians for matching modal
  const recommendedTechnicians = assigningRequest
    ? workers
        .map((w) => {
          const dist = calculateDistanceKm(
            assigningRequest.latitude,
            assigningRequest.longitude,
            w.latitude,
            w.longitude
          );

          const sLower = assigningRequest.service_name.toLowerCase();
          const matchesService =
            w.service_ids.some((id) => id.toLowerCase().includes(sLower) || sLower.includes(id.toLowerCase())) ||
            w.skills.some((skill) => skill.toLowerCase().includes(sLower) || sLower.includes(skill.toLowerCase()));

          const matchesDistrict =
            !assigningRequest.district ||
            w.district?.toLowerCase() === assigningRequest.district.toLowerCase();

          return {
            ...w,
            distance_km: dist,
            matchesService,
            matchesDistrict,
          };
        })
        .filter((w) => {
          if (techFilterService !== 'ALL') {
            const fLower = techFilterService.toLowerCase();
            const hasService =
              w.service_ids.some((id) => id.toLowerCase().includes(fLower)) ||
              w.skills.some((s) => s.toLowerCase().includes(fLower));
            if (!hasService) return false;
          }

          if (techFilterDistrict !== 'ALL' && w.district?.toLowerCase() !== techFilterDistrict.toLowerCase()) {
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

          // 2. Available first
          if (a.availability === 'available' && b.availability !== 'available') return -1;
          if (a.availability !== 'available' && b.availability === 'available') return 1;

          // 3. Distance nearest
          return a.distance_km - b.distance_km;
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

      {/* Greeting & Header */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
            Admin Request Manager
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Requests Management
          </h1>
        </div>

        <Link
          href="/admin/contacts"
          className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
        >
          <span>Contacts Directory</span>
        </Link>
      </div>

      {/* Simple 4 Category Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => setActiveCategory('NEW')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            activeCategory === 'NEW'
              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider">New Requests</span>
            <span
              className={`text-xs font-black px-2 py-0.5 rounded-full ${
                activeCategory === 'NEW' ? 'bg-white text-blue-700' : 'bg-blue-50 text-blue-700'
              }`}
            >
              {countNew}
            </span>
          </div>
          <span className="text-2xl font-black block mt-1">{countNew}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('CONFIRMED')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            activeCategory === 'CONFIRMED'
              ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-600/20'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider">Confirmed</span>
            <span
              className={`text-xs font-black px-2 py-0.5 rounded-full ${
                activeCategory === 'CONFIRMED' ? 'bg-white text-amber-700' : 'bg-amber-50 text-amber-700'
              }`}
            >
              {countConfirmed}
            </span>
          </div>
          <span className="text-2xl font-black block mt-1">{countConfirmed}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('ASSIGNED')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            activeCategory === 'ASSIGNED'
              ? 'bg-emerald-700 text-white border-emerald-700 shadow-md shadow-emerald-700/20'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider">Assigned</span>
            <span
              className={`text-xs font-black px-2 py-0.5 rounded-full ${
                activeCategory === 'ASSIGNED' ? 'bg-white text-emerald-800' : 'bg-emerald-50 text-emerald-800'
              }`}
            >
              {countAssigned}
            </span>
          </div>
          <span className="text-2xl font-black block mt-1">{countAssigned}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveCategory('COMPLETED')}
          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
            activeCategory === 'COMPLETED'
              ? 'bg-slate-800 text-white border-slate-800 shadow-md'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider">Completed</span>
            <span
              className={`text-xs font-black px-2 py-0.5 rounded-full ${
                activeCategory === 'COMPLETED' ? 'bg-white text-slate-800' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {countCompleted}
            </span>
          </div>
          <span className="text-2xl font-black block mt-1">{countCompleted}</span>
        </button>
      </div>

      {/* Customer Tiles List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {activeCategory === 'ALL' ? 'All Requests' : `${activeCategory} Requests`} ({filteredRequests.length})
          </span>
          <button
            onClick={() => setActiveCategory('ALL')}
            className={`text-xs font-bold ${activeCategory === 'ALL' ? 'text-emerald-700 underline' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Show All
          </button>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">
              No {activeCategory.toLowerCase()} requests
            </h3>
            <p className="text-xs text-slate-400">
              Requests will automatically appear here when submitted by customers.
            </p>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const badge = getStatusBadgeInfo(req.status);
            const isAssigned = req.status === 'ASSIGNED' || req.status === 'IN_PROGRESS';
            const isCompleted = req.status === 'COMPLETED';

            return (
              /* Simple Customer Tile */
              <div
                key={req.id}
                onClick={() => setSelectedRequest(req)}
                className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 hover:border-emerald-500/80 hover:shadow-md transition-all cursor-pointer space-y-3"
              >
                {/* Tile Header: Name, Service, Date · District */}
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

                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                        {req.service_name}
                      </span>
                      <span className="text-xs text-slate-500">
                        Today · <strong className="text-slate-800">{req.district || 'Salem'}</strong>
                      </span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badge.className}`}>
                    {badge.label}
                  </span>
                </div>

                {/* Assigned Technician Banner if assigned */}
                {isAssigned && req.assigned_worker_name && (
                  <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 text-xs rounded-xl flex items-center justify-between text-emerald-900">
                    <span>Assigned Tech: <strong>{req.assigned_worker_name}</strong></span>
                    <span className="text-[11px] text-emerald-700 font-bold">{req.assigned_worker_phone}</span>
                  </div>
                )}

                {/* Exactly Three Main Actions */}
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
                      `Vanakkam ${req.customer_name}, this is VIKASA coordination regarding your ${req.service_name} request #${req.request_number}.`
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
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* 8. CUSTOMER DETAIL MODAL / PANEL */}
      {/* ========================================================================= */}
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

            {/* Details Fields */}
            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400 font-semibold">Service Required:</span>
                <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                  {selectedRequest.service_name}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400 font-semibold">Mobile Number:</span>
                <span className="font-mono font-bold text-slate-900">{selectedRequest.customer_phone}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400 font-semibold">WhatsApp Number:</span>
                <span className="font-mono font-bold text-slate-900">
                  {selectedRequest.customer_whatsapp || selectedRequest.customer_phone}
                </span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400 font-semibold">District:</span>
                <span className="font-bold text-slate-900">{selectedRequest.district || 'Salem'}</span>
              </div>

              <div className="flex items-start justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400 font-semibold shrink-0">Location:</span>
                <span className="font-medium text-slate-800 text-right">{selectedRequest.formatted_address}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400 font-semibold">Requested Date:</span>
                <span className="font-bold text-slate-800">{selectedRequest.preferred_date || 'Today'}</span>
              </div>

              <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400 font-semibold">Current Status:</span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadgeInfo(selectedRequest.status).className}`}>
                  {getStatusBadgeInfo(selectedRequest.status).label}
                </span>
              </div>

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

              {selectedRequest.assigned_worker_name && (
                <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
                  <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                    Assigned Technician:
                  </span>
                  <p className="font-bold text-emerald-950 text-sm">
                    {selectedRequest.assigned_worker_name}
                  </p>
                  <p className="text-xs text-emerald-700">{selectedRequest.assigned_worker_phone}</p>
                </div>
              )}
            </div>

            {/* Exactly 3 Actions at bottom of Customer Detail Modal */}
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
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 11. TECHNICIAN MATCHING & ASSIGNMENT MODAL */}
      {/* ========================================================================= */}
      {assigningRequest && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-xl rounded-t-3xl sm:rounded-3xl max-h-[92vh] overflow-y-auto p-5 sm:p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  Nearby Technician Matching
                </span>
                <h2 className="text-lg font-black text-slate-900">
                  Assign for: {assigningRequest.customer_name}
                </h2>
                <p className="text-xs text-slate-500">
                  {assigningRequest.service_name} • {assigningRequest.district || 'Salem'}
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

            {/* Quick Filters: Service, District, Availability */}
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
                  <option value="available">Available Only</option>
                  <option value="ALL">All States</option>
                  <option value="busy">Busy</option>
                </select>
              </div>
            </div>

            {/* Recommended Technicians List */}
            <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Ranked by Distance &amp; Availability ({recommendedTechnicians.length} matches)
              </span>

              {recommendedTechnicians.length === 0 ? (
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-1">
                  <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No matching technicians found</p>
                  <p className="text-[11px] text-slate-400">Try changing district or availability filter above.</p>
                </div>
              ) : (
                recommendedTechnicians.map((tech) => (
                  /* Technician Card */
                  <div
                    key={tech.id}
                    className="p-3.5 bg-slate-50 hover:bg-white rounded-2xl border border-slate-200 hover:border-emerald-500 transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
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
                        </div>

                        <p className="text-xs text-slate-600 mt-0.5">
                          {tech.skills[0] || 'Technician'} • <strong>{tech.distance_km} km away</strong> • {tech.district}
                        </p>
                      </div>

                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {tech.experience_years}+ Yrs
                      </span>
                    </div>

                    {/* Exactly Three Actions: Call, WhatsApp, Assign */}
                    <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200/60">
                      <a
                        href={getTelUrl(tech.phone)}
                        className="py-2 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors text-center"
                      >
                        <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Call</span>
                      </a>

                      <a
                        href={getWhatsAppUrl(
                          tech.phone,
                          `Vanakkam ${tech.full_name}, VIKASA has a service job nearby for ${assigningRequest.service_name} in ${assigningRequest.district}. Are you ready?`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 px-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center justify-center gap-1.5 transition-colors text-center"
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
                        <span>Assign</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
