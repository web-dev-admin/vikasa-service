'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { dataStore } from '@/lib/data/store';
import { PublicTrackingData } from '@/types';
import { getWhatsAppUrl } from '@/lib/utils/phone';
import Link from 'next/link';
import {
  CheckCircle2,
  Clock,
  MapPin,
  PhoneCall,
  ShieldCheck,
  ChevronLeft,
  AlertCircle,
  MessageCircle,
} from 'lucide-react';

export default function TrackRequestPage() {
  const params = useParams();
  const token = params?.id as string;
  const [data, setData] = useState<PublicTrackingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      // Secure public projection query - strictly returns non-sensitive data
      const tracking = dataStore.getPublicTrackingStatus(token);
      setData(tracking);
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-md text-center max-w-sm w-full space-y-3">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <h1 className="text-base font-bold text-slate-900">Request Not Found</h1>
          <p className="text-xs text-slate-500 leading-relaxed">
            The tracking token provided is invalid or has expired. For your security, service tracking links are private and non-guessable.
          </p>
          <div className="pt-2 space-y-2">
            <Link
              href="/request"
              className="block w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all"
            >
              Submit a Service Request
            </Link>
            <Link
              href="/"
              className="block w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Progress Steps
  const steps = [
    {
      title: 'Request Received',
      desc: 'Requirement logged in dispatch system',
      done: true,
    },
    {
      title: 'Operator Review & Verification',
      desc: 'VIKASA coordinator verifies details over phone',
      done: data.status !== 'NEW',
      current: data.status === 'CUSTOMER_TO_CALL' || data.status === 'NEW',
    },
    {
      title: 'Technician Matching',
      desc: 'Finding closest verified local professional',
      done: ['ASSIGNED', 'IN_PROGRESS', 'COMPLETED'].includes(data.status),
      current: ['CUSTOMER_CONFIRMED', 'MATCHING', 'WORKER_CONTACTING'].includes(data.status),
    },
    {
      title: 'Professional Dispatched',
      desc: data.assigned_worker_first_name
        ? `Assigned: ${data.assigned_worker_first_name} (VIKASA Specialist)`
        : 'Nearby specialist confirmed for appointment',
      done: ['IN_PROGRESS', 'COMPLETED'].includes(data.status),
      current: data.status === 'ASSIGNED',
    },
    {
      title: 'Service Completed',
      desc: 'Work verified & closed',
      done: data.status === 'COMPLETED',
      current: data.status === 'IN_PROGRESS',
    },
  ];

  const whatsappHelpUrl = getWhatsAppUrl(
    '914272334455',
    `Hello VIKASA, checking status on my service request #${data.request_number} (${data.service_name}).`
  );

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-md mx-auto space-y-5">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Home
        </Link>

        {/* Status Header */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Service Status
            </span>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              #{data.request_number}
            </span>
          </div>

          <div>
            <h1 className="text-xl font-black text-slate-900">
              {data.service_name}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Service Area: <strong className="text-slate-700">{data.general_area}</strong></span>
            </p>
          </div>

          {/* Assigned Worker Banner (Strict Privacy: First name only, zero worker phone) */}
          {data.assigned_worker_first_name && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {data.assigned_worker_first_name.charAt(0)}
              </div>
              <div className="text-xs">
                <div className="font-bold text-emerald-950">
                  Assigned Specialist: {data.assigned_worker_first_name}
                </div>
                <div className="text-[11px] text-emerald-700">
                  Coordinated directly by VIKASA Operations
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Live Timeline */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Dispatch Progress
          </h2>

          <div className="space-y-6 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {steps.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3 relative">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold border-2 transition-all ${
                    step.done
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs shadow-emerald-600/30'
                      : step.current
                      ? 'bg-white border-emerald-600 text-emerald-600 ring-4 ring-emerald-100'
                      : 'bg-white border-slate-300 text-slate-400'
                  }`}
                >
                  {step.done ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                </div>
                <div>
                  <h3
                    className={`text-xs font-bold ${
                      step.done || step.current ? 'text-slate-900' : 'text-slate-400'
                    }`}
                  >
                    {step.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy Assurance Banner */}
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-start gap-3 text-xs text-emerald-950">
          <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>VIKASA Human Coordination:</strong> Our operator manages all communication between you and the technician. No unverified third party receives your personal number.
          </p>
        </div>

        {/* Support Card with WhatsApp and Call */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 text-center space-y-3 shadow-xs">
          <p className="text-xs text-slate-500">
            Have a question or need to update your time window?
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
            <a
              href={whatsappHelpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp Coordinator</span>
            </a>

            <a
              href="tel:+914272334455"
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
            >
              <PhoneCall className="w-4 h-4 text-emerald-600" />
              <span>Call Helpline</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
