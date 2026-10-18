import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { VIKASA_CONFIG } from '@/lib/constants';
import { ShieldCheck, PhoneCall, ArrowRight, UserCheck } from 'lucide-react';

export const metadata = {
  title: 'Technician Information | VIKASA Services Tamil Nadu',
  description: 'Join VIKASA verified technician network across Tamil Nadu.',
  robots: { index: false, follow: false },
};

export default function TechnicianPortalPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-3xl flex items-center justify-center mx-auto ring-8 ring-emerald-50">
          <ShieldCheck className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-bold text-emerald-700 tracking-wider uppercase bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Managed Dispatch Platform
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Technician Network
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
            VIKASA operates on a 100% human-managed dispatch model. Our central operations coordinator verifies every service request and calls registered technicians directly to confirm availability before dispatch.
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left space-y-2.5 text-xs text-slate-700">
          <div className="flex items-start gap-2">
            <UserCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span><strong>No App Login Required:</strong> Jobs are assigned after an operator speaks with you on the phone.</span>
          </div>
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span><strong>Privacy Protected:</strong> Your contact details and customer details are never publicly shared.</span>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <Link
            href="/worker-register"
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
          >
            <span>Register as a Technician</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <a
            href={VIKASA_CONFIG.telUrl}
            className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all"
          >
            <PhoneCall className="w-4 h-4 text-emerald-600" />
            <span>Call Coordinator: {VIKASA_CONFIG.phoneDisplay}</span>
          </a>

          <Link
            href="/"
            className="block text-xs font-semibold text-slate-500 hover:text-slate-800 pt-2"
          >
            ← Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
