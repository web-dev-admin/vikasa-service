import React, { Suspense } from 'react';
import LeadForm from '@/components/customer/LeadForm';
import Link from 'next/link';
import { ChevronLeft, ShieldCheck, PhoneCall } from 'lucide-react';

export default function RequestServicePage() {
  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Home
          </Link>
          <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Zero Spam Guarantee</span>
          </div>
        </div>

        {/* Page Title */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Request a Local Service
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Fill in your requirement below. A dedicated VIKASA operator will review and dispatch the nearest verified professional.
          </p>
        </div>

        {/* Lead Form with Suspense for useSearchParams */}
        <Suspense
          fallback={
            <div className="p-12 text-center text-slate-400">
              <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs">Loading request form...</p>
            </div>
          }
        >
          <LeadForm />
        </Suspense>

        {/* Operator Call Assistance */}
        <div className="text-center text-xs text-slate-400 pt-2">
          Prefer booking over the phone? Call VIKASA Direct:{' '}
          <a href="tel:+914272334455" className="font-bold text-emerald-700 hover:underline">
            +91 427 233 4455
          </a>
        </div>
      </div>
    </div>
  );
}
