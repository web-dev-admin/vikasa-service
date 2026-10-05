import React, { Suspense } from 'react';
import LeadForm from '@/components/customer/LeadForm';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ShieldCheck, PhoneCall, MessageCircle } from 'lucide-react';
import { VIKASA_CONFIG } from '@/lib/constants';

export default function RequestServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-white to-slate-50 py-8 px-4">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Navigation & Trust Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Home
          </Link>
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-100/70 px-3 py-1 rounded-full border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Verified Technicians • No Advance Fee</span>
          </div>
        </div>

        {/* Brand & Page Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center justify-center mb-1">
            <Image
              src={VIKASA_CONFIG.logoPath}
              alt="Vikasa Interior Logo"
              width={56}
              height={56}
              className="rounded-2xl shadow-sm ring-2 ring-emerald-500/20 object-cover"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Book a Service
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Fill in your requirement below. Our team will verify and assign the nearest specialist.
          </p>
        </div>

        {/* Customer Form with Suspense for useSearchParams */}
        <Suspense
          fallback={
            <div className="p-12 text-center text-slate-400">
              <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs">Loading form...</p>
            </div>
          }
        >
          <LeadForm />
        </Suspense>

        {/* Direct Call / WhatsApp Assistance */}
        <div className="text-center text-xs text-slate-500 pt-2 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1">
            <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
            <span>Prefer booking by phone?</span>
            <a href={VIKASA_CONFIG.telUrl} className="font-bold text-emerald-700 hover:underline">
              {VIKASA_CONFIG.phoneDisplay}
            </a>
          </div>
          <span className="hidden sm:inline text-slate-300">•</span>
          <div className="flex items-center gap-1">
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
            <a
              href={VIKASA_CONFIG.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-emerald-700 hover:underline"
            >
              WhatsApp Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
