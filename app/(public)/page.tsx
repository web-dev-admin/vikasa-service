import React from 'react';
import Link from 'next/link';
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
  Headphones,
} from 'lucide-react';
import { INITIAL_CATEGORIES } from '@/lib/taxonomy/catalog';

const iconMap: { [key: string]: React.ElementType } = {
  Wrench,
  Zap,
  Hammer,
  Tv,
  Sparkles,
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-500 selection:text-white">
      {/* Top Notification Bar */}
      <div className="bg-emerald-900 text-emerald-100 text-xs py-2 px-4 text-center font-medium border-b border-emerald-800 flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span>Serving Salem, Tamil Nadu & Surrounding Areas • Operator-Dispatched Service</span>
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-black text-lg flex items-center justify-center shadow-md shadow-emerald-600/30">
              V
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900 block leading-none">
                VIKASA
              </span>
              <span className="text-[10px] font-bold text-emerald-700 tracking-wider uppercase">
                Service Dispatch
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/operations"
              className="text-xs font-semibold text-slate-600 hover:text-emerald-700 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-emerald-200 transition-colors hidden sm:inline-block"
            >
              Operator Login
            </Link>
            <Link
              href="/worker-register"
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg transition-colors hidden sm:inline-block"
            >
              Join as Worker
            </Link>
            <Link
              href="/request"
              className="text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
            >
              <span>Book Service</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section (Mobile-First, High Conversion) */}
      <section className="relative overflow-hidden pt-10 pb-16 px-4 bg-gradient-to-b from-emerald-50/40 via-white to-slate-50">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-bold tracking-wide">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            Controlled Operator Coordination
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
            Need a Trusted Local <br className="hidden sm:block" />
            <span className="text-emerald-600">Service Professional?</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            VIKASA helps connect customers with suitable local service professionals.
            Our dedicated coordinators confirm your exact requirement and dispatch verified nearby specialists.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/request"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-xl shadow-emerald-600/25 flex items-center justify-center gap-2.5 active:scale-[0.99] transition-all"
            >
              <span>Request a Service</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="tel:+914272334455"
              className="w-full sm:w-auto px-6 py-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-800 font-bold text-base border border-slate-200 shadow-sm flex items-center justify-center gap-2 transition-all"
            >
              <PhoneCall className="w-5 h-5 text-emerald-600" />
              <span>Contact VIKASA</span>
            </a>
          </div>

          {/* 3 Value Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-8 max-w-3xl mx-auto text-left">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 font-bold text-sm">
                1
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900">Request in 1 Minute</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Select service, set your pin, and submit without lengthy signup forms.
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 font-bold text-sm">
                2
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900">Operator Review</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  VIKASA coordinator calls you to verify requirement before assigning.
                </p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 font-bold text-sm">
                3
              </div>
              <div>
                <h2 className="text-xs font-bold text-slate-900">Nearby Dispatch</h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Closest available verified technician is assigned directly to your door.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Categories Section */}
      <section className="py-14 px-4 max-w-5xl mx-auto">
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            Available Service Categories
          </h2>
          <p className="text-sm text-slate-500">
            Select a trade category below to request a service in Salem.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {INITIAL_CATEGORIES.map((cat) => {
            const Icon = iconMap[cat.icon || 'Wrench'] || Wrench;
            return (
              <Link
                key={cat.id}
                href={`/request?cat=${cat.slug}`}
                className="group bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-500 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-3 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {cat.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-700">
                  <span>Book {cat.name}</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Business Workflow Callout */}
      <section className="py-12 px-4 bg-white border-y border-slate-200">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
              The VIKASA Difference
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
              Not an unmoderated marketplace. A managed dispatch service.
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              We never broadcast your phone number to dozens of random vendors. A dedicated VIKASA human operator reviews your case, contacts suitable professionals one-by-one, and assigns the confirmed specialist.
            </p>
          </div>

          <div className="w-full md:w-auto shrink-0 space-y-2">
            <Link
              href="/request"
              className="w-full md:w-auto px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
            >
              <span>Submit Your Requirement</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <div className="text-center">
              <Link
                href="/admin/operations"
                className="text-xs text-slate-500 hover:text-slate-900 underline"
              >
                Access Operator Dispatch Console →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-10 px-4 text-xs">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black text-sm flex items-center justify-center">
              V
            </div>
            <span className="font-bold text-white text-sm">VIKASA</span>
            <span>— Location-Based Service Coordination & Dispatch</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400">
            <Link href="/worker-register" className="hover:text-white transition-colors">
              Worker Registration
            </Link>
            <Link href="/admin/operations" className="hover:text-white transition-colors">
              Admin Operations
            </Link>
            <a href="tel:+914272334455" className="hover:text-white transition-colors">
              Helpline: +91 427 233 4455
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
