'use client';

import React from 'react';
import Link from 'next/link';
import {
  HelpCircle,
  PhoneCall,
  UserCheck,
  CheckCircle2,
  Users,
  FileText,
  LayoutDashboard,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  MessageCircle,
  MapPin,
  Clock,
  CheckCircle,
  Lightbulb,
} from 'lucide-react';

export default function AdminGuidePage() {
  const steps = [
    {
      num: '1',
      title: 'New Customer Inquiry Arrives',
      subtitle: 'Where leads appear and what you need to check first',
      badge: 'Step 1 • First 5 Minutes',
      color: 'amber',
      description:
        'When a customer fills the booking form on the website, their request immediately shows up in your Overview and Bookings tab as a "New Inquiry".',
      checklist: [
        'Open the "Overview" or "Bookings" page to see the latest incoming ticket.',
        'Review the client’s name, phone number, address in Salem, and their problem description.',
        'Check their preferred arrival date and time slot.',
      ],
      quickLink: '/admin/requests',
      quickLabel: 'View Bookings',
    },
    {
      num: '2',
      title: 'Call the Client to Confirm',
      subtitle: 'Quick 1-minute confirmation call or WhatsApp chat',
      badge: 'Step 2 • Customer Confirmation',
      color: 'emerald',
      description:
        'Never assign a technician without a quick confirmation call. Make sure someone will be home and confirm the repair requirement.',
      checklist: [
        'Click the green "Call" button to dial directly from your mobile, or click "WhatsApp" to send a prefilled confirmation message.',
        'Politely verify the address and ensure the customer is ready for the technician.',
        'Click "Confirm Requirement" on the ticket to move it to the technician matching stage.',
      ],
      quickLink: '/admin/contacts',
      quickLabel: 'Open Client Contacts',
    },
    {
      num: '3',
      title: 'Assign Nearest Qualified Technician',
      subtitle: 'Match the best electrician, plumber, or carpenter in Salem',
      badge: 'Step 3 • Technician Dispatch',
      color: 'blue',
      description:
        'The system automatically sorts verified technicians based on their trade skills and proximity to the customer’s locality.',
      checklist: [
        'Check the list of available technicians under the request.',
        'Call Technician #1 using the 1-click phone button.',
        'If they are ready to take the job, tap "Assign Technician". The job is now live!',
      ],
      quickLink: '/admin/workers',
      quickLabel: 'View Service Team',
    },
    {
      num: '4',
      title: 'Monitor & Complete the Service',
      subtitle: 'Close the loop when the job is done',
      badge: 'Step 4 • Job Completion',
      color: 'teal',
      description:
        'Once the technician visits the customer’s home and completes the repair or installation, mark the ticket complete.',
      checklist: [
        'Technician finishes the work at customer’s residence.',
        'Open the booking ticket and tap "Mark Completed".',
        'The technician is automatically freed up back to "Available" status for next jobs.',
      ],
      quickLink: '/admin/requests',
      quickLabel: 'Manage Requests',
    },
  ];

  const faqs = [
    {
      q: 'Where can I find client or technician phone numbers instantly?',
      a: 'Go to the "Contacts" tab in the top navigation. It gives you a clean phonebook with 1-tap Call and WhatsApp buttons for both Customers and Technicians.',
    },
    {
      q: 'Can I use WhatsApp from my laptop or desktop?',
      a: 'Yes! Clicking the WhatsApp button opens WhatsApp Web on your computer, or the WhatsApp app if you are browsing on your mobile or tablet.',
    },
    {
      q: 'How do I add or verify a new technician?',
      a: 'Go to the "Service Team" tab. You can review pending technician registrations, verify their trade credentials, and toggle their status between Available, Busy, and Offline.',
    },
    {
      q: 'Is the admin panel safe from public website visitors?',
      a: 'Yes. All links to the admin console have been removed from the public website, and the admin portal requires secure login credentials (admin@vikasa.com).',
    },
  ];

  return (
    <div className="flex-1 bg-slate-100 p-3 sm:p-6 space-y-8 max-w-5xl mx-auto w-full">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Operator Cheat Sheet</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          Vikasa Admin Panel User Guide
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
          No complex jargon or rocket science. Here is the straightforward 4-step workflow to operate incoming bookings, coordinate with customers, and dispatch technicians smoothly.
        </p>

        <div className="pt-2 flex flex-wrap gap-3">
          <Link
            href="/admin/dashboard"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <span>Go to Overview Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/admin/contacts"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5"
          >
            <span>Open Contacts Directory</span>
          </Link>
        </div>
      </div>

      {/* Visual 4-Step Walkthrough */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <span>The 4 Simple Daily Steps</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {steps.map((step) => (
            <div
              key={step.num}
              className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="w-9 h-9 rounded-2xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-emerald-600/20">
                    {step.num}
                  </span>
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                    {step.badge}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-black text-slate-900">{step.title}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{step.subtitle}</p>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{step.description}</p>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-700 block">Checklist:</span>
                  {step.checklist.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <Link
                  href={step.quickLink}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <span>{step.quickLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-black text-slate-900">Frequently Asked Questions</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {faqs.map((faq, i) => (
            <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5">
              <h4 className="text-xs font-bold text-slate-900">{faq.q}</h4>
              <p className="text-xs text-slate-600 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
