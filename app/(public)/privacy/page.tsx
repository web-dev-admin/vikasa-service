import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ShieldCheck, ChevronLeft, Lock, Eye, FileText, Phone } from 'lucide-react';
import { VIKASA_CONFIG } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Privacy Policy | Vikasa Services & Interiors',
  description:
    'Privacy Policy for Vikasa Services & Interiors (vikasaservices.in). Learn how we handle customer and technician data, cookies, and advertising analytics with complete confidentiality.',
  alternates: {
    canonical: '/privacy',
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 text-slate-800">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-8">
          <div className="border-b border-slate-100 pb-6 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Customer &amp; Partner Data Protection</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-xs text-slate-500">
              Last updated: November 2026 • Effective for vikasaservices.in
            </p>
          </div>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>1. Introduction &amp; Scope</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Vikasa Services &amp; Interiors (&quot;Vikasa&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates{' '}
              <a href="https://vikasaservices.in" className="text-emerald-700 font-semibold underline">
                vikasaservices.in
              </a>
              . This Privacy Policy outlines how we collect, process, and safeguard the personal information of customers booking home trade services and turnkey interiors, as well as technicians applying to join our verified partner network across Tamil Nadu.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Eye className="w-4 h-4 text-emerald-600" />
              <span>2. Information We Collect</span>
            </h2>
            <ul className="list-disc pl-5 text-xs sm:text-sm text-slate-600 space-y-1.5 leading-relaxed">
              <li>
                <strong>Customer Bookings:</strong> Name, 10-digit mobile number, preferred service trade, address, district, and optional device GPS coordinates (requested only upon explicit user button click for address autofill).
              </li>
              <li>
                <strong>Technician Registrations:</strong> Full name, calling mobile number, WhatsApp number, trade specialization, years of experience, and operational district/locality.
              </li>
              <li>
                <strong>Technical &amp; Analytics Data:</strong> IP address, device browser type, referring URL, and session analytics collected via standard browser cookies.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>3. Cookies &amp; Advertising Analytics (Meta Pixel)</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Our website utilizes cookies and the Meta (Facebook) Pixel to measure advertising efficacy, understand visitor interactions, and optimize campaign delivery on Meta platforms (Facebook and Instagram).
            </p>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              The Meta Pixel records anonymized page views and conversion actions (such as completed technician registrations). You may manage or opt out of personalized ad targeting via your{' '}
              <a
                href="https://www.facebook.com/adpreferences"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-700 font-semibold underline"
              >
                Facebook Ad Preferences
              </a>{' '}
              or through your browser&apos;s cookie privacy settings.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600" />
              <span>4. How We Use and Protect Your Information</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              We operate on a 100% human-coordinated dispatch model. We do NOT sell, rent, or publicly broadcast your personal phone number or address to third-party marketing directories. Customer details are only shared directly with the assigned supervisor or verified technician dispatched to execute the requested service.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>5. Contact Our Privacy &amp; Coordination Desk</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              If you have any questions about our privacy practices, wish to update your details, or request data deletion, please contact our administrative desk:
            </p>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-1">
              <p><strong>Vikasa Services &amp; Interiors</strong></p>
              <p>{VIKASA_CONFIG.address.street}, {VIKASA_CONFIG.address.city}, {VIKASA_CONFIG.address.state} - {VIKASA_CONFIG.address.postalCode}</p>
              <p>Helpline: <a href={VIKASA_CONFIG.telUrl} className="text-emerald-700 font-semibold">{VIKASA_CONFIG.phoneDisplay}</a></p>
              <p>Website: <a href={VIKASA_CONFIG.websiteUrl} className="text-emerald-700 font-semibold">{VIKASA_CONFIG.websiteUrl}</a></p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
