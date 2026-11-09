'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Phone,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { STANDARDIZED_SERVICES, VIKASA_CONFIG } from '@/lib/constants';
import { sanitizeIndianMobile10 } from '@/lib/utils/phone';

export default function HeroEstimateWidget() {
  const router = useRouter();
  const [selectedService, setSelectedService] = useState('srv-interior');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState('Erode City');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const serviceObj = STANDARDIZED_SERVICES.find((s) => s.id === selectedService);
    const slug = serviceObj?.slug || 'interior-design';

    const clean = sanitizeIndianMobile10(phone);
    if (phone.trim() && !/^[6-9]\d{9}$/.test(clean)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    const params = new URLSearchParams();
    params.set('cat', slug);
    if (clean) params.set('phone', clean);
    if (area) params.set('district', area);

    router.push(`/request?${params.toString()}`);
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xl shadow-emerald-950/5 relative">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            Quick Consultation &amp; Booking
          </h2>
          <p className="text-[11px] text-slate-500">Verified specialists in Erode • Zero obligation</p>
        </div>
        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-2.5 py-1 rounded-full border border-emerald-200 shrink-0">
          Fast Dispatch
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Service Select */}
        <div className="space-y-1">
          <label htmlFor="hero-service-select" className="block text-xs font-bold text-slate-700">
            Select Service:
          </label>
          <div className="relative">
            <select
              id="hero-service-select"
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
            >
              {STANDARDIZED_SERVICES.map((srv) => (
                <option key={srv.id} value={srv.id}>
                  {srv.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Location Dropdown */}
        <div className="space-y-1">
          <label htmlFor="hero-area-select" className="block text-xs font-bold text-slate-700">
            Location in Erode:
          </label>
          <div className="relative">
            <select
              id="hero-area-select"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
            >
              {VIKASA_CONFIG.serviceAreas.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mobile Number */}
        <div className="space-y-1">
          <label htmlFor="hero-phone-input" className="block text-xs font-bold text-slate-700">
            Your Mobile Number (Optional for instant call):
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
              +91
            </span>
            <input
              id="hero-phone-input"
              type="tel"
              placeholder="98656 52420"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (error) setError(null);
              }}
              className="w-full pl-12 pr-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
              maxLength={14}
            />
          </div>
          {error && <span className="text-[10px] text-rose-600 font-bold block">{error}</span>}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-emerald-700/20 active:scale-[0.98] transition-all min-h-[46px]"
        >
          <span>Continue to Book in 30 Seconds</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>No spam guarantee • Dedicated coordinator callback</span>
        </div>
      </form>
    </div>
  );
}
