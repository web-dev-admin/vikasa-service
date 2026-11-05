'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, ChevronLeft, ShieldCheck, PhoneCall, MessageCircle } from 'lucide-react';
import { VIKASA_CONFIG } from '@/lib/constants';

export default function TrackLookupPage() {
  const router = useRouter();
  const [tokenOrId, setTokenOrId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = tokenOrId.trim();
    if (!query) {
      setError('Please enter your request ID, token, or number.');
      return;
    }
    // Navigate to tracking details
    router.push(`/track/${encodeURIComponent(query)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-white to-slate-50 py-10 px-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 rounded-lg"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Home
          </Link>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            <ShieldCheck className="w-4 h-4" />
            <span>Secure Dispatch</span>
          </div>
        </div>

        {/* Brand Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm text-center space-y-4">
          <div className="inline-flex items-center justify-center">
            <Image
              src={VIKASA_CONFIG.logoPath}
              alt="Vikasa Interior Logo"
              width={64}
              height={64}
              className="rounded-2xl shadow-sm ring-2 ring-emerald-500/20 object-cover"
            />
          </div>

          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Track Your Service Request
            </h1>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
              Enter your tracking token or request reference number provided after booking to view live technician dispatch progress.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-1 text-left">
            <div>
              <label htmlFor="track-query-input" className="block text-xs font-bold text-slate-700 mb-1.5">
                Tracking Token or Request Number <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  id="track-query-input"
                  type="text"
                  required
                  placeholder="e.g. 1042 or e7b1a234-8c90..."
                  value={tokenOrId}
                  onChange={(e) => {
                    setTokenOrId(e.target.value);
                    if (error) setError('');
                  }}
                  aria-invalid={!!error}
                  aria-describedby={error ? 'track-query-error' : 'track-format-guide'}
                  className={`w-full px-4 py-3 min-h-[46px] rounded-xl border text-base sm:text-sm text-slate-900 pr-10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1 font-mono ${
                    error ? 'border-red-400 bg-red-50/20' : 'border-slate-200 bg-white focus:border-emerald-600'
                  }`}
                />
                <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
              {error && (
                <p id="track-query-error" role="alert" className="text-xs text-red-700 mt-1.5 font-medium">
                  {error}
                </p>
              )}

              {/* Clear format examples box */}
              <div
                id="track-format-guide"
                className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 space-y-1"
              >
                <div className="font-bold text-slate-800">Supported formats:</div>
                <div className="flex flex-col gap-1 font-mono text-[10px] text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">Numeric ID</span>
                    <span>1042 or #1042 or VK-REQ-1042</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 font-bold">Secure Token</span>
                    <span>e7b1a234-8c90-4d56-a123-456789abc...</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full min-h-[48px] py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              <span>Track Request Now</span>
            </button>
          </form>
        </div>

        {/* Need Assistance */}
        <div className="bg-emerald-900 text-white rounded-2xl p-5 text-center space-y-3 shadow-sm">
          <p className="text-xs text-emerald-100 font-medium">
            Can&apos;t find your tracking number? Contact our Erode coordinator:
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
            <a
              href={VIKASA_CONFIG.telUrl}
              className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl bg-white text-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm hover:bg-emerald-50 active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
              <span>Call: {VIKASA_CONFIG.phoneDisplay}</span>
            </a>
            <a
              href={VIKASA_CONFIG.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto min-h-[44px] px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Us</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
