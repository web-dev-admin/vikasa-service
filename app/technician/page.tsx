'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { VIKASA_CONFIG } from '@/lib/constants';
import { sanitizeIndianMobile10 } from '@/lib/utils/phone';
import {
  ShieldCheck,
  PhoneCall,
  ArrowRight,
  UserCheck,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  KeyRound,
} from 'lucide-react';

interface ApplicationStatusData {
  applicationReference: string;
  verificationStatus: string;
  trade: string;
  district: string;
  appliedAt: string;
}

function TechnicianStatusContent() {
  const searchParams = useSearchParams();
  const initialToken = searchParams.get('token') || '';

  const [token, setToken] = useState(initialToken);
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ApplicationStatusData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-fetch if token query param is provided
  useEffect(() => {
    if (initialToken && initialToken.length >= 8) {
      setToken(initialToken);
      fetchStatus(initialToken, '');
    }
  }, [initialToken]);

  const fetchStatus = async (tok: string, ph: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const params = new URLSearchParams();
      params.set('token', tok.trim());
      if (ph.trim()) {
        params.set('phone', sanitizeIndianMobile10(ph));
      }

      const res = await fetch(`/api/technicians/status?${params.toString()}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || 'No application found for this token.');
      } else {
        setResult(json.data);
      }
    } catch {
      setError('Could not verify status. Please check your network connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setError('Please enter your confidential application token');
      return;
    }
    fetchStatus(token, phone);
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'verified':
        return {
          label: 'Approved & Active',
          color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          icon: CheckCircle2,
          description:
            'Your profile is active in our Erode dispatch pool. Our coordinator will contact you when customer jobs match your trade.',
        };
      case 'rejected':
        return {
          label: 'Application Rejected',
          color: 'bg-rose-100 text-rose-800 border-rose-300',
          icon: XCircle,
          description:
            'Your application could not be approved at this time. Please contact our coordinator for details.',
        };
      default:
        return {
          label: 'Under Review / Pending',
          color: 'bg-amber-100 text-amber-800 border-amber-300',
          icon: Clock,
          description:
            'Your application has been received and is currently being verified by our operations desk.',
        };
    }
  };

  return (
    <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl text-center space-y-6">
      <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-3xl flex items-center justify-center mx-auto ring-8 ring-emerald-50">
        <ShieldCheck className="w-9 h-9" />
      </div>

      <div className="space-y-1">
        <span className="text-[11px] font-bold text-emerald-700 tracking-wider uppercase bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          Technician Privacy-Preserving Tracker
        </span>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight pt-1">
          Technician Portal
        </h1>
        <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
          Check your verification status securely using your confidential application token.
        </p>
      </div>

      {/* Status Lookup Card */}
      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-3">
        <span className="text-xs font-bold text-slate-800 block">
          Secure Application Lookup
        </span>

        <form onSubmit={handleLookup} className="space-y-2.5">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 block">
              Application Tracking Token <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <KeyRound className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                placeholder="app-tok-..."
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-mono font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[44px]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 block">
              Registered Phone (Optional for extra verification)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                +91
              </span>
              <input
                type="tel"
                placeholder="98656 52420"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-11 pr-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[44px]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 min-h-[44px] disabled:opacity-50 cursor-pointer active:scale-[0.99]"
          >
            <Search className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Verifying...' : 'Check Status'}</span>
          </button>
        </form>

        {error && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2.5 animate-in fade-in duration-150">
            {(() => {
              const info = getStatusDisplay(result.verificationStatus);
              const Icon = info.icon;
              return (
                <>
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                    <span className="font-mono font-bold text-xs text-slate-900">
                      Ref: {result.applicationReference}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${info.color}`}>
                      <Icon className="w-3 h-3" />
                      <span>{info.label}</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-snug">{info.description}</p>
                  <div className="text-[11px] text-slate-500 flex justify-between pt-1 border-t border-slate-100">
                    <span>Trade: <strong>{result.trade}</strong></span>
                    <span>District: <strong>{result.district}</strong></span>
                  </div>
                  <div className="text-[10px] text-slate-400 text-right">
                    Applied on: {new Date(result.appliedAt).toLocaleDateString()}
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 pt-1">
        <Link
          href="/worker-register"
          className="w-full min-h-[44px] py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all active:scale-95"
        >
          <span>Register as a New Technician</span>
          <ArrowRight className="w-4 h-4" />
        </Link>

        <a
          href={VIKASA_CONFIG.telUrl}
          className="w-full min-h-[44px] py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
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
  );
}

export default function TechnicianPortalPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <Suspense
        fallback={
          <div className="p-8 text-center text-slate-500 text-xs">
            Loading technician portal...
          </div>
        }
      >
        <TechnicianStatusContent />
      </Suspense>
    </div>
  );
}
