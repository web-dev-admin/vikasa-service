'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Wrench,
  Zap,
  Hammer,
  Tv,
  Sparkles,
  Layout,
  Search,
  ArrowRight,
  Check,
  ChevronRight,
} from 'lucide-react';
import { STANDARDIZED_SERVICES } from '@/lib/constants';
import { INITIAL_CATEGORIES } from '@/lib/taxonomy/catalog';

const iconMap: Record<string, React.ElementType> = {
  Sparkles,
  Hammer,
  Zap,
  Wrench,
  Tv,
  Layout,
};

export default function CompactServiceDiscovery() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filteredServices = useMemo(() => {
    let list = [...STANDARDIZED_SERVICES];

    if (activeCategory !== 'all') {
      if (activeCategory === 'interior') {
        list = list.filter((s) => s.id === 'srv-interior' || s.id === 'srv-carpentry');
      } else if (activeCategory === 'repairs') {
        list = list.filter((s) => s.id === 'srv-electrical' || s.id === 'srv-plumbing' || s.id === 'srv-ac');
      } else if (activeCategory === 'finishes') {
        list = list.filter((s) => s.id === 'srv-painting' || s.id === 'srv-cleaning');
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.slug.toLowerCase().includes(q)
      );
    }

    return list;
  }, [searchQuery, activeCategory]);

  return (
    <div className="space-y-6">
      {/* Search & Filter Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Instant Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search service (e.g., modular kitchen, plumber, painting)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 shadow-xs min-h-[44px]"
            aria-label="Search services"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600 p-1"
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Compact Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveCategory('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all min-h-[44px] shrink-0 ${
              activeCategory === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            All Services
          </button>
          <button
            onClick={() => setActiveCategory('interior')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all min-h-[44px] shrink-0 ${
              activeCategory === 'interior'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            Interiors &amp; Plywood
          </button>
          <button
            onClick={() => setActiveCategory('repairs')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all min-h-[44px] shrink-0 ${
              activeCategory === 'repairs'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            Electrical &amp; Plumbing
          </button>
          <button
            onClick={() => setActiveCategory('finishes')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all min-h-[44px] shrink-0 ${
              activeCategory === 'finishes'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            Painting &amp; Cleaning
          </button>
        </div>
      </div>

      {/* Compact Service Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {filteredServices.map((srv) => {
          const Icon = iconMap[srv.icon] || Sparkles;

          return (
            <Link
              key={srv.id}
              href={`/request?cat=${srv.slug}`}
              className="group bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md transition-all flex flex-col justify-between text-left active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 min-h-[120px]"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors mb-2.5 shrink-0">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                  {srv.name}
                </h3>
              </div>

              <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-emerald-700">
                <span>Book Service</span>
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>

      {filteredServices.length === 0 && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center space-y-3">
          <p className="text-xs font-bold text-slate-600">No exact service matched &quot;{searchQuery}&quot;</p>
          <p className="text-[11px] text-slate-400">
            We provide all custom home services in Erode. You can book under &quot;Other Services&quot; or call our helpline directly.
          </p>
          <Link
            href="/request?cat=other"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors"
          >
            <span>Book Custom Requirement</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}

