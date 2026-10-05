'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Wrench,
  Zap,
  Hammer,
  Tv,
  Sparkles,
  PhoneCall,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  MessageCircle,
  Star,
  UserCheck,
  Check,
  X,
  ChevronRight,
  Shield,
  Award,
  Phone,
} from 'lucide-react';
import { INITIAL_CATEGORIES, INITIAL_SERVICES } from '@/lib/taxonomy/catalog';
import { dataStore } from '@/lib/data/store';
import { VIKASA_CONFIG } from '@/lib/constants';
import { Worker } from '@/types';
import LeadForm from '@/components/customer/LeadForm';

const iconMap: { [key: string]: React.ElementType } = {
  Wrench,
  Zap,
  Hammer,
  Tv,
  Sparkles,
};

// Pricing & subtitle suggestions for services
const SERVICE_METAS: { [key: string]: { price: string; popular: string[] } } = {
  'cat-plumbing': {
    price: 'From ₹199',
    popular: ['Tap Leakage', 'Pipe Repair', 'Flush Tank Fix', 'Tank Cleaning'],
  },
  'cat-electrical': {
    price: 'From ₹149',
    popular: ['Switchboard Fix', 'Fan Installation', 'MCB Tripping', 'Wiring'],
  },
  'cat-carpentry': {
    price: 'From ₹249',
    popular: ['Door Lock Repair', 'Cabinet Hinges', 'Woodwork Alignments'],
  },
  'cat-ac-appliances': {
    price: 'From ₹399',
    popular: ['AC Jet Wash', 'Gas Charging', 'Washing Machine Repair'],
  },
  'cat-cleaning-painting': {
    price: 'From ₹499',
    popular: ['Bathroom Deep Clean', 'Water Tank Cleaning', 'Touch-up Painting'],
  },
};

export default function LandingPage() {
  const router = useRouter();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [heroMode, setHeroMode] = useState<'service' | 'technician'>('service');
  const [selectedServiceCategory, setSelectedServiceCategory] = useState(INITIAL_CATEGORIES[0]?.id);
  const [selectedHeroWorker, setSelectedHeroWorker] = useState<string>('');
  const [quickPhone, setQuickPhone] = useState('');
  const [quickArea, setQuickArea] = useState('Fairlands');

  // Booking Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'service' | 'technician'>('service');
  const [modalPreselectedTech, setModalPreselectedTech] = useState<string | undefined>(undefined);

  useEffect(() => {
    const verifiedWorkers = dataStore.getWorkers().filter((w) => w.verification_status === 'verified');
    setWorkers(verifiedWorkers);
    if (verifiedWorkers.length > 0) {
      setSelectedHeroWorker(verifiedWorkers[0].id);
    }
  }, []);

  const openBookingForService = (catSlug?: string) => {
    router.push(`/request${catSlug ? `?cat=${catSlug}` : ''}`);
  };

  const openBookingForTechnician = (techId: string) => {
    router.push(`/request?tech=${techId}`);
  };

  // Quick submit from Hero
  const handleHeroQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroMode === 'technician') {
      router.push(`/request?tech=${selectedHeroWorker}`);
    } else {
      const cat = INITIAL_CATEGORIES.find((c) => c.id === selectedServiceCategory);
      router.push(`/request?cat=${cat?.slug || 'plumbing'}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-600 selection:text-white pb-20 sm:pb-0">
      {/* 1. Top Announcement & Direct Helpline Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-slate-200">
              Serving Salem, Tamil Nadu & Surrounding Areas • Verified Doorstep Service
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <a
              href={VIKASA_CONFIG.telUrl}
              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Call: {VIKASA_CONFIG.phoneDisplay}</span>
            </a>
            <span className="text-slate-600 hidden sm:inline">|</span>
            <a
              href={VIKASA_CONFIG.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Us</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. Navigation Header with Real Vikasa Logo */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          {/* Logo & Brand Identity */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden shadow-md ring-2 ring-emerald-600/20 group-hover:scale-105 transition-transform shrink-0 bg-slate-900 flex items-center justify-center">
              <Image
                src={VIKASA_CONFIG.logoPath}
                alt="VIKASA Interior & Services Logo"
                width={48}
                height={48}
                className="object-cover w-full h-full"
                priority
              />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900 block leading-tight group-hover:text-emerald-700 transition-colors">
                VIKASA
              </span>
              <span className="text-[11px] font-bold text-emerald-700 tracking-wider uppercase block">
                Interior & Home Services
              </span>
            </div>
          </Link>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
            <a href="#services" className="hover:text-emerald-700 transition-colors">
              Services
            </a>
            <a href="#technicians" className="hover:text-emerald-700 transition-colors">
              Technicians
            </a>
            <Link href="/technician" className="hover:text-emerald-700 transition-colors text-amber-700 font-bold">
              Technician Portal
            </Link>
            <Link href="/track" className="hover:text-emerald-700 transition-colors">
              Track Request
            </Link>
          </nav>

          {/* Right Header CTAs */}
          <div className="flex items-center gap-2.5">
            {/* Phone Button */}
            <a
              href={VIKASA_CONFIG.telUrl}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
              <span>{VIKASA_CONFIG.phone}</span>
            </a>

            {/* WhatsApp Button */}
            <a
              href={VIKASA_CONFIG.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp</span>
            </a>

            {/* Main Book Button */}
            <Link
              href="/request"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all flex items-center gap-1.5"
            >
              <span>Book Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* 3. Hero Section with Intuitive Dual Booking Widget */}
      <section className="relative overflow-hidden pt-8 pb-16 px-4 bg-gradient-to-b from-emerald-50/60 via-white to-slate-50 border-b border-slate-200/60">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Hero Left Content */}
            <div className="lg:col-span-6 space-y-5 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold shadow-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Salem&apos;s Verified Home & Interior Services</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.18]">
                Book Expert Services & <br className="hidden sm:inline" />
                <span className="text-emerald-700">Verified Technicians</span> in Salem
              </h1>

              <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Whether you need a quick plumbing repair, licensed electrician, master carpenter, or home interior touch-ups — get certified specialists at your doorstep in under 60 minutes.
              </p>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-2 pt-2 max-w-md mx-auto lg:mx-0">
                <div className="p-3 bg-white rounded-2xl border border-slate-200 text-center shadow-xs">
                  <span className="block text-emerald-700 font-black text-base sm:text-lg">30 Min</span>
                  <span className="text-[11px] text-slate-500 font-medium">Quick Dispatch</span>
                </div>
                <div className="p-3 bg-white rounded-2xl border border-slate-200 text-center shadow-xs">
                  <span className="block text-emerald-700 font-black text-base sm:text-lg">100%</span>
                  <span className="text-[11px] text-slate-500 font-medium">Verified Pros</span>
                </div>
                <div className="p-3 bg-white rounded-2xl border border-slate-200 text-center shadow-xs">
                  <span className="block text-emerald-700 font-black text-base sm:text-lg">4.9 ★</span>
                  <span className="text-[11px] text-slate-500 font-medium">Salem Rating</span>
                </div>
              </div>

              {/* Direct Call / WhatsApp Notice */}
              <div className="pt-2 text-xs text-slate-500 flex flex-wrap items-center justify-center lg:justify-start gap-3">
                <span>Prefer direct booking?</span>
                <a href={VIKASA_CONFIG.telUrl} className="font-bold text-emerald-700 hover:underline flex items-center gap-1">
                  <PhoneCall className="w-3.5 h-3.5" /> {VIKASA_CONFIG.phoneDisplay}
                </a>
              </div>
            </div>

            {/* Hero Right: Dual Booking Widget (Service vs Technician) */}
            <div className="lg:col-span-6">
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xl shadow-emerald-950/5 relative">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-black text-slate-900">
                    Quick Booking in 30 Seconds
                  </h2>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    No Advance Fee
                  </span>
                </div>

                {/* Tab Switcher */}
                <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl mb-5">
                  <button
                    type="button"
                    onClick={() => setHeroMode('service')}
                    className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      heroMode === 'service'
                        ? 'bg-white text-emerald-800 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Wrench className="w-4 h-4 text-emerald-600" />
                    <span>Book a Service</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHeroMode('technician')}
                    className={`py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      heroMode === 'technician'
                        ? 'bg-white text-emerald-800 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>Book a Technician</span>
                  </button>
                </div>

                <form onSubmit={handleHeroQuickSubmit} className="space-y-4">
                  {heroMode === 'service' ? (
                    /* Service Mode Picker */
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700">
                        Select Required Service Trade:
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {INITIAL_CATEGORIES.map((cat) => {
                          const Icon = iconMap[cat.icon || 'Wrench'] || Wrench;
                          const isSelected = selectedServiceCategory === cat.id;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => setSelectedServiceCategory(cat.id)}
                              className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-1 ring-emerald-500/20'
                                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-emerald-700' : 'text-slate-400'}`} />
                              <span className="truncate">{cat.name}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    /* Technician Mode Picker */
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-700">
                        Choose Salem Verified Specialist:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                        {workers.slice(0, 6).map((worker) => {
                          const isSelected = selectedHeroWorker === worker.id;
                          return (
                            <button
                              key={worker.id}
                              type="button"
                              onClick={() => setSelectedHeroWorker(worker.id)}
                              className={`p-2.5 rounded-xl border text-left text-xs flex items-center gap-2.5 transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-1 ring-emerald-500/20'
                                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs flex items-center justify-center shrink-0">
                                {worker.full_name.charAt(0)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-slate-900 truncate">
                                  {worker.full_name}
                                </div>
                                <div className="text-[10px] text-emerald-700">
                                  {worker.experience_years}+ Yrs • {worker.base_location_name.split(',')[0]}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Area Quick Selection */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-xs font-bold text-slate-700">
                      Your Salem Area:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {VIKASA_CONFIG.serviceAreas.slice(0, 5).map((loc) => (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => setQuickArea(loc)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer ${
                            quickArea === loc
                              ? 'bg-emerald-600 text-white font-bold'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                      className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 active:scale-[0.99] transition-all cursor-pointer"
                    >
                      <span>
                        {heroMode === 'technician' ? 'Continue Booking Technician' : 'Continue Booking Service'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <a
                      href={VIKASA_CONFIG.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center justify-center gap-1.5 transition-all text-center"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-600" />
                      <span>Instant Booking on WhatsApp ({VIKASA_CONFIG.phone})</span>
                    </a>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Service Categories Section (Clean, Spacious) */}
      <section id="services" className="py-16 px-4 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Doorstep Trades
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              Popular Home Services in Salem
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Select a service below to book in less than a minute.
            </p>
          </div>

          <Link
            href="/request"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 self-start md:self-auto"
          >
            <span>View All Services</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {INITIAL_CATEGORIES.map((cat) => {
            const Icon = iconMap[cat.icon || 'Wrench'] || Wrench;
            const meta = SERVICE_METAS[cat.id] || { price: 'From ₹199', popular: [] };

            return (
              <div
                key={cat.id}
                className="group bg-white rounded-3xl p-6 border border-slate-200 hover:border-emerald-500/80 hover:shadow-xl hover:shadow-emerald-950/5 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors shadow-xs">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      {meta.price}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                    {cat.description}
                  </p>

                  {/* Popular issues tags */}
                  <div className="flex flex-wrap gap-1.5 mt-4">
                    {meta.popular.map((item) => (
                      <span
                        key={item}
                        className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => openBookingForService(cat.slug)}
                    className="text-xs font-bold text-emerald-700 group-hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Book {cat.name}</span>
                    <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </button>

                  <a
                    href={`https://wa.me/${VIKASA_CONFIG.whatsappNumber}?text=${encodeURIComponent(`Hello VIKASA, I want to book ${cat.name} service in Salem.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                    title="Inquire via WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Book Certified Technicians Section (Brand New Feature requested) */}
      <section id="technicians" className="py-16 px-4 bg-white border-y border-slate-200/80">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                Direct Specialist Booking
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
                Book Verified Salem Technicians
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Choose top-rated trade specialists with background verification and upfront rates.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Need immediate help?</span>
              <a
                href={VIKASA_CONFIG.telUrl}
                className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1"
              >
                <PhoneCall className="w-3.5 h-3.5" /> Call {VIKASA_CONFIG.phone}
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {workers.map((worker) => (
              <div
                key={worker.id}
                className="bg-slate-50/70 rounded-3xl p-5 border border-slate-200 hover:border-emerald-400 hover:bg-white hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-black text-lg flex items-center justify-center shrink-0 shadow-sm">
                      {worker.full_name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="text-sm font-bold text-slate-900 truncate">
                          {worker.full_name}
                        </h3>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-700" /> Verified
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span className="truncate">{worker.base_location_name}</span>
                      </div>

                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          {worker.experience_years}+ Years Exp
                        </span>
                        <span className="text-[11px] font-bold text-amber-600 flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> 4.9
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed">
                    {worker.bio || 'Verified trade specialist ready for emergency and routine visits.'}
                  </p>

                  {/* Skills tags */}
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {worker.skills.slice(0, 3).map((skill) => (
                      <span
                        key={skill}
                        className="text-[10px] font-medium text-slate-700 bg-white border border-slate-200/80 px-2 py-0.5 rounded-md"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Technician Actions */}
                <div className="mt-5 pt-3.5 border-t border-slate-200 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openBookingForTechnician(worker.id)}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <span>Book Specialist</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <a
                    href={`https://wa.me/${VIKASA_CONFIG.whatsappNumber}?text=${encodeURIComponent(`Hello VIKASA, I want to book technician ${worker.full_name} in ${worker.base_location_name}.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-white hover:bg-emerald-50 text-emerald-700 border border-slate-200 transition-colors"
                    title="Book via WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Simple 3-Step Process (Uncluttered & Clean) */}
      <section id="how-it-works" className="py-16 px-4 max-w-5xl mx-auto">
        <div className="text-center space-y-2 mb-12">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
            Effortless Experience
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            How VIKASA Works in 3 Simple Steps
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            No endless spam calls or guesswork. Simple, managed doorstep service.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center space-y-3 relative shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 font-black text-base flex items-center justify-center mx-auto shadow-xs">
              1
            </div>
            <h3 className="text-base font-bold text-slate-900">
              1. Choose Service or Specialist
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pick the trade category or select a specific verified technician in Salem.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center space-y-3 relative shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 font-black text-base flex items-center justify-center mx-auto shadow-xs">
              2
            </div>
            <h3 className="text-base font-bold text-slate-900">
              2. Quick Coordinator Verification
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Our Salem coordinator confirms your time slot and dispatches the nearby pro.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center space-y-3 relative shadow-xs">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 font-black text-base flex items-center justify-center mx-auto shadow-xs">
              3
            </div>
            <h3 className="text-base font-bold text-slate-900">
              3. Doorstep Fix & Pay Afterwards
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Specialist completes the work with guaranteed quality. Pay only when satisfied.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Call & WhatsApp Direct Booking Banner (Helpline: 9865652420) */}
      <section className="py-12 px-4 max-w-6xl mx-auto">
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-slate-900 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-xl">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
              Salem Immediate Assistance
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Need a Service Specialist Immediately?
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Skip the forms! Talk to our Salem service coordinator directly on phone or WhatsApp. We will confirm your requirement and dispatch a nearby professional in minutes.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <a
                href={VIKASA_CONFIG.telUrl}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white text-slate-900 font-bold text-sm shadow-md hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
              >
                <PhoneCall className="w-4 h-4 text-emerald-700" />
                <span>Call Helpline: {VIKASA_CONFIG.phoneDisplay}</span>
              </a>

              <a
                href={VIKASA_CONFIG.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Clean, Elegant Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 px-4 text-xs border-t border-slate-900">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Logo and Tagline */}
            <div className="md:col-span-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm ring-1 ring-emerald-500/30 shrink-0">
                  <Image
                    src={VIKASA_CONFIG.logoPath}
                    alt="Vikasa Interior Logo"
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div>
                  <span className="text-base font-black text-white block">VIKASA</span>
                  <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold">
                    Interior & Home Services
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Salem&apos;s verified home service coordination platform. Connecting households with certified plumbers, electricians, carpenters, AC technicians, and interior trade experts.
              </p>

              <div className="pt-2 text-xs font-semibold text-slate-300 space-y-1">
                <p>📍 Fairlands, Salem, Tamil Nadu - 636016</p>
                <p>📞 Contact: <a href={VIKASA_CONFIG.telUrl} className="text-emerald-400 hover:underline">{VIKASA_CONFIG.phoneDisplay}</a></p>
                <p>💬 WhatsApp: <a href={VIKASA_CONFIG.whatsappUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">{VIKASA_CONFIG.phone}</a></p>
              </div>
            </div>

            {/* Quick Links */}
            <div className="md:col-span-3 space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Quick Navigation</h4>
              <ul className="space-y-2 pt-1 text-slate-400">
                <li>
                  <Link href="/request" className="hover:text-emerald-400 transition-colors">
                    Book a Service
                  </Link>
                </li>
                <li>
                  <a href="#technicians" className="hover:text-emerald-400 transition-colors">
                    Certified Technicians
                  </a>
                </li>
                <li>
                  <Link href="/track" className="hover:text-emerald-400 transition-colors">
                    Track Your Request
                  </Link>
                </li>
                <li>
                  <Link href="/technician" className="text-amber-400 hover:text-amber-300 transition-colors font-medium">
                    Technician Portal (Today's Jobs)
                  </Link>
                </li>
                <li>
                  <Link href="/worker-register" className="hover:text-emerald-400 transition-colors">
                    Join as a Technician
                  </Link>
                </li>
              </ul>
            </div>

            {/* Service Areas */}
            <div className="md:col-span-4 space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Service Coverage in Salem</h4>
              <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] text-slate-400">
                {VIKASA_CONFIG.serviceAreas.map((loc) => (
                  <span key={loc} className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                    {loc}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
            <p>© {new Date().getFullYear()} VIKASA Interior & Home Services. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href="/track" className="hover:text-white transition-colors">Track Request</Link>
              <Link href="/technician" className="hover:text-amber-400 transition-colors">Technician Portal</Link>
              <Link href="/worker-register" className="hover:text-white transition-colors">Join as Worker</Link>
              <Link href="/admin/dashboard" className="hover:text-white transition-colors">Admin Login</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* 9. Mobile Sticky Bottom Quick-Bar (Always 1-Tap Away on Mobile!) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2.5 flex items-center justify-between gap-2 shadow-lg">
        <a
          href={VIKASA_CONFIG.telUrl}
          className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
        >
          <Phone className="w-3.5 h-3.5 text-emerald-600" />
          <span>Call ({VIKASA_CONFIG.phone})</span>
        </a>

        <a
          href={VIKASA_CONFIG.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="py-2.5 px-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
        >
          <MessageCircle className="w-4 h-4 text-emerald-600" />
          <span>WhatsApp</span>
        </a>

        <Link
          href="/request"
          className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
        >
          <span>Book Now</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
