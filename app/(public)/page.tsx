'use client';

import React, { useState } from 'react';
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
  ShieldCheck,
  ArrowRight,
  MessageCircle,
  Phone,
  Layout,
  HelpCircle,
  CheckCircle2,
  MapPin,
  Star,
  Layers,
  Ruler,
  Clock,
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

const PROJECT_SHOWCASE = [
  {
    title: 'Modern Modular Kitchen',
    subtitle: 'Perundurai Road, Erode',
    image: '/showcase/modular_kitchen_erode.webp',
    alt: 'Luxury modular kitchen interior design in Erode with quartz countertop and fluted cabinets',
    tags: ['BWP Marine Ply', 'Soft-Close Hardware', 'Quartz Countertop', 'Built-in Pantry'],
    description:
      'Engineered for Indian cooking styles with 710-grade boiling waterproof plywood, scratch-resistant acrylic shutters, and ergonomic pull-out tandem boxes.',
    categorySlug: 'interior-design',
  },
  {
    title: 'Custom Floor-to-Ceiling Wardrobe',
    subtitle: 'Thindal, Erode',
    image: '/showcase/custom_wardrobe_erode.webp',
    alt: 'Bespoke floor to ceiling wardrobe with fluted oak panels and concealed LED lighting in Erode',
    tags: ['Fluted Oak Panels', 'Concealed Warm LEDs', 'Vanity Integration', 'Anti-Warp Frame'],
    description:
      'Seamless master bedroom storage featuring calibrated plywood core, anti-warp profile handles, smoked glass display cabinets, and motion-sensing LED wardrobe lighting.',
    categorySlug: 'interior-design',
  },
  {
    title: 'Luxury Living & TV Entertainment Unit',
    subtitle: 'Bhavani Road, Erode',
    image: '/showcase/living_room_erode.webp',
    alt: 'Contemporary living room TV entertainment unit with acoustic fluted paneling in Erode',
    tags: ['Acoustic Wall Paneling', 'Floating Console', 'Marble Texture', 'Cable Management'],
    description:
      'Statement living room focal point with floating wooden media console, concealed ambient cove lighting, Italian marble accents, and hidden wire management.',
    categorySlug: 'interior-design',
  },
];

export default function LandingPage() {
  const router = useRouter();
  const [selectedServiceCategory, setSelectedServiceCategory] = useState(INITIAL_CATEGORIES[0]?.id || 'cat-interior');
  const [quickArea, setQuickArea] = useState('Thindal');

  const openBookingForService = (catSlug?: string) => {
    router.push(`/request${catSlug ? `?cat=${catSlug}` : ''}`);
  };

  const handleHeroQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cat = INITIAL_CATEGORIES.find((c) => c.id === selectedServiceCategory);
    router.push(`/request?cat=${cat?.slug || 'interior-design'}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-600 selection:text-white pb-20 sm:pb-0">
      {/* 1. Top Announcement & Direct Helpline Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium text-slate-200">
              Serving Erode, Tamil Nadu & Surrounding Regions • Direct Factory Plywood & Turnkey Interiors
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <a
              href={VIKASA_CONFIG.telUrl}
              className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
              aria-label={`Call Vikasa Interiors at ${VIKASA_CONFIG.phoneDisplay}`}
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
              aria-label="Chat with Vikasa Interiors on WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Consultation</span>
            </a>
          </div>
        </div>
      </div>

      {/* 2. Navigation Header with Real Vikasa Logo */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
          {/* Logo & Brand Identity */}
          <Link href="/" className="flex items-center gap-3 group" aria-label="Vikasa Interiors Home">
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden shadow-md ring-2 ring-emerald-600/20 group-hover:scale-105 transition-transform shrink-0 bg-slate-900 flex items-center justify-center">
              <Image
                src={VIKASA_CONFIG.logoPath}
                alt="Vikasa Interiors Logo"
                width={48}
                height={48}
                className="object-cover w-full h-full"
                priority
              />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900 block leading-tight group-hover:text-emerald-700 transition-colors">
                VIKASA INTERIORS
              </span>
              <span className="text-[11px] font-bold text-emerald-700 tracking-wider uppercase block">
                Interior Design & Plywood Craftsmanship
              </span>
            </div>
          </Link>

          {/* Center Navigation Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600" aria-label="Primary Navigation">
            <a href="#portfolio" className="hover:text-emerald-700 transition-colors">
              Portfolio
            </a>
            <a href="#services" className="hover:text-emerald-700 transition-colors">
              Services
            </a>
            <a href="#process" className="hover:text-emerald-700 transition-colors">
              Our Process
            </a>
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
              aria-label={`Call ${VIKASA_CONFIG.phoneDisplay}`}
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
              aria-label="WhatsApp enquiry"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp</span>
            </a>

            {/* Main Consultation Button */}
            <Link
              href="/request"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all flex items-center gap-1.5"
            >
              <span>Book Consultation</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* 3. Hero Section with Quick Consultation Form */}
      <section className="relative overflow-hidden pt-8 pb-16 px-4 bg-gradient-to-b from-emerald-50/70 via-white to-slate-50 border-b border-slate-200/60">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            {/* Hero Left Content */}
            <div className="lg:col-span-6 space-y-5 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-bold shadow-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Erode&apos;s Trusted Interior & Plywood Specialists</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-[1.18]">
                Bespoke Interior Design & <br className="hidden sm:inline" />
                <span className="text-emerald-700">Master Plywood Craftsmanship</span> in Erode
              </h1>

              <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Elevate your residential and commercial spaces with turnkey modular kitchens, floor-to-ceiling wardrobes, and acoustic TV units. Built with 100% calibrated boiling-waterproof marine plywood and factory-grade precision.
              </p>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-2 pt-2 max-w-md mx-auto lg:mx-0">
                <div className="p-3 bg-white rounded-2xl border border-slate-200 text-center shadow-xs">
                  <span className="block text-emerald-700 font-black text-base sm:text-lg">IS:710</span>
                  <span className="text-[11px] text-slate-500 font-medium">BWP Marine Ply</span>
                </div>
                <div className="p-3 bg-white rounded-2xl border border-slate-200 text-center shadow-xs">
                  <span className="block text-emerald-700 font-black text-base sm:text-lg">Factory</span>
                  <span className="text-[11px] text-slate-500 font-medium">Machine Finish</span>
                </div>
                <div className="p-3 bg-white rounded-2xl border border-slate-200 text-center shadow-xs">
                  <span className="block text-emerald-700 font-black text-base sm:text-lg">Turnkey</span>
                  <span className="text-[11px] text-slate-500 font-medium">Erode & Beyond</span>
                </div>
              </div>

              {/* Direct Call / WhatsApp Notice */}
              <div className="pt-2 text-xs text-slate-500 flex flex-wrap items-center justify-center lg:justify-start gap-3">
                <span>Prefer direct phone consultation?</span>
                <a href={VIKASA_CONFIG.telUrl} className="font-bold text-emerald-700 hover:underline flex items-center gap-1">
                  <PhoneCall className="w-3.5 h-3.5" /> {VIKASA_CONFIG.phoneDisplay}
                </a>
              </div>
            </div>

            {/* Hero Right: Fast Enquiry & Estimate Widget */}
            <div className="lg:col-span-6">
              <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-xl shadow-emerald-950/5 relative">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-black text-slate-900">
                    Get Free Design Consultation & Estimate
                  </h2>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    Zero Obligation
                  </span>
                </div>

                <form onSubmit={handleHeroQuickSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-700">
                      Select Interior Scope or Service:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {INITIAL_CATEGORIES.map((cat) => {
                        const Icon = iconMap[cat.icon || 'Wrench'] || Layout;
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

                  {/* Area Quick Selection */}
                  <div className="space-y-1.5 pt-1">
                    <label className="text-xs font-bold text-slate-700">
                      Your Erode Project Location:
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {VIKASA_CONFIG.serviceAreas.slice(0, 6).map((loc) => (
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
                      <span>Continue With Selected Scope</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <a
                      href={VIKASA_CONFIG.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center justify-center gap-1.5 transition-all text-center"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-600" />
                      <span>Instant Consultation via WhatsApp ({VIKASA_CONFIG.phone})</span>
                    </a>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Portfolio Showcase Section (Photorealistic Gallery) */}
      <section id="portfolio" className="py-16 px-4 max-w-6xl mx-auto border-b border-slate-200/70">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-2 border border-emerald-200">
              <Layers className="w-3.5 h-3.5" />
              <span>Real Workmanship Standards</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Featured Interior Works in Erode
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
              Take a tour of our custom modular kitchens, bespoke bedroom wardrobes, and architectural living room consoles designed and fabricated for homes in Erode.
            </p>
          </div>

          <Link
            href="/request"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 self-start md:self-auto"
          >
            <span>Request Custom 3D Design</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PROJECT_SHOWCASE.map((project, idx) => (
            <div
              key={idx}
              className="bg-white rounded-3xl overflow-hidden border border-slate-200/90 shadow-md hover:shadow-xl hover:border-emerald-500/50 transition-all flex flex-col group"
            >
              <div className="relative h-56 w-full overflow-hidden bg-slate-100">
                <Image
                  src={project.image}
                  alt={project.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  <span>{project.subtitle}</span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                    {project.description}
                  </p>

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-semibold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-100"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    href={`/request?cat=${project.categorySlug}`}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                  >
                    <span>Enquire For This Concept</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Comprehensive Services Grid */}
      <section id="services" className="py-16 px-4 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              Comprehensive Capabilities
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              Interior Design & Home Trade Solutions
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              From complete turnkey villa interiors to individual trade works in Erode and surrounding districts.
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {INITIAL_CATEGORIES.map((cat) => {
            const Icon = iconMap[cat.icon || 'Wrench'] || Layout;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => openBookingForService(cat.slug)}
                className="group bg-white rounded-2xl p-5 border border-slate-200 hover:border-emerald-500 hover:shadow-lg transition-all flex flex-col justify-between text-left cursor-pointer"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors shrink-0 mb-3">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {cat.description}
                  </p>
                </div>
                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-700">
                  <span>Explore & Book</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 6. Simple 4-Step Working Process */}
      <section id="process" className="py-16 px-4 max-w-5xl mx-auto border-t border-slate-200/70">
        <div className="text-center mb-12">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
            Our Proven Workflow
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            From Blueprint to Flawless Installation
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl mx-auto">
            Transparent milestones, certified plywood raw materials, and dedicated supervisor oversight for every project.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center mb-3">
              01
            </div>
            <h3 className="text-sm font-bold text-slate-900">Site Measurement</h3>
            <p className="text-xs text-slate-500 mt-1">
              Our engineer visits your property in Erode to assess space, plumbing, and electrical points.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center mb-3">
              02
            </div>
            <h3 className="text-sm font-bold text-slate-900">3D Design & Materials</h3>
            <p className="text-xs text-slate-500 mt-1">
              Detailed 3D layout visualization, laminate/veneer selection, and itemized transparent pricing.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center mb-3">
              03
            </div>
            <h3 className="text-sm font-bold text-slate-900">Precision Fabrication</h3>
            <p className="text-xs text-slate-500 mt-1">
              Factory edge-banding, calibrated marine ply sizing, and high-precision CNC woodwork.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center mb-3">
              04
            </div>
            <h3 className="text-sm font-bold text-slate-900">Clean On-Site Fitting</h3>
            <p className="text-xs text-slate-500 mt-1">
              Dust-minimized installation by master carpenters with 10-point quality audit and handover.
            </p>
          </div>
        </div>
      </section>

      {/* 7. Call & WhatsApp Direct Consultation Banner */}
      <section className="py-12 px-4 max-w-6xl mx-auto">
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-900 to-slate-900 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-xl">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
              Erode Direct Helpline
            </span>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              Ready to Discuss Your Home or Commercial Interior?
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed">
              Speak directly with our senior interior design consultant. We provide free site inspections, material samples, and transparent project estimates across Erode.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <a
                href={VIKASA_CONFIG.telUrl}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white text-slate-900 font-bold text-sm shadow-md hover:bg-emerald-50 transition-all flex items-center justify-center gap-2"
                aria-label={`Call Vikasa helpline at ${VIKASA_CONFIG.phoneDisplay}`}
              >
                <PhoneCall className="w-4 h-4 text-emerald-700" />
                <span>Call Helpline: {VIKASA_CONFIG.phoneDisplay}</span>
              </a>

              <a
                href={VIKASA_CONFIG.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                aria-label="Direct WhatsApp consultation"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Elegant Footer with Verified Business Details */}
      <footer className="bg-slate-950 text-slate-400 py-12 px-4 text-xs border-t border-slate-900">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Logo and Tagline */}
            <div className="md:col-span-5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden shadow-sm ring-1 ring-emerald-500/30 shrink-0 bg-slate-900 flex items-center justify-center">
                  <Image
                    src={VIKASA_CONFIG.logoPath}
                    alt="Vikasa Interiors Logo"
                    width={40}
                    height={40}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div>
                  <span className="text-base font-black text-white block">VIKASA INTERIORS</span>
                  <span className="text-[10px] text-emerald-400 uppercase tracking-wider font-semibold">
                    Interior Design & Plywood Craftsmanship
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Erode&apos;s specialist in custom modular kitchens, designer wardrobes, living room entertainment units, and complete turnkey residential and commercial interiors.
              </p>

              <div className="pt-2 text-xs font-semibold text-slate-300 space-y-1">
                <p>📍 {VIKASA_CONFIG.address.street}, {VIKASA_CONFIG.address.city}, {VIKASA_CONFIG.address.state} - {VIKASA_CONFIG.address.postalCode}</p>
                <p>📞 Phone: <a href={VIKASA_CONFIG.telUrl} className="text-emerald-400 hover:underline">{VIKASA_CONFIG.phoneDisplay}</a></p>
                <p>💬 WhatsApp: <a href={VIKASA_CONFIG.whatsappUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">{VIKASA_CONFIG.phone}</a></p>
                <p>🕒 Working Hours: Mon – Sat: 9:00 AM – 8:00 PM (Sun By Appointment)</p>
              </div>
            </div>

            {/* Quick Links */}
            <div className="md:col-span-3 space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Quick Navigation</h4>
              <ul className="space-y-2 pt-1 text-slate-400">
                <li>
                  <Link href="/request" className="hover:text-emerald-400 transition-colors">
                    Request Consultation
                  </Link>
                </li>
                <li>
                  <a href="#portfolio" className="hover:text-emerald-400 transition-colors">
                    Portfolio Showcase
                  </a>
                </li>
                <li>
                  <a href="#services" className="hover:text-emerald-400 transition-colors">
                    Interior & Trade Services
                  </a>
                </li>
                <li>
                  <a href="#process" className="hover:text-emerald-400 transition-colors">
                    How We Work
                  </a>
                </li>
                <li>
                  <Link href="/track" className="hover:text-emerald-400 transition-colors">
                    Track Your Project
                  </Link>
                </li>
              </ul>
            </div>

            {/* Service Areas */}
            <div className="md:col-span-4 space-y-2">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">Service Coverage in Erode & Surrounding</h4>
              <div className="flex flex-wrap gap-1.5 pt-1 text-[11px] text-slate-400">
                {VIKASA_CONFIG.serviceAreas.map((loc) => (
                  <span key={loc} className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                    {loc}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 pt-2">
                Outstation turnkey projects across Tamil Nadu supported upon prior consultation.
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-500 text-[11px]">
            <p>© {new Date().getFullYear()} Vikasa Interiors. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href="/track" className="hover:text-white transition-colors">Track Request</Link>
              <Link href="/technician" className="hover:text-amber-400 transition-colors">Technician Portal</Link>
              <Link href="/worker-register" className="hover:text-white transition-colors">Join as Worker</Link>
              <Link href="/admin/dashboard" className="hover:text-white transition-colors">Admin Login</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* 9. Mobile Sticky Bottom Quick-Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2.5 flex items-center justify-between gap-2 shadow-lg">
        <a
          href={VIKASA_CONFIG.telUrl}
          className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          aria-label={`Call ${VIKASA_CONFIG.phoneDisplay}`}
        >
          <Phone className="w-3.5 h-3.5 text-emerald-600" />
          <span>Call Us</span>
        </a>

        <a
          href={VIKASA_CONFIG.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="py-2.5 px-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
          aria-label="WhatsApp Us"
        >
          <MessageCircle className="w-4 h-4 text-emerald-600" />
          <span>WhatsApp</span>
        </a>

        <Link
          href="/request"
          className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
        >
          <span>Consultation</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
