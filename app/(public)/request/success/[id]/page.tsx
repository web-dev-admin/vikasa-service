'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { dataStore } from '@/lib/data/store';
import { ServiceRequest } from '@/types';
import { getWhatsAppUrl } from '@/lib/utils/phone';
import Link from 'next/link';
import {
  CheckCircle2,
  PhoneCall,
  Shield,
  Clock,
  MapPin,
  ArrowRight,
  MessageCircle,
} from 'lucide-react';

export default function RequestSuccessPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.id as string;
  const [request, setRequest] = useState<ServiceRequest | null>(null);

  useEffect(() => {
    if (token) {
      // Secure lookup by tracking token, with fallback to ID
      const found = dataStore.getRequestByTrackingToken(token) || dataStore.getRequestById(token);
      if (found) {
        setRequest(found);
      }
    }
  }, [token]);

  const whatsappHelpUrl = request
    ? getWhatsAppUrl(
        '914272334455',
        `Hello VIKASA Support, I submitted request #${request.request_number} for ${request.service_name}. Need assistance.`
      )
    : '#';

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 via-white to-slate-50 py-10 px-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Success Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-xl shadow-emerald-900/5 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-400 to-teal-500" />

          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-50">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Request Received!
          </h1>
          <p className="text-sm font-semibold text-emerald-700 mt-1">
            Request Reference: #{request?.request_number || '---'}
          </p>

          <p className="text-sm text-slate-600 mt-3 leading-relaxed">
            Your request has been received. A <span className="font-bold text-slate-900">VIKASA representative will contact you shortly</span> on your mobile number to confirm the exact requirement.
          </p>

          {/* Privacy Protocol Badge */}
          <div className="mt-5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-left flex items-start gap-3">
            <Shield className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600">
              <span className="font-bold text-slate-900 block">VIKASA Privacy Guarantee</span>
              Our verified operator coordinates directly with skilled local technicians on your behalf. Personal numbers are never exposed.
            </div>
          </div>
        </div>

        {/* Request Summary Card */}
        {request && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3.5">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Request Summary
            </h2>

            <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
              <span className="text-xs text-slate-500">Service</span>
              <span className="text-xs font-bold text-slate-900 text-right">
                {request.category_name} • {request.service_name}
              </span>
            </div>

            <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
              <span className="text-xs text-slate-500">Preferred Time</span>
              <span className="text-xs font-semibold text-slate-800 text-right">
                {request.preferred_time_slot || 'ASAP'}
              </span>
            </div>

            <div className="flex items-start justify-between border-b border-slate-100 pb-2.5">
              <span className="text-xs text-slate-500">Area</span>
              <span className="text-xs text-slate-700 text-right max-w-[200px] truncate">
                {request.formatted_address.split(',')[0]}
              </span>
            </div>

            <div className="flex items-start justify-between">
              <span className="text-xs text-slate-500">Current Status</span>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Operator Reviewing
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Link
            href={`/track/${request?.tracking_token || token}`}
            className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            <span>Track Request Status</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <a
            href={whatsappHelpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center justify-center gap-2 transition-all"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>Chat with VIKASA on WhatsApp</span>
          </a>

          <Link
            href="/request"
            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-600 text-xs font-semibold border border-slate-200 flex items-center justify-center gap-1.5 transition-all"
          >
            <span>Submit Another Request</span>
          </Link>
        </div>

        {/* Operator Support Contact */}
        <div className="text-center text-xs text-slate-400">
          Helpline:{' '}
          <a href="tel:+914272334455" className="font-semibold text-emerald-600 hover:underline">
            +91 427 233 4455
          </a>
        </div>
      </div>
    </div>
  );
}
