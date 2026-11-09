'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';

export default function TechnicianPortalPage() {
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    fullName: string;
    verificationStatus: string;
    district: string;
    appliedAt: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    const clean = sanitizeIndianMobile10(phone);
    if (!/^[6-9]\d{9}$/.test(clean)) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/technicians/status?phone=${clean}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error || 'No application found for this number.');
      } else {
        setResult(json.data);
      }
    } catch {
      setError('Could not verify status. Please check connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'verified':
        return {
          label: 'Approved & Active',
          color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          icon: CheckCircle2,
          description: 'Your profile is active in our Erode dispatch pool. Our coordinator will contact you when jobs are ready.',
        };
      case 'rejected':
        return {
          label: 'Application Rejected',
          color: 'bg-rose-100 text-rose-800 border-rose-300',
          icon: XCircle,
          description: 'Your application could not be approved at this time. Please contact our coordinator for details.',
        };
      default:
        return {
          label: 'Under Review / Pending',
          color: 'bg-amber-100 text-amber-800 border-amber-300',
          icon: Clock,
          description: 'Your application has been received and is currently being verified by our operations desk.',
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-3xl flex items-center justify-center mx-auto ring-8 ring-emerald-50">
          <ShieldCheck className="w-9 h-9" />
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-bold text-emerald-700 tracking-wider uppercase bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Technician Network &amp; Status
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight pt-1">
            Technician Portal
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
            Check your application status or register to join our background-verified service specialist network in Tamil Nadu.
          </p>
        </div>

        {/* Status Lookup Card */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-3">
          <span className="text-xs font-bold text-slate-800 block">
            Check Application Status
          </span>

          <form onSubmit={handleLookup} className="space-y-2">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                +91
              </span>
              <input
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-11 pr-3 py-2 rounded-xl bg-white border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none min-h-[44px]"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 min-h-[40px] disabled:opacity-50"
            >
              <Search className="w-3.5 h-3.5" />
              <span>{isLoading ? 'Checking...' : 'Check Status'}</span>
            </button>
          </form>

          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2 animate-in fade-in duration-150">
              {(() => {
                const info = getStatusDisplay(result.verificationStatus);
                const Icon = info.icon;
                return (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{result.fullName}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${info.color}`}>
                        <Icon className="w-3 h-3" />
                        <span>{info.label}</span>
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">{info.description}</p>
                    <div className="text-[10px] text-slate-400 flex justify-between pt-1 border-t border-slate-100">
                      <span>District: {result.district}</span>
                      <span>Applied: {new Date(result.appliedAt).toLocaleDateString()}</span>
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
    </div>
  );
}
