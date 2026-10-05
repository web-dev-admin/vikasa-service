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
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
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
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Enter your tracking token or request reference number (e.g. 1042 or e7b1a234...) provided after booking.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 pt-2 text-left">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Tracking Token or Request Number
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. 1042 or tracking code"
                  value={tokenOrId}
                  onChange={(e) => {
                    setTokenOrId(e.target.value);
                    if (error) setError('');
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 pr-10"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              </div>
              {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 active:scale-[0.99] transition-all cursor-pointer"
            >
              <span>Track Request Now</span>
            </button>
          </form>
        </div>

        {/* Need Assistance */}
        <div className="bg-emerald-900 text-white rounded-2xl p-5 text-center space-y-3 shadow-sm">
          <p className="text-xs text-emerald-200">
            Can&apos;t find your tracking number? Contact our Salem coordinator:
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
            <a
              href={VIKASA_CONFIG.telUrl}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white text-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm hover:bg-emerald-50 transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
              <span>Call: {VIKASA_CONFIG.phoneDisplay}</span>
            </a>
            <a
              href={VIKASA_CONFIG.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors"
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
