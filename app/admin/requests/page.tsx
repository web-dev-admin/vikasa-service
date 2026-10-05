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
} from 'lucide-react';
import { getTelUrl, getWhatsAppUrl } from '@/lib/utils/phone';

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [districtFilter, setDistrictFilter] = useState('ALL');

  // Customer Detail Modal
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);

  // Technician Assignment Modal
  const [assigningRequest, setAssigningRequest] = useState<ServiceRequest | null>(null);
  const [techFilterService, setTechFilterService] = useState<string>('ALL');
  const [techFilterDistrict, setTechFilterDistrict] = useState<string>('ALL');
  const [techFilterAvailability, setTechFilterAvailability] = useState<string>('available');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = () => {
    const allRequests = dataStore.getRequests();
    const allWorkers = dataStore.getWorkers().filter((w) => w.verification_status === 'verified');
    setRequests(allRequests);
    setWorkers(allWorkers);

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

  const handleConfirmRequest = (requestId: string) => {
    dataStore.confirmCustomerRequirement(requestId, 'Confirmed with customer by Admin');
    showToast('Request status changed to Confirmed');
    loadData();
  };

  const openAssignModal = (request: ServiceRequest, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setAssigningRequest(request);
    setTechFilterService(request.service_name || 'ALL');
    setTechFilterDistrict(request.district || 'ALL');
    setTechFilterAvailability('available');
  };

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

  const handleCompleteJob = (requestId: string) => {
    dataStore.completeJob(requestId);
    showToast('Work completed successfully.');
    if (selectedRequest && selectedRequest.id === requestId) {
      setSelectedRequest(null);
    }
    loadData();
  };

  const filtered = requests.filter((r) => {
    const matchSearch =
      r.request_number.toString().includes(search) ||
      r.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      r.customer_phone.includes(search) ||
      r.service_name.toLowerCase().includes(search.toLowerCase()) ||
      r.formatted_address.toLowerCase().includes(search.toLowerCase()) ||
      (r.district && r.district.toLowerCase().includes(search.toLowerCase()));

    if (!matchSearch) return false;

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
          if (a.matchesDistrict && !b.matchesDistrict) return -1;
          if (!a.matchesDistrict && b.matchesDistrict) return 1;
          if (a.availability === 'available' && b.availability !== 'available') return -1;
          if (a.availability !== 'available' && b.availability === 'available') return 1;
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
                onClick={() => setSelectedRequest(req)}
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

                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                        {req.service_name}
                      </span>
                      <span className="text-xs text-slate-500">
                        {req.preferred_date || 'Today'} · <strong className="text-slate-800">{req.district || 'Salem'}</strong>
                      </span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badge.className}`}>
                    {badge.label}
                  </span>
                </div>

                {isAssigned && req.assigned_worker_name && (
                  <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 text-xs rounded-xl flex items-center justify-between text-emerald-900">
                    <span>Assigned Tech: <strong>{req.assigned_worker_name}</strong></span>
                    <span className="text-[11px] text-emerald-700 font-bold">{req.assigned_worker_phone}</span>
                  </div>
                )}

                {/* Exactly Three Actions: Call, WhatsApp, Assign */}
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
                <span className="font-bold text-slate-900">{selectedRequest.district || 'Salem'}</span>
              </div>
              <div className="flex items-start justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-400 font-semibold shrink-0">Location:</span>
                <span className="font-medium text-slate-800 text-right">{selectedRequest.formatted_address}</span>
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
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-1">
                  <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                  <p className="text-xs font-bold text-slate-700">No matching technicians found</p>
                </div>
              ) : (
                recommendedTechnicians.map((tech) => (
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
