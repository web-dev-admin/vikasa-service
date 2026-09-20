'use client';

import React, { useState, useEffect, useRef } from 'react';
import { dataStore } from '@/lib/data/store';
import {
  ServiceRequest,
  Worker,
  MatchedWorker,
  WorkerContactAttempt,
  ContactResult,
  RequestStatus,
} from '@/types';
import { matchWorkers } from '@/lib/matching/algorithm';
import DispatchMap from '@/components/maps/DispatchMap';
import {
  Search,
  PhoneCall,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Flame,
  AlertCircle,
  User,
  ShieldCheck,
  ChevronRight,
  Filter,
  Check,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Map as MapIcon,
  List,
  RotateCcw,
  MessageCircle,
} from 'lucide-react';
import {
  getTelUrl,
  getWhatsAppUrl,
  generateCustomerWhatsAppMessage,
  generateWorkerDispatchWhatsAppMessage,
} from '@/lib/utils/phone';

export default function OperationsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusTab, setStatusTab] = useState<'ALL' | 'URGENT' | 'TO_CALL' | 'MATCHING' | 'ASSIGNED'>('ALL');
  const [searchRadiusKm, setSearchRadiusKm] = useState(15);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // Active call popover state for worker
  const [callingWorkerId, setCallingWorkerId] = useState<string | null>(null);
  const [callNotes, setCallNotes] = useState('');
  const [isConfirmingAssignment, setIsConfirmingAssignment] = useState<MatchedWorker | null>(null);

  // Active Customer call confirmation modal
  const [isConfirmingCustomer, setIsConfirmingCustomer] = useState(false);
  const [customerNotes, setCustomerNotes] = useState('');

  // Internal Notes input for active request
  const [newAdminNote, setNewAdminNote] = useState('');

  // Refresh data from store
  const refreshData = () => {
    const allReqs = dataStore.getRequests();
    const allWorkers = dataStore.getWorkers();
    setRequests(allReqs);
    setWorkers(allWorkers);

    if (!selectedRequestId && allReqs.length > 0) {
      setSelectedRequestId(allReqs[0].id);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const activeRequest = requests.find((r) => r.id === selectedRequestId) || requests[0];

  // Matched workers for active request
  const contactAttempts: WorkerContactAttempt[] = activeRequest
    ? dataStore.getContactAttemptsForRequest(activeRequest.id)
    : [];

  const matchedWorkers: MatchedWorker[] = activeRequest
    ? matchWorkers(
        activeRequest.service_id,
        activeRequest.latitude,
        activeRequest.longitude,
        workers,
        contactAttempts,
        searchRadiusKm
      )
    : [];

  // Filter requests for Queue Panel
  const filteredRequests = requests.filter((req) => {
    const matchesSearch =
      req.request_number.toString().includes(searchFilter) ||
      req.customer_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      req.service_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      req.customer_phone.includes(searchFilter);

    if (!matchesSearch) return false;

    if (statusTab === 'URGENT') return req.urgency === 'emergency' || req.urgency === 'high';
    if (statusTab === 'TO_CALL') return req.status === 'NEW' || req.status === 'CUSTOMER_TO_CALL';
    if (statusTab === 'MATCHING')
      return req.status === 'CUSTOMER_CONFIRMED' || req.status === 'MATCHING' || req.status === 'WORKER_CONTACTING';
    if (statusTab === 'ASSIGNED') return req.status === 'ASSIGNED' || req.status === 'IN_PROGRESS';
    return true;
  });

  // --- Handlers ---
  const handleCustomerConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRequest) return;
    dataStore.confirmCustomerRequirement(activeRequest.id, customerNotes);
    setIsConfirmingCustomer(false);
    setCustomerNotes('');
    refreshData();
  };

  const handleStartMatching = () => {
    if (!activeRequest) return;
    dataStore.updateRequestStatus(activeRequest.id, 'MATCHING', 'Operator opened matched worker radar.');
    refreshData();
  };

  const handleRecordWorkerCall = (result: ContactResult) => {
    if (!activeRequest || !callingWorkerId) return;

    dataStore.recordContactAttempt(activeRequest.id, callingWorkerId, result, callNotes);

    if (result === 'accepted') {
      const workerMatch = matchedWorkers.find((w) => w.worker_id === callingWorkerId);
      if (workerMatch) {
        setIsConfirmingAssignment(workerMatch);
      }
    } else {
      // Auto-advance to next worker: find next uncontacted worker in matched list
      const currentIndex = matchedWorkers.findIndex((w) => w.worker_id === callingWorkerId);
      const nextWorker = matchedWorkers[currentIndex + 1];
      if (nextWorker) {
        setCallingWorkerId(nextWorker.worker_id);
      } else {
        setCallingWorkerId(null);
      }
    }

    setCallNotes('');
    refreshData();
  };

  const handleConfirmAssignment = () => {
    if (!activeRequest || !isConfirmingAssignment) return;
    dataStore.assignWorker(activeRequest.id, isConfirmingAssignment.worker_id, 'Assigned via operator sequential dial.');
    setIsConfirmingAssignment(null);
    setCallingWorkerId(null);
    refreshData();
  };

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRequest || !newAdminNote.trim()) return;
    dataStore.updateRequestStatus(activeRequest.id, activeRequest.status, newAdminNote.trim());
    setNewAdminNote('');
    refreshData();
  };

  const handleCompleteJob = () => {
    if (!activeRequest) return;
    dataStore.completeJob(activeRequest.id);
    refreshData();
  };

  const getStatusBadge = (status: RequestStatus) => {
    switch (status) {
      case 'NEW':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">NEW</span>;
      case 'CUSTOMER_TO_CALL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse">CALL CUST</span>;
      case 'CUSTOMER_CONFIRMED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800">CONFIRMED</span>;
      case 'MATCHING':
      case 'WORKER_CONTACTING':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">CONTACTING</span>;
      case 'WORKER_ACCEPTED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">ACCEPTED</span>;
      case 'ASSIGNED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-700 text-white">ASSIGNED</span>;
      case 'IN_PROGRESS':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">IN PROGRESS</span>;
      case 'COMPLETED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700">COMPLETED</span>;
      case 'NO_WORKER_AVAILABLE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">NO WORKER</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-89px)] overflow-hidden bg-slate-100">
      {/* ========================================================================= */}
      {/* PANEL 1: REQUEST QUEUE (LEFT) */}
      {/* ========================================================================= */}
      <section aria-label="Request Queue" className="w-full lg:w-80 xl:w-96 bg-white border-r border-slate-200 flex flex-col shrink-0 h-full">
        {/* Header & Filter Tabs */}
        <div className="p-3 border-b border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <h1 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" /> Request Queue ({filteredRequests.length})
            </h1>
            <button
              onClick={() => {
                dataStore.resetDemoData();
                refreshData();
              }}
              title="Reset test data"
              className="text-[10px] text-slate-400 hover:text-slate-700 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search #, name, phone, service..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500/20 text-slate-800"
            />
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'TO_CALL', label: 'To Call' },
              { id: 'MATCHING', label: 'Matching' },
              { id: 'ASSIGNED', label: 'Assigned' },
              { id: 'URGENT', label: 'Urgent' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusTab(tab.id as typeof statusTab)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold whitespace-nowrap transition-colors ${
                  statusTab === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Requests Scroll List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {filteredRequests.map((req) => {
            const isSelected = req.id === activeRequest?.id;
            return (
              <button
                key={req.id}
                onClick={() => {
                  setSelectedRequestId(req.id);
                  setCallingWorkerId(null);
                }}
                className={`w-full p-3 rounded-xl text-left border transition-all relative ${
                  isSelected
                    ? 'bg-emerald-50/60 border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs font-bold text-slate-900">
                    #{req.request_number}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {(req.urgency === 'emergency' || req.urgency === 'high') && (
                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded border border-red-200">
                        <Flame className="w-3 h-3 text-red-500" />
                        {req.urgency.toUpperCase()}
                      </span>
                    )}
                    {getStatusBadge(req.status)}
                  </div>
                </div>

                <div className="text-xs font-bold text-slate-800 truncate">
                  {req.service_name}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                  <span className="font-medium text-slate-700">{req.customer_name}</span>
                  <span className="truncate max-w-[120px] text-right">{req.formatted_address.split(',')[0]}</span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 pt-1.5 border-t border-slate-100">
                  <span className="font-semibold text-emerald-700">{req.category_name}</span>
                  <span>{new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* PANEL 2: ACTIVE REQUEST & OPERATOR DISPATCH (CENTER) */}
      {/* ========================================================================= */}
      <section aria-label="Active Request Details" className="flex-1 bg-slate-50 border-r border-slate-200 flex flex-col h-full overflow-y-auto">
        {activeRequest ? (
          <div className="p-4 sm:p-6 space-y-5 max-w-2xl mx-auto w-full">
            {/* Top Details Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-400">
                      REQUEST #{activeRequest.request_number}
                    </span>
                    {getStatusBadge(activeRequest.status)}
                  </div>
                  <h2 className="text-xl font-black text-slate-900 mt-1">
                    {activeRequest.service_name}
                  </h2>
                </div>

                {/* Marketing Attribution Tag */}
                {activeRequest.utm_campaign && (
                  <div className="bg-purple-50 border border-purple-200 text-purple-800 px-2.5 py-1 rounded-lg text-xs font-medium">
                    <span className="font-bold text-purple-900 block text-[10px] uppercase">
                      Meta Ad Campaign:
                    </span>
                    {activeRequest.utm_campaign}
                  </div>
                )}
              </div>

              {/* Customer Contact Call Block */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-slate-400 font-semibold uppercase">Customer</div>
                  <div className="text-sm font-bold text-slate-900">{activeRequest.customer_name}</div>
                  <div className="text-xs font-mono text-emerald-800 font-semibold mt-0.5">
                    {activeRequest.customer_phone}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={getTelUrl(activeRequest.customer_phone)}
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                    title="Call customer via phone"
                  >
                    <PhoneCall className="w-3.5 h-3.5" />
                    <span>CALL</span>
                  </a>

                  <a
                    href={getWhatsAppUrl(
                      activeRequest.customer_phone,
                      generateCustomerWhatsAppMessage(
                        activeRequest.customer_name,
                        activeRequest.request_number,
                        activeRequest.service_name
                      )
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                    title="Send WhatsApp message to customer"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WHATSAPP</span>
                  </a>

                  {!activeRequest.customer_confirmed && (
                    <button
                      onClick={() => setIsConfirmingCustomer(true)}
                      className="px-3 py-2 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 hover:bg-teal-100 font-bold text-xs flex items-center gap-1 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirm Req</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Requirement Description */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-400 uppercase">Requirement Note</span>
                <p className="text-xs text-slate-800 bg-amber-50/50 p-3 rounded-xl border border-amber-100 leading-relaxed font-medium">
                  {activeRequest.description}
                </p>
              </div>

              {/* Location & Preferred Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                    Location Pin
                  </span>
                  <div className="font-semibold text-slate-800 flex items-start gap-1">
                    <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                    <span>{activeRequest.formatted_address}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                    Customer Preferred Time
                  </span>
                  <div className="font-semibold text-slate-800 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{activeRequest.preferred_time_slot || 'ASAP'}</span>
                  </div>
                </div>
              </div>

              {/* Workflow Next Step Trigger */}
              <div className="pt-2 flex flex-wrap items-center gap-2">
                {activeRequest.status === 'NEW' || activeRequest.status === 'CUSTOMER_TO_CALL' ? (
                  <button
                    onClick={() => setIsConfirmingCustomer(true)}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Step 1: Confirm Customer Requirement</span>
                  </button>
                ) : activeRequest.status === 'CUSTOMER_CONFIRMED' ? (
                  <button
                    onClick={handleStartMatching}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Step 2: Match & Dial Nearby Workers</span>
                  </button>
                ) : activeRequest.status === 'ASSIGNED' ? (
                  <div className="w-full p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-800 uppercase">Assigned Professional</span>
                      <div className="text-sm font-bold text-emerald-950">
                        {activeRequest.assigned_worker_name}
                      </div>
                    </div>
                    <button
                      onClick={handleCompleteJob}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                    >
                      Mark Job Completed
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Sequential Worker Contact Log Timeline */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Sequential Worker Contact History ({contactAttempts.length})
                </h3>
              </div>

              {contactAttempts.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">
                  No workers contacted yet. Select a worker on the right panel to begin sequential dialing.
                </p>
              ) : (
                <div className="space-y-2">
                  {contactAttempts.map((attempt) => {
                    const isAccepted = attempt.result === 'accepted';
                    return (
                      <div
                        key={attempt.id}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                          isAccepted
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-medium'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                            #{attempt.attempt_number}
                          </span>
                          <div>
                            <span className="font-bold">{attempt.worker_name}</span>
                            <span className="text-[10px] text-slate-500 ml-2">
                              {new Date(attempt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {attempt.notes && (
                              <div className="text-[11px] text-slate-500 italic mt-0.5">
                                &quot;{attempt.notes}&quot;
                              </div>
                            )}
                          </div>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isAccepted
                              ? 'bg-emerald-600 text-white'
                              : attempt.result === 'rejected'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {attempt.result.replace('_', ' ')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Internal Operator Notes */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" /> Internal Notes
              </h3>

              {activeRequest.admin_notes && (
                <div className="text-xs text-slate-600 whitespace-pre-line bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  {activeRequest.admin_notes}
                </div>
              )}

              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add internal dispatcher note..."
                  value={newAdminNote}
                  onChange={(e) => setNewAdminNote(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-800"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold"
                >
                  Save Note
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-slate-400 text-xs">
            Select a request from the left queue to view details.
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* PANEL 3: MATCHED WORKERS & SEQUENTIAL CALLING (RIGHT) */}
      {/* ========================================================================= */}
      <section aria-label="Matched Workers" className="w-full lg:w-96 xl:w-[440px] bg-white border-l border-slate-200 flex flex-col shrink-0 h-full">
        {/* Header with Radius & View Mode */}
        <div className="p-3 border-b border-slate-200 flex items-center justify-between gap-2">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Matched Workers ({matchedWorkers.length})
            </h2>
            <div className="text-[10px] text-slate-400">
              PostGIS Distance Rank • Available & Verified
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Radius Selector */}
            <select
              value={searchRadiusKm}
              onChange={(e) => setSearchRadiusKm(Number(e.target.value))}
              aria-label="Search Radius"
              className="text-xs font-semibold px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700"
            >
              <option value={5}>5 km</option>
              <option value={10}>10 km</option>
              <option value={15}>15 km</option>
              <option value={25}>25 km</option>
            </select>

            {/* Split View Toggle */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
              <button
                onClick={() => setViewMode('list')}
                title="List View"
                aria-label="List View"
                className={`p-1 rounded ${viewMode === 'list' ? 'bg-white shadow-xs font-bold text-slate-900' : 'text-slate-500'}`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode('map')}
                title="Map View"
                aria-label="Map View"
                className={`p-1 rounded ${viewMode === 'map' ? 'bg-white shadow-xs font-bold text-slate-900' : 'text-slate-500'}`}
              >
                <MapIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* View Mode: Map vs List */}
        {viewMode === 'map' && activeRequest ? (
          <div className="h-64 border-b border-slate-200 shrink-0">
            <DispatchMap
              customerLat={activeRequest.latitude}
              customerLon={activeRequest.longitude}
              customerName={activeRequest.customer_name}
              customerAddress={activeRequest.formatted_address}
              workers={matchedWorkers}
              searchRadiusKm={searchRadiusKm}
              selectedWorkerId={callingWorkerId || undefined}
            />
          </div>
        ) : null}

        {/* Worker Cards Scroll List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {matchedWorkers.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs space-y-2">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
              <p className="font-semibold text-slate-700">No exact matches within {searchRadiusKm} km.</p>
              <p>Try expanding the search radius using the dropdown above.</p>
              <button
                onClick={() => setSearchRadiusKm(25)}
                className="mt-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-xs"
              >
                Expand to 25 km
              </button>
            </div>
          ) : (
            matchedWorkers.map((worker, index) => {
              const isBeingCalled = callingWorkerId === worker.worker_id;
              const hasAttempt = worker.has_been_contacted;

              return (
                <div
                  key={worker.worker_id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isBeingCalled
                      ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-300 shadow-md'
                      : hasAttempt
                      ? worker.last_contact_result === 'accepted'
                        ? 'bg-emerald-50 border-emerald-300'
                        : 'bg-slate-50 border-slate-200 opacity-70'
                      : index === 0
                      ? 'bg-white border-emerald-400 shadow-sm ring-1 ring-emerald-300'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  {/* Top line: Name & Rank */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        #{index + 1}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                          {worker.full_name}
                          <span className="w-2 h-2 rounded-full bg-emerald-500" title="Verified & Available" />
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          {worker.experience_years} yrs exp • {worker.base_location_name}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono font-bold text-xs text-slate-900 block">
                        {worker.distance_km} km
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        {worker.match_category}
                      </span>
                    </div>
                  </div>

                  {/* Match Factors */}
                  <div className="mt-2 text-[10px] text-slate-600 flex flex-wrap gap-1.5">
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">✓ Exact Service</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">✓ Verified</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">✓ Available</span>
                    <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">Radius: {worker.service_radius_km}km</span>
                  </div>

                  {/* Call Action Bar */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100">
                    {hasAttempt && !isBeingCalled ? (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-500">
                          Result: <span className="font-bold uppercase text-slate-800">{worker.last_contact_result}</span>
                        </span>
                        <button
                          onClick={() => setCallingWorkerId(worker.worker_id)}
                          className="text-xs text-emerald-700 hover:underline font-semibold"
                        >
                          Redial Worker
                        </button>
                      </div>
                    ) : isBeingCalled ? (
                      /* Active Outcome Selector */
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                            <PhoneCall className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
                            Contacting: {worker.phone}
                          </span>
                          <div className="flex items-center gap-2">
                            <a
                              href={getTelUrl(worker.phone)}
                              className="text-[11px] font-bold text-emerald-700 underline"
                            >
                              Dialer
                            </a>
                            <a
                              href={getWhatsAppUrl(
                                worker.phone,
                                generateWorkerDispatchWhatsAppMessage(
                                  worker.full_name,
                                  activeRequest.service_name,
                                  activeRequest.formatted_address.split(',')[0],
                                  worker.distance_km
                                )
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-bold text-emerald-700 flex items-center gap-0.5 underline"
                            >
                              <MessageCircle className="w-3 h-3" /> WhatsApp
                            </a>
                          </div>
                        </div>

                        <input
                          type="text"
                          placeholder="Quick note (e.g. Quoted ₹400, free at 6PM)"
                          value={callNotes}
                          onChange={(e) => setCallNotes(e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 bg-white"
                        />

                        <div className="grid grid-cols-4 gap-1 pt-1">
                          <button
                            onClick={() => handleRecordWorkerCall('accepted')}
                            className="py-1.5 px-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold text-center"
                          >
                            ACCEPTED
                          </button>
                          <button
                            onClick={() => handleRecordWorkerCall('rejected')}
                            className="py-1.5 px-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-[10px] font-bold text-center"
                          >
                            REJECTED
                          </button>
                          <button
                            onClick={() => handleRecordWorkerCall('no_answer')}
                            className="py-1.5 px-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-[10px] font-bold text-center"
                          >
                            NO ANSWER
                          </button>
                          <button
                            onClick={() => handleRecordWorkerCall('busy')}
                            className="py-1.5 px-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-[10px] font-bold text-center"
                          >
                            BUSY
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Default Call & WhatsApp Worker Buttons */
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            setCallingWorkerId(worker.worker_id);
                            window.open(getTelUrl(worker.phone));
                          }}
                          className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all ${
                            index === 0
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-slate-900 hover:bg-slate-800 text-white'
                          }`}
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>CALL</span>
                        </button>

                        <a
                          href={getWhatsAppUrl(
                            worker.phone,
                            generateWorkerDispatchWhatsAppMessage(
                              worker.full_name,
                              activeRequest.service_name,
                              activeRequest.formatted_address.split(',')[0],
                              worker.distance_km
                            )
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setCallingWorkerId(worker.worker_id)}
                          className="py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm transition-all"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span>WHATSAPP</span>
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* MODAL: CONFIRM CUSTOMER REQUIREMENT */}
      {/* ========================================================================= */}
      {isConfirmingCustomer && activeRequest && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Confirm Requirement with Customer
            </h3>
            <p className="text-xs text-slate-600">
              Confirm you have spoken with <span className="font-bold text-slate-900">{activeRequest.customer_name}</span> at{' '}
              <span className="font-mono text-emerald-800 font-bold">{activeRequest.customer_phone}</span>.
            </p>

            <form onSubmit={handleCustomerConfirm} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Operator Confirmation Notes
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Spoke with customer. Leak is under sink, pipe collar broken. Customer is at home and wants repair this evening."
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsConfirmingCustomer(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
                >
                  Confirm & Advance to Worker Match
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ASSIGN WORKER CONFIRMATION */}
      {/* ========================================================================= */}
      {isConfirmingAssignment && activeRequest && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-black text-slate-900">
              Assign {isConfirmingAssignment.full_name}?
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              Assign this professional to <span className="font-bold">Request #{activeRequest.request_number}</span> ({activeRequest.service_name}).
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-left space-y-1 text-slate-700">
              <div>• Distance: <span className="font-bold">{isConfirmingAssignment.distance_km} km</span></div>
              <div>• Experience: <span className="font-bold">{isConfirmingAssignment.experience_years} years</span></div>
              <div>• Worker will be automatically marked as <span className="font-bold text-amber-700">BUSY</span></div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmingAssignment(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200"
              >
                No, Choose Another
              </button>
              <button
                type="button"
                onClick={handleConfirmAssignment}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
