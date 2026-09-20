'use client';

import React, { useState, useEffect } from 'react';
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
  ArrowLeft,
  ChevronLeft,
  Calendar,
  AlertTriangle,
  Info,
  Phone,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  getTelUrl,
  getWhatsAppUrl,
  generateCustomerWhatsAppMessage,
  generateWorkerDispatchWhatsAppMessage,
} from '@/lib/utils/phone';

type MobileActiveTab = 'queue' | 'details' | 'workers';

export default function OperationsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusTab, setStatusTab] = useState<'ALL' | 'URGENT' | 'TO_CALL' | 'MATCHING' | 'ASSIGNED'>('ALL');
  const [searchRadiusKm, setSearchRadiusKm] = useState(15);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

  // Mobile segmented view state
  const [mobileTab, setMobileTab] = useState<MobileActiveTab>('queue');

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
  const handleSelectRequest = (id: string) => {
    setSelectedRequestId(id);
    setCallingWorkerId(null);
    setMobileTab('details');
  };

  const handleCustomerConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRequest) return;
    dataStore.confirmCustomerRequirement(activeRequest.id, customerNotes || 'Customer confirmed requirement on call.');
    setIsConfirmingCustomer(false);
    setCustomerNotes('');
    refreshData();
  };

  const handleStartMatching = () => {
    if (!activeRequest) return;
    dataStore.updateRequestStatus(activeRequest.id, 'MATCHING', 'Operator opened matched worker radar.');
    refreshData();
    setMobileTab('workers');
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
    setMobileTab('details');
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
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">1. NEW LEAD</span>;
      case 'CUSTOMER_TO_CALL':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse">2. CALL CUSTOMER</span>;
      case 'CUSTOMER_CONFIRMED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">3. CONFIRMED</span>;
      case 'MATCHING':
      case 'WORKER_CONTACTING':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">3. DIALING WORKER</span>;
      case 'WORKER_ACCEPTED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">ACCEPTED</span>;
      case 'ASSIGNED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-700 text-white">4. ASSIGNED</span>;
      case 'IN_PROGRESS':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">IN PROGRESS</span>;
      case 'COMPLETED':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">COMPLETED</span>;
      case 'NO_WORKER_AVAILABLE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">NO WORKER</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  // Step Calculation for Progress Bar
  const getStepProgress = (req: ServiceRequest) => {
    if (req.status === 'NEW' || req.status === 'CUSTOMER_TO_CALL') return 1;
    if (req.status === 'CUSTOMER_CONFIRMED' || req.status === 'MATCHING' || req.status === 'WORKER_CONTACTING') return 2;
    if (req.status === 'ASSIGNED' || req.status === 'IN_PROGRESS') return 3;
    if (req.status === 'COMPLETED') return 4;
    return 1;
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-105px)] lg:h-[calc(100vh-85px)] overflow-hidden bg-slate-100">
      {/* ========================================================================= */}
      {/* MOBILE SEGMENTED BAR (VISIBLE ONLY ON MOBILE & TABLET) */}
      {/* ========================================================================= */}
      <div className="lg:hidden bg-white border-b border-slate-200 px-3 py-2 shrink-0">
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setMobileTab('queue')}
            className={`py-2 px-1 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mobileTab === 'queue'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>📋 Leads</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700">
              {filteredRequests.length}
            </span>
          </button>

          <button
            onClick={() => setMobileTab('details')}
            className={`py-2 px-1 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mobileTab === 'details'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>📝 Details</span>
            {activeRequest && (
              <span className="text-[10px] font-mono text-emerald-700">
                #{activeRequest.request_number}
              </span>
            )}
          </button>

          <button
            onClick={() => setMobileTab('workers')}
            className={`py-2 px-1 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              mobileTab === 'workers'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>👷 Workers</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
              {matchedWorkers.length}
            </span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
        {/* ========================================================================= */}
        {/* PANEL 1: REQUEST QUEUE (LEFT ON DESKTOP, TAB ON MOBILE) */}
        {/* ========================================================================= */}
        <section
          aria-label="Request Queue"
          className={`${
            mobileTab === 'queue' ? 'flex' : 'hidden'
          } lg:flex w-full lg:w-80 xl:w-96 bg-white border-r border-slate-200 flex-col shrink-0 h-full`}
        >
          {/* Header & Filter Tabs */}
          <div className="p-3 border-b border-slate-200 space-y-2 bg-slate-50/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <h1 className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Incoming Leads ({filteredRequests.length})
                </h1>
              </div>
              <button
                onClick={() => {
                  dataStore.resetDemoData();
                  refreshData();
                }}
                title="Reset sample data"
                className="text-[11px] text-slate-400 hover:text-slate-800 flex items-center gap-1 font-medium"
              >
                <RotateCcw className="w-3 h-3" /> Reset Demo
              </button>
            </div>

            {/* Search bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search lead #, name, phone, area..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500/20 text-slate-800"
              />
            </div>

            {/* Quick Filter Buttons */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'TO_CALL', label: '📞 Call Cust' },
                { id: 'MATCHING', label: '👷 Call Worker' },
                { id: 'ASSIGNED', label: '✅ Active' },
                { id: 'URGENT', label: '🚨 Urgent' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusTab(tab.id as typeof statusTab)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors ${
                    statusTab === tab.id
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Requests Scroll List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {filteredRequests.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs space-y-2">
                <Info className="w-6 h-6 text-slate-300 mx-auto" />
                <p>No requests found matching current filter.</p>
              </div>
            ) : (
              filteredRequests.map((req) => {
                const isSelected = req.id === activeRequest?.id;
                const isUrgent = req.urgency === 'emergency' || req.urgency === 'high';

                return (
                  <button
                    key={req.id}
                    onClick={() => handleSelectRequest(req.id)}
                    className={`w-full p-3 rounded-2xl text-left border transition-all relative ${
                      isSelected
                        ? 'bg-emerald-50/80 border-emerald-500 shadow-sm ring-2 ring-emerald-500/20'
                        : isUrgent
                        ? 'bg-red-50/40 border-red-200 hover:border-red-300'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-black text-slate-900">
                        #{req.request_number}
                      </span>
                      <div className="flex items-center gap-1.5">
                        {isUrgent && (
                          <span className="flex items-center gap-0.5 text-[10px] font-black text-red-600 bg-red-100/80 px-1.5 py-0.2 rounded">
                            <Flame className="w-3 h-3 text-red-500" />
                            {req.urgency.toUpperCase()}
                          </span>
                        )}
                        {getStatusBadge(req.status)}
                      </div>
                    </div>

                    <div className="text-xs font-extrabold text-slate-900 truncate mt-0.5">
                      {req.service_name}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                      <span className="font-bold text-slate-700">{req.customer_name}</span>
                      <span className="truncate max-w-[120px] text-right font-medium">
                        {req.formatted_address.split(',')[0]}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 pt-1.5 border-t border-slate-100">
                      <span className="font-semibold text-emerald-700">{req.category_name}</span>
                      <span>{new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* PANEL 2: ACTIVE REQUEST & OPERATOR DISPATCH (CENTER) */}
        {/* ========================================================================= */}
        <section
          aria-label="Active Request Details"
          className={`${
            mobileTab === 'details' ? 'flex' : 'hidden'
          } lg:flex flex-1 bg-slate-100 lg:border-r border-slate-200 flex-col h-full overflow-y-auto`}
        >
          {activeRequest ? (
            <div className="p-3 sm:p-5 space-y-4 max-w-3xl mx-auto w-full">
              {/* Mobile back button to queue */}
              <div className="lg:hidden flex items-center justify-between pb-1">
                <button
                  onClick={() => setMobileTab('queue')}
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-2.5 py-1.5 rounded-lg border border-slate-200"
                >
                  <ChevronLeft className="w-4 h-4" /> Back to Leads
                </button>
                <button
                  onClick={() => setMobileTab('workers')}
                  className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200"
                >
                  Find Technicians ({matchedWorkers.length}) <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* 4-Step Progress Tracker */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                <div className="flex items-center justify-between mb-3 text-xs">
                  <span className="font-bold text-slate-700">Dispatch Workflow Progress</span>
                  <span className="text-[11px] font-mono text-emerald-700 font-bold">
                    Step {getStepProgress(activeRequest)} of 4
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1.5 text-center">
                  <div className={`p-2 rounded-xl text-[10px] font-bold transition-all ${
                    getStepProgress(activeRequest) >= 1 ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-400'
                  }`}>
                    1. Lead In
                  </div>
                  <div className={`p-2 rounded-xl text-[10px] font-bold transition-all ${
                    getStepProgress(activeRequest) >= 2 ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-400'
                  }`}>
                    2. Call Cust
                  </div>
                  <div className={`p-2 rounded-xl text-[10px] font-bold transition-all ${
                    getStepProgress(activeRequest) >= 3 ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-400'
                  }`}>
                    3. Assign Tech
                  </div>
                  <div className={`p-2 rounded-xl text-[10px] font-bold transition-all ${
                    getStepProgress(activeRequest) >= 4 ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-400'
                  }`}>
                    4. Done
                  </div>
                </div>
              </div>

              {/* Top Details Card */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-500">
                        LEAD #{activeRequest.request_number}
                      </span>
                      {getStatusBadge(activeRequest.status)}
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                      {activeRequest.service_name}
                    </h2>
                  </div>

                  {/* Urgency Pill */}
                  <div className="flex items-center gap-1.5">
                    {activeRequest.urgency === 'emergency' ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-black bg-red-600 text-white flex items-center gap-1 shadow-xs">
                        <Flame className="w-3.5 h-3.5" /> Emergency Lead
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                        {activeRequest.urgency.toUpperCase()} Priority
                      </span>
                    )}
                  </div>
                </div>

                {/* Customer Contact Call Block */}
                <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-emerald-50/30 border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Customer Details</div>
                      <div className="text-base font-black text-slate-900">{activeRequest.customer_name}</div>
                      <div className="text-xs font-mono text-emerald-800 font-bold mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {activeRequest.customer_phone}
                      </div>
                    </div>

                    {/* Quick Dial Buttons */}
                    <div className="flex items-center gap-2">
                      <a
                        href={getTelUrl(activeRequest.customer_phone)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                        title="Call customer directly via phone dialer"
                      >
                        <PhoneCall className="w-4 h-4" />
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
                        className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                        title="Send pre-filled WhatsApp message"
                      >
                        <MessageCircle className="w-4 h-4 text-emerald-600" />
                        <span>WHATSAPP</span>
                      </a>
                    </div>
                  </div>

                  {/* Requirement confirmation helper */}
                  {!activeRequest.customer_confirmed ? (
                    <div className="pt-2 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-[11px] text-amber-900 font-medium flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        Customer not yet verified by phone.
                      </span>
                      <button
                        onClick={() => setIsConfirmingCustomer(true)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Confirm Requirement</span>
                      </button>
                    </div>
                  ) : (
                    <div className="pt-2 border-t border-slate-200/80 flex items-center gap-1.5 text-xs text-emerald-800 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Customer requirement verified on call</span>
                    </div>
                  )}
                </div>

                {/* Requirement Description */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Customer Problem Description
                  </span>
                  <p className="text-xs text-slate-800 bg-amber-50/60 p-3.5 rounded-xl border border-amber-200/60 leading-relaxed font-medium">
                    &quot;{activeRequest.description}&quot;
                  </p>
                </div>

                {/* Location & Preferred Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Customer Address
                    </span>
                    <div className="font-semibold text-slate-800 flex items-start gap-1.5">
                      <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <span>{activeRequest.formatted_address}</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                      Preferred Time Slot
                    </span>
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span>{activeRequest.preferred_time_slot || 'As Soon As Possible (Immediate)'}</span>
                    </div>
                  </div>
                </div>

                {/* Workflow Big Action Trigger */}
                <div className="pt-2">
                  {activeRequest.status === 'NEW' || activeRequest.status === 'CUSTOMER_TO_CALL' ? (
                    <button
                      onClick={() => setIsConfirmingCustomer(true)}
                      className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99]"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>Step 1: Call Customer & Confirm Details</span>
                    </button>
                  ) : activeRequest.status === 'CUSTOMER_CONFIRMED' || activeRequest.status === 'MATCHING' || activeRequest.status === 'WORKER_CONTACTING' ? (
                    <button
                      onClick={handleStartMatching}
                      className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all active:scale-[0.99]"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Step 2: Dial & Assign Nearest Technician ({matchedWorkers.length} Found)</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : activeRequest.status === 'ASSIGNED' || activeRequest.status === 'IN_PROGRESS' ? (
                    <div className="w-full p-4 rounded-2xl bg-emerald-50 border border-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">
                          Assigned Professional
                        </span>
                        <div className="text-base font-black text-emerald-950 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          {activeRequest.assigned_worker_name}
                        </div>
                      </div>
                      <button
                        onClick={handleCompleteJob}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition-colors"
                      >
                        ✓ Mark Job Completed
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold text-center">
                      Job Completed & Ticket Closed
                    </div>
                  )}
                </div>
              </div>

              {/* Worker Contact History Timeline */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    Technician Dial History ({contactAttempts.length})
                  </h3>
                </div>

                {contactAttempts.length === 0 ? (
                  <p className="text-xs text-slate-400 italic py-2">
                    No technicians contacted yet. Click &quot;Dial &amp; Assign Technician&quot; to pick from the list.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {contactAttempts.map((attempt) => {
                      const isAccepted = attempt.result === 'accepted';
                      return (
                        <div
                          key={attempt.id}
                          className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                            isAccepted
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-medium'
                              : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
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
                            className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
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
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-slate-400" /> Dispatcher Notes
                </h3>

                {activeRequest.admin_notes && (
                  <div className="text-xs text-slate-700 whitespace-pre-line bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed font-medium">
                    {activeRequest.admin_notes}
                  </div>
                )}

                <form onSubmit={handleAddNote} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add internal note..."
                    value={newAdminNote}
                    onChange={(e) => setNewAdminNote(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-white"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shrink-0"
                  >
                    Save
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
        <section
          aria-label="Matched Workers"
          className={`${
            mobileTab === 'workers' ? 'flex' : 'hidden'
          } lg:flex w-full lg:w-96 xl:w-[440px] bg-white border-l border-slate-200 flex-col shrink-0 h-full`}
        >
          {/* Header with Radius & View Mode */}
          <div className="p-3 border-b border-slate-200 flex items-center justify-between gap-2 bg-slate-50/50">
            <div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setMobileTab('details')}
                  className="lg:hidden p-1 rounded hover:bg-slate-200 text-slate-600"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Technician Radar ({matchedWorkers.length})
                </h2>
              </div>
              <div className="text-[10px] text-slate-500 hidden sm:block">
                Ranked by distance from customer
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Radius Selector */}
              <select
                value={searchRadiusKm}
                onChange={(e) => setSearchRadiusKm(Number(e.target.value))}
                aria-label="Search Radius"
                className="text-xs font-bold px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-700"
              >
                <option value={5}>5 km radius</option>
                <option value={10}>10 km radius</option>
                <option value={15}>15 km radius</option>
                <option value={25}>25 km radius</option>
              </select>

              {/* View Toggle */}
              <div className="flex items-center bg-slate-200/80 rounded-lg p-0.5">
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
                <p className="font-bold text-slate-800">No technicians found within {searchRadiusKm} km.</p>
                <p>Try expanding the search radius to 25 km.</p>
                <button
                  onClick={() => setSearchRadiusKm(25)}
                  className="mt-2 px-3.5 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs"
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
                        ? 'bg-amber-50/90 border-amber-500 ring-2 ring-amber-300 shadow-md'
                        : hasAttempt
                        ? worker.last_contact_result === 'accepted'
                          ? 'bg-emerald-50 border-emerald-300'
                          : 'bg-slate-50 border-slate-200 opacity-75'
                        : index === 0
                        ? 'bg-white border-emerald-400 shadow-xs ring-1 ring-emerald-300'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    {/* Top line: Name & Rank */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shrink-0">
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
                        <span className="font-mono font-black text-xs text-slate-900 block">
                          {worker.distance_km} km
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                          {worker.match_category}
                        </span>
                      </div>
                    </div>

                    {/* Match Factors */}
                    <div className="mt-2 text-[10px] text-slate-600 flex flex-wrap gap-1">
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">✓ Verified</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">✓ Available</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">Radius: {worker.service_radius_km}km</span>
                    </div>

                    {/* Call Action Bar */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100">
                      {hasAttempt && !isBeingCalled ? (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[11px] text-slate-500">
                            Outcome: <span className="font-bold uppercase text-slate-900">{worker.last_contact_result}</span>
                          </span>
                          <button
                            onClick={() => setCallingWorkerId(worker.worker_id)}
                            className="text-xs text-emerald-700 hover:underline font-bold"
                          >
                            Redial Worker
                          </button>
                        </div>
                      ) : isBeingCalled ? (
                        /* Active Outcome Selector */
                        <div className="space-y-2 pt-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-950 flex items-center gap-1">
                              <PhoneCall className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
                              Dialing: {worker.phone}
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
                            placeholder="Call note (e.g. Quoted ₹400, reaching in 30 mins)"
                            value={callNotes}
                            onChange={(e) => setCallNotes(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-900 bg-white"
                          />

                          <div className="grid grid-cols-4 gap-1 pt-1">
                            <button
                              onClick={() => handleRecordWorkerCall('accepted')}
                              className="py-2 px-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black text-center shadow-xs"
                            >
                              ACCEPTED ✅
                            </button>
                            <button
                              onClick={() => handleRecordWorkerCall('rejected')}
                              className="py-2 px-1 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg text-[10px] font-bold text-center"
                            >
                              REJECTED ❌
                            </button>
                            <button
                              onClick={() => handleRecordWorkerCall('no_answer')}
                              className="py-2 px-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-[10px] font-bold text-center"
                            >
                              NO ANSWER 📵
                            </button>
                            <button
                              onClick={() => handleRecordWorkerCall('busy')}
                              className="py-2 px-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-[10px] font-bold text-center"
                            >
                              BUSY ⏳
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
                            className={`py-2 px-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all ${
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
                            className="py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs transition-all"
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
      </div>

      {/* ========================================================================= */}
      {/* MODAL: CONFIRM CUSTOMER REQUIREMENT */}
      {/* ========================================================================= */}
      {isConfirmingCustomer && activeRequest && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Confirm Requirement with Customer
            </h3>
            <p className="text-xs text-slate-600">
              Confirm you spoke with <strong className="text-slate-900">{activeRequest.customer_name}</strong> at{' '}
              <strong className="font-mono text-emerald-800">{activeRequest.customer_phone}</strong>.
            </p>

            <form onSubmit={handleCustomerConfirm} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Operator Notes (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Spoke with customer. Issue verified, customer is at home and wants technician this evening."
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
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-black text-slate-900">
              Assign {isConfirmingAssignment.full_name}?
            </h3>

            <p className="text-xs text-slate-600 leading-relaxed">
              Assign this technician to <strong className="text-slate-900">Lead #{activeRequest.request_number}</strong> ({activeRequest.service_name}).
            </p>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-left space-y-1 text-slate-700 font-medium">
              <div>• Distance: <strong className="text-slate-900">{isConfirmingAssignment.distance_km} km away</strong></div>
              <div>• Experience: <strong className="text-slate-900">{isConfirmingAssignment.experience_years} years</strong></div>
              <div>• Location: <strong className="text-slate-900">{isConfirmingAssignment.base_location_name}</strong></div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmingAssignment(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200"
              >
                Cancel
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
