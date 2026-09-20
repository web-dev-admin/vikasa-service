'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { dataStore } from '@/lib/data/store';
import { ServiceRequest } from '@/types';
import {
  FileText,
  Search,
  Filter,
  ArrowRight,
  Phone,
  MapPin,
  Flame,
  Radio,
  Clock,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  PhoneCall,
  ChevronRight,
} from 'lucide-react';
import { getTelUrl, getWhatsAppUrl, generateCustomerWhatsAppMessage } from '@/lib/utils/phone';

export default function AdminRequestsPage() {
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');

  useEffect(() => {
    setRequests(dataStore.getRequests());
  }, []);

  const filtered = requests.filter((r) => {
    const matchSearch =
      r.request_number.toString().includes(search) ||
      r.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      r.customer_phone.includes(search) ||
      r.service_name.toLowerCase().includes(search.toLowerCase()) ||
      r.formatted_address.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (sourceFilter !== 'ALL' && r.source !== sourceFilter) return false;
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'NEW':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">NEW LEAD</span>;
      case 'CUSTOMER_TO_CALL':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 animate-pulse">CALL CUST</span>;
      case 'CUSTOMER_CONFIRMED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">CONFIRMED</span>;
      case 'MATCHING':
      case 'WORKER_CONTACTING':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">MATCHING TECH</span>;
      case 'ASSIGNED':
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-700 text-white">ASSIGNED</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">COMPLETED</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="flex-1 bg-slate-100 p-3 sm:p-6 space-y-5 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            Service Bookings Registry
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete database of all incoming customer requests, marketing channels, and job status.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search #, name, phone, area..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white transition-colors"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by Status"
            className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="CUSTOMER_TO_CALL">To Call Customer</option>
            <option value="CUSTOMER_CONFIRMED">Customer Confirmed</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            aria-label="Filter by Channel"
            className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700"
          >
            <option value="ALL">All Channels</option>
            <option value="META">Meta Ads</option>
            <option value="ORGANIC">Organic</option>
            <option value="DIRECT">Direct</option>
            <option value="REFERRAL">Referral</option>
          </select>
        </div>
      </div>

      {/* MOBILE CARD VIEW (VISIBLE ON PHONES) */}
      <div className="md:hidden space-y-3">
        {filtered.map((req) => (
          <div
            key={req.id}
            className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="font-mono font-bold text-xs text-slate-400">
                  #{req.request_number}
                </span>
                <h2 className="text-base font-black text-slate-900 leading-tight mt-0.5">
                  {req.service_name}
                </h2>
              </div>
              <div className="flex flex-col items-end gap-1">
                {getStatusBadge(req.status)}
                {req.urgency === 'emergency' && (
                  <span className="text-[10px] font-black text-red-600 bg-red-50 px-2 py-0.2 rounded border border-red-200">
                    EMERGENCY
                  </span>
                )}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-700">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{req.customer_name}</span>
                <span className="font-mono text-emerald-800 font-bold">{req.customer_phone}</span>
              </div>
              <div className="text-slate-500 flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                <span className="truncate">{req.formatted_address}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <a
                  href={getTelUrl(req.customer_phone)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                  title="Call Customer"
                >
                  <PhoneCall className="w-4 h-4 text-emerald-600" />
                </a>
                <a
                  href={getWhatsAppUrl(
                    req.customer_phone,
                    generateCustomerWhatsAppMessage(req.customer_name, req.request_number, req.service_name)
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                  title="WhatsApp Customer"
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
              </div>

              <Link
                href="/admin/operations"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
              >
                <span>Open Live Dispatch</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-200 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Req #</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Service</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Urgency</th>
                <th className="py-3.5 px-4">Source</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Dispatch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filtered.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-black text-slate-900">
                    #{req.request_number}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{req.customer_name}</div>
                    <div className="text-[11px] font-mono text-emerald-800 font-bold">{req.customer_phone}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{req.service_name}</div>
                    <div className="text-[10px] text-slate-400">{req.category_name}</div>
                  </td>
                  <td className="py-3.5 px-4 max-w-xs truncate text-slate-600">
                    {req.formatted_address}
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        req.urgency === 'emergency'
                          ? 'bg-red-100 text-red-800'
                          : req.urgency === 'high'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {req.urgency.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                      {req.source}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">{getStatusBadge(req.status)}</td>
                  <td className="py-3.5 px-4 text-right">
                    <Link
                      href="/admin/operations"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
                    >
                      <span>Dispatch</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
