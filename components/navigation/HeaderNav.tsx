'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  PhoneCall,
  MessageCircle,
  ArrowRight,
  Menu,
  X,
  Layers,
  Wrench,
  Clock,
  Search,
  UserCheck,
  ChevronRight,
  Phone,
  HelpCircle,
} from 'lucide-react';
import { VIKASA_CONFIG } from '@/lib/constants';

export default function HeaderNav() {
  const [isOpen, setIsOpen] = useState(false);
  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const firstDrawerLinkRef = useRef<HTMLAnchorElement>(null);

  // Prevent background scrolling when mobile drawer is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      // Focus first link in drawer for keyboard a11y
      setTimeout(() => {
        firstDrawerLinkRef.current?.focus();
      }, 50);

      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Support Escape key to close drawer and return focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        toggleButtonRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const closeMenu = () => {
    setIsOpen(false);
    toggleButtonRef.current?.focus();
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between">
          {/* Logo & Brand Identity */}
          <Link
            href="/"
            className="flex items-center gap-2.5 sm:gap-3 group shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 rounded-xl"
            aria-label="Vikasa Interiors Home"
          >
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl overflow-hidden shadow-md ring-2 ring-emerald-600/20 group-hover:scale-105 transition-transform shrink-0 bg-slate-900 flex items-center justify-center">
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
              <span className="text-base sm:text-xl font-black tracking-tight text-slate-900 block leading-tight group-hover:text-emerald-700 transition-colors">
                VIKASA SERVICES
              </span>
              <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700 tracking-wider uppercase block">
                vikasaservices.in • Interiors &amp; Services
              </span>
            </div>
          </Link>

          {/* Center Navigation Links (Desktop) */}
          <nav
            className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-700"
            aria-label="Primary Desktop Navigation"
          >
            <a
              href="#portfolio"
              className="hover:text-emerald-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 rounded-md py-1 px-1"
            >
              Portfolio
            </a>
            <a
              href="#services"
              className="hover:text-emerald-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 rounded-md py-1 px-1"
            >
              Services
            </a>
            <a
              href="#process"
              className="hover:text-emerald-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 rounded-md py-1 px-1"
            >
              Our Process
            </a>
            <a
              href="#faq"
              className="hover:text-emerald-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 rounded-md py-1 px-1"
            >
              FAQ
            </a>
            <Link
              href="/track"
              className="hover:text-emerald-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 rounded-md py-1 px-1"
            >
              Track Request
            </Link>
          </nav>

          {/* Right Header CTAs & Mobile Hamburger */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Desktop Direct Call */}
            <a
              href={VIKASA_CONFIG.telUrl}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
              aria-label={`Call helpline at ${VIKASA_CONFIG.phoneDisplay}`}
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-600" />
              <span>{VIKASA_CONFIG.phone}</span>
            </a>

            {/* Desktop WhatsApp */}
            <a
              href={VIKASA_CONFIG.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
              aria-label="Direct WhatsApp consultation"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp</span>
            </a>

            {/* Main Consultation Button */}
            <Link
              href="/request"
              className="px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 active:scale-[0.98] transition-all flex items-center gap-1 sm:gap-1.5 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              <span className="hidden min-[380px]:inline">Consultation</span>
              <span className="min-[380px]:hidden">Book</span>
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Link>

            {/* Accessible Hamburger Toggle Button (Mobile only) */}
            <button
              ref={toggleButtonRef}
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 cursor-pointer shrink-0"
              aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isOpen}
              aria-controls="mobile-navigation-drawer"
            >
              {isOpen ? <X className="w-5 h-5 text-slate-900" /> : <Menu className="w-5 h-5 text-slate-800" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer & Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={closeMenu}
            aria-hidden="true"
          />

          {/* Slide-out Drawer */}
          <aside
            id="mobile-navigation-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Site Navigation"
            className="fixed top-0 right-0 bottom-0 w-[85%] max-w-sm bg-white shadow-2xl flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-250 z-50 overflow-y-auto"
          >
            {/* Drawer Header */}
            <div className="px-5 pt-[max(1.25rem,env(safe-area-inset-top))] pb-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center shrink-0">
                  <Image
                    src={VIKASA_CONFIG.logoPath}
                    alt="Vikasa Logo"
                    width={36}
                    height={36}
                    className="object-cover w-full h-full"
                  />
                </div>
                <div>
                  <span className="text-sm font-black text-slate-900 block leading-tight">
                    VIKASA SERVICES
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 tracking-wider uppercase block">
                    Navigation Menu
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={closeMenu}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1 cursor-pointer active:scale-95"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="p-4 space-y-1.5 flex-1" aria-label="Mobile Links">
              <a
                ref={firstDrawerLinkRef}
                href="#portfolio"
                onClick={closeMenu}
                className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-emerald-50/70 active:scale-[0.98] text-slate-800 hover:text-emerald-950 font-bold text-sm transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-sm font-bold">Portfolio Showcase</span>
                    <span className="block text-xs font-normal text-slate-600">Real completed works in Erode</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-600 transition-colors" />
              </a>

              <a
                href="#services"
                onClick={closeMenu}
                className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-emerald-50/70 active:scale-[0.98] text-slate-800 hover:text-emerald-950 font-bold text-sm transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-sm font-bold">Services &amp; Trades</span>
                    <span className="block text-xs font-normal text-slate-600">Kitchens, carpentry, plumbing &amp; more</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-600 transition-colors" />
              </a>

              <a
                href="#process"
                onClick={closeMenu}
                className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-emerald-50/70 active:scale-[0.98] text-slate-800 hover:text-emerald-950 font-bold text-sm transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-sm font-bold">Our 4-Step Process</span>
                    <span className="block text-xs font-normal text-slate-600">Site visit to installation</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-600 transition-colors" />
              </a>

              <a
                href="#faq"
                onClick={closeMenu}
                className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-emerald-50/70 active:scale-[0.98] text-slate-800 hover:text-emerald-950 font-bold text-sm transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-sm font-bold">Frequently Asked Questions</span>
                    <span className="block text-xs font-normal text-slate-600">Materials, estimates &amp; coverage</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-600 transition-colors" />
              </a>

              <Link
                href="/track"
                onClick={closeMenu}
                className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-emerald-50/70 active:scale-[0.98] text-slate-800 hover:text-emerald-950 font-bold text-sm transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Search className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-sm font-bold">Track Your Request</span>
                    <span className="block text-xs font-normal text-slate-600">Real-time job &amp; technician status</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-600 transition-colors" />
              </Link>

              <Link
                href="/worker-register"
                onClick={closeMenu}
                className="flex items-center justify-between p-3.5 rounded-2xl hover:bg-emerald-50/70 active:scale-[0.98] text-slate-800 hover:text-emerald-950 font-bold text-sm transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block text-sm font-bold">Join as Technician</span>
                    <span className="block text-xs font-normal text-slate-600">For skilled professionals</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-600 transition-colors" />
              </Link>
            </nav>

            {/* Drawer Footer Actions */}
            <div className="p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] border-t border-slate-100 bg-slate-50/50 space-y-2.5">
              <Link
                href="/request"
                onClick={closeMenu}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
              >
                <span>Book a Consultation</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href={VIKASA_CONFIG.telUrl}
                  className="py-2.5 px-3 rounded-xl bg-white border border-slate-200 text-slate-800 hover:bg-slate-100 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Call Us</span>
                </a>

                <a
                  href={VIKASA_CONFIG.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

