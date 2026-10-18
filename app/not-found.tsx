import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Home, ArrowLeft, PhoneCall, MessageCircle, Sparkles } from 'lucide-react';
import { VIKASA_CONFIG } from '@/lib/constants';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-16 text-slate-900">
      <div className="max-w-md w-full text-center space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-xl shadow-slate-950/5">
        {/* Logo */}
        <div className="inline-flex items-center justify-center">
          <Image
            src={VIKASA_CONFIG.logoPath}
            alt="Vikasa Interiors Logo"
            width={56}
            height={56}
            className="rounded-2xl shadow-sm ring-2 ring-emerald-500/20 object-cover"
          />
        </div>

        {/* 404 Header */}
        <div className="space-y-2">
          <span className="text-xs font-black tracking-widest text-emerald-600 uppercase bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Error 404
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Page Not Found
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            The page you are looking for might have been moved, renamed, or is temporarily unavailable. Let us help you find what you need.
          </p>
        </div>

        {/* Navigation Action Buttons */}
        <div className="pt-2 space-y-2.5">
          <Link
            href="/"
            className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Return to Homepage</span>
          </Link>

          <Link
            href="/request"
            className="w-full py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Book an Interior Consultation</span>
          </Link>
        </div>

        {/* Direct Helpline */}
        <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-2">
          <p className="font-semibold text-slate-700">Need immediate assistance in Erode?</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={VIKASA_CONFIG.telUrl}
              className="font-bold text-emerald-700 hover:underline flex items-center gap-1.5"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>{VIKASA_CONFIG.phoneDisplay}</span>
            </a>
            <span className="hidden sm:inline text-slate-300">•</span>
            <a
              href={VIKASA_CONFIG.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-emerald-700 hover:underline flex items-center gap-1.5"
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
