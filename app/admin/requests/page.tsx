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
} from 'lucide-react';

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
      r.service_name.toLowerCase().includes(search.toLowerCase());

    if (!matchSearch) return false;
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (sourceFilter !== 'ALL' && r.source !== sourceFilter) return false;
    return true;
  });

  return (
    <div className="flex-1 bg-slate-100 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            Service Request Registry
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete searchable directory of all customer requests, marketing channels, and assignment status.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search #, name, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">New</option>
            <option value="CUSTOMER_TO_CALL">Customer To Call</option>
            <option value="CUSTOMER_CONFIRMED">Customer Confirmed</option>
            <option value="WORKER_CONTACTING">Worker Contacting</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700"
          >
            <option value="ALL">All Sources</option>
            <option value="META">Meta Ads</option>
            <option value="ORGANIC">Organic</option>
            <option value="DIRECT">Direct</option>
            <option value="REFERRAL">Referral</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold text-[10px]">
              <tr>
                <th className="py-3 px-4">Req #</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Service</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Urgency</th>
                <th className="py-3 px-4">Attribution</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filtered.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    #{req.request_number}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{req.customer_name}</div>
                    <div className="text-[11px] font-mono text-emerald-800 font-semibold">{req.customer_phone}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{req.service_name}</div>
                    <div className="text-[10px] text-slate-400">{req.category_name}</div>
                  </td>
                  <td className="py-3 px-4 max-w-xs truncate text-slate-600">
                    {req.formatted_address}
                  </td>
                  <td className="py-3 px-4">
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
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                      {req.source}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                      {req.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href="/admin/operations"
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px]"
                    >
                      <Radio className="w-3 h-3" />
                      <span>Dispatch</span>
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
