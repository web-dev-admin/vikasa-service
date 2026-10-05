'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { dataStore } from '@/lib/data/store';
import { VIKASA_CONFIG } from '@/lib/constants';
import { Worker, ServiceRequest } from '@/types';
import {
  PhoneCall,
  MessageCircle,
  MapPin,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
  UserCheck,
  ChevronLeft,
  Navigation,
  RefreshCw,
  AlertCircle,
  Wrench,
  Check,
} from 'lucide-react';
import { getTelUrl, getWhatsAppUrl } from '@/lib/utils/phone';

export default function TechnicianPortalPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [assignedJobs, setAssignedJobs] = useState<ServiceRequest[]>([]);
  const [completedJobs, setCompletedJobs] = useState<ServiceRequest[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadData = () => {
    const allWorkers = dataStore.getWorkers().filter((w) => w.verification_status === 'verified');
    setWorkers(allWorkers);

    const activeId = selectedWorkerId || allWorkers[0]?.id || '';
    if (activeId) {
      setSelectedWorkerId(activeId);
      const jobs = dataStore.getRequestsForWorker(activeId);
      setAssignedJobs(jobs.filter((j) => j.status === 'ASSIGNED' || j.status === 'IN_PROGRESS'));
      setCompletedJobs(jobs.filter((j) => j.status === 'COMPLETED'));
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedWorkerId]);

  const currentWorker = workers.find((w) => w.id === selectedWorkerId);

  // Update Technician Availability
  const handleAvailabilityChange = (newStatus: 'available' | 'busy' | 'offline') => {
    if (!selectedWorkerId) return;
    dataStore.updateWorkerAvailability(selectedWorkerId, newStatus);
    setStatusMessage(`Availability updated to ${newStatus.toUpperCase()}`);
    setTimeout(() => setStatusMessage(null), 2500);
    loadData();
  };

  // Mark Job Completed
  const handleCompleteJob = (requestId: string) => {
    dataStore.completeJob(requestId);
    setStatusMessage('Job marked as Completed! Your status is now set to Available.');
    setTimeout(() => setStatusMessage(null), 3000);
    loadData();
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-16">
      {/* Top Header */}
      <header className="bg-slate-900 text-white px-4 py-4 sticky top-0 z-30 shadow-md">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl overflow-hidden bg-slate-800 ring-1 ring-emerald-500/30 shrink-0">
              <Image
                src={VIKASA_CONFIG.logoPath}
                alt="Logo"
                width={32}
                height={32}
                className="object-cover w-full h-full"
              />
            </div>
            <div>
              <span className="font-black text-sm block tracking-tight">VIKASA</span>
              <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase block">
                Technician Portal
              </span>
            </div>
          </Link>

          <Link
            href="/"
            className="text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
        </div>
      </header>

      <main className="max-w-xl mx-auto p-4 space-y-4">
        {/* Toast Feedback */}
        {statusMessage && (
          <div className="p-3 bg-emerald-600 text-white text-xs font-bold rounded-2xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Technician Profile & Switcher */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Active Technician
            </span>
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <ShieldCheck className="w-3 h-3 text-emerald-600" />
              <span>Verified Pro</span>
            </div>
          </div>

          {/* Technician Selector */}
          <select
            value={selectedWorkerId}
            onChange={(e) => setSelectedWorkerId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold bg-slate-50 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            {workers.map((w) => (
              <option key={w.id} value={w.id}>
                {w.full_name} — {w.skills[0] || 'Technician'} ({w.district || 'Salem'})
              </option>
            ))}
          </select>

          {currentWorker && (
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Service Base:</span>
                <span className="font-bold text-slate-800">{currentWorker.base_location_name}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Registered District:</span>
                <span className="font-bold text-slate-800">{currentWorker.district || 'Salem'}</span>
              </div>

              {/* 3 Simple Availability Control Buttons */}
              <div className="pt-2">
                <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Update Availability Status
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleAvailabilityChange('available')}
                    className={`py-2.5 px-2 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      currentWorker.availability === 'available'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 ring-2 ring-emerald-500'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Available</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAvailabilityChange('busy')}
                    className={`py-2.5 px-2 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      currentWorker.availability === 'busy'
                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25 ring-2 ring-amber-400'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-amber-300" />
                    <span>Busy</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleAvailabilityChange('offline')}
                    className={`py-2.5 px-2 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      currentWorker.availability === 'offline'
                        ? 'bg-slate-800 text-white shadow-md ring-2 ring-slate-700'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span>Off Duty</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section: Today's Assigned Jobs */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>Today&apos;s Assigned Jobs</span>
            </h2>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
              {assignedJobs.length} Active
            </span>
          </div>

          {assignedJobs.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">No active jobs right now</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                You are currently set to <strong>{currentWorker?.availability.toUpperCase()}</strong>. When a coordinator assigns a job in your area, it will appear here immediately.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {assignedJobs.map((job) => {
                const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  job.formatted_address || `${job.latitude},${job.longitude}`
                )}`;

                return (
                  <div
                    key={job.id}
                    className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm space-y-4"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          #{job.request_number}
                        </span>
                        <h3 className="text-base font-black text-slate-900 mt-1">
                          {job.customer_name}
                        </h3>
                        <p className="text-xs font-bold text-emerald-700">
                          {job.service_name}
                        </p>
                      </div>

                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        In Progress
                      </span>
                    </div>

                    {/* Details */}
                    <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="font-medium text-slate-800">{job.formatted_address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Date: <strong>{job.preferred_date || 'Today'}</strong></span>
                      </div>
                      {job.description && (
                        <p className="text-[11px] text-slate-500 pt-1 border-t border-slate-200/60 mt-1 italic">
                          &quot;{job.description}&quot;
                        </p>
                      )}
                    </div>

                    {/* Action Buttons: Exactly Call, WhatsApp, Location, and Complete */}
                    <div className="grid grid-cols-3 gap-2">
                      <a
                        href={getTelUrl(job.customer_phone)}
                        className="py-2.5 px-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all text-center"
                      >
                        <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Call</span>
                      </a>

                      <a
                        href={getWhatsAppUrl(
                          job.customer_phone,
                          `Vanakkam ${job.customer_name}, I am ${currentWorker?.full_name}, your assigned VIKASA technician for ${job.service_name}. I am on my way to your location.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center justify-center gap-1.5 active:scale-95 transition-all text-center"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>WhatsApp</span>
                      </a>

                      <a
                        href={mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all text-center"
                      >
                        <Navigation className="w-3.5 h-3.5 text-slate-600" />
                        <span>Map</span>
                      </a>
                    </div>

                    {/* Mark Completed Button */}
                    <button
                      type="button"
                      onClick={() => handleCompleteJob(job.id)}
                      className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-98 transition-all cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Mark Work Completed</span>
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Section: Completed History */}
        {completedJobs.length > 0 && (
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">
              Completed Jobs ({completedJobs.length})
            </h3>
            <div className="space-y-2">
              {completedJobs.slice(0, 3).map((job) => (
                <div
                  key={job.id}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200 text-xs flex items-center justify-between text-slate-600"
                >
                  <div>
                    <span className="font-bold text-slate-900 block">{job.customer_name}</span>
                    <span className="text-[11px] text-slate-500">{job.service_name} • {job.district}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold">
                    Completed
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
