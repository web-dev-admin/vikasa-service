'use client';

import React from 'react';
import Link from 'next/link';
import { WifiOff, PhoneCall, RefreshCw, Home } from 'lucide-react';
import { VIKASA_CONFIG } from '@/lib/constants';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-lg text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
          <WifiOff className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            You are currently offline
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Please check your internet or mobile data connection. If you need urgent assistance in Erode, you can reach our coordination desk directly by phone.
          </p>
        </div>

        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-left space-y-2">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
            Direct Phone Helpline
          </span>
          <a
            href={VIKASA_CONFIG.telUrl}
            className="flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-800"
          >
            <PhoneCall className="w-4 h-4" />
            <span>Call: {VIKASA_CONFIG.phoneDisplay}</span>
          </a>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => {
              if (typeof window !== 'undefined') window.location.reload();
            }}
            className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2 min-h-[44px]"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Connection</span>
          </button>
          <Link
            href="/"
            className="flex-1 py-3 px-4 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Home className="w-4 h-4" />
            <span>Go to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
