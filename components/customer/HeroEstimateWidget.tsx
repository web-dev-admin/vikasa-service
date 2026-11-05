'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Wrench,
  Zap,
  Hammer,
  Tv,
  Sparkles,
  Layout,
  HelpCircle,
  ArrowRight,
  MessageCircle,
} from 'lucide-react';
import { INITIAL_CATEGORIES } from '@/lib/taxonomy/catalog';
import { VIKASA_CONFIG } from '@/lib/constants';

const iconMap: { [key: string]: React.ElementType } = {
  Wrench,
  Zap,
  Hammer,
  Tv,
  Sparkles,
  Layout,
  HelpCircle,
};

export default function HeroEstimateWidget() {
  const router = useRouter();
  const [selectedServiceCategory, setSelectedServiceCategory] = useState(
    INITIAL_CATEGORIES[0]?.id || 'cat-interior'
  );
  const [quickArea, setQuickArea] = useState('Thindal');

  const handleHeroQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cat = INITIAL_CATEGORIES.find((c) => c.id === selectedServiceCategory);
    router.push(`/request?cat=${cat?.slug || 'interior-design'}`);
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xl shadow-emerald-950/5 relative">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-black text-slate-900">
          Get Free Design Consultation &amp; Estimate
        </h2>
        <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          Zero Obligation
        </span>
      </div>

      <form onSubmit={handleHeroQuickSubmit} className="space-y-4">
        <div className="space-y-2">
          <span id="hero-service-scope-label" className="block text-xs font-bold text-slate-700">
            Select Interior Scope or Service:
          </span>
          <div
            role="radiogroup"
            aria-labelledby="hero-service-scope-label"
            className="grid grid-cols-2 sm:grid-cols-3 gap-2"
          >
            {INITIAL_CATEGORIES.map((cat) => {
              const Icon = iconMap[cat.icon || 'Wrench'] || Layout;
              const isSelected = selectedServiceCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setSelectedServiceCategory(cat.id)}
                  className={`min-h-[44px] p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-1 ring-emerald-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isSelected ? 'text-emerald-700' : 'text-slate-500'
                    }`}
                  />
                  <span className="truncate">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Area Quick Selection */}
        <div className="space-y-1.5 pt-1">
          <span id="hero-project-location-label" className="block text-xs font-bold text-slate-700">
            Your Erode Project Location:
          </span>
          <div
            role="radiogroup"
            aria-labelledby="hero-project-location-label"
            className="flex flex-wrap gap-1.5"
          >
            {VIKASA_CONFIG.serviceAreas.slice(0, 6).map((loc) => (
              <button
                key={loc}
                type="button"
                role="radio"
                aria-checked={quickArea === loc}
                onClick={() => setQuickArea(loc)}
                className={`min-h-[32px] px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-transform active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 ${
                  quickArea === loc
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 space-y-2">
          <button
            type="submit"
            className="w-full min-h-[48px] py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
          >
            <span>Continue With Selected Scope</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <a
            href={VIKASA_CONFIG.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full min-h-[44px] py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 active:scale-[0.98] text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center justify-center gap-1.5 transition-all text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
          >
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>Instant Consultation via WhatsApp ({VIKASA_CONFIG.phone})</span>
          </a>
        </div>
      </form>
    </div>
  );
}

