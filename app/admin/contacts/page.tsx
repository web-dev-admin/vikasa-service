'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { dataStore } from '@/lib/data/store';
import {
  STANDARDIZED_SERVICES,
  TAMIL_NADU_DISTRICTS,
  getStatusBadgeInfo,
  VIKASA_CONFIG,
} from '@/lib/constants';
import { Customer, Worker, ServiceRequest } from '@/types';
import {
  Users,
  Phone,
  MessageCircle,
  Search,
  MapPin,
  Calendar,
  Wrench,
  CheckCircle2,
  Clock,
  Briefcase,
  X,
  UserCheck,
  ChevronRight,
  ShieldCheck,
  Filter,
  PhoneCall,
} from 'lucide-react';
import { getTelUrl, getWhatsAppUrl } from '@/lib/utils/phone';

export default function AdminContactsPage() {
  const [activeTab, setActiveTab] = useState<'customers' | 'technicians'>('customers');
  const [customers, setCustomers] = useState<Array<Customer & { totalRequests: number; latestService?: string; latestStatus?: string }>>([]);
  const [technicians, setTechnicians] = useState<Worker[]>([]);
  const [search, setSearch] = useState('');

  // Customer Filters
  const [custDistrict, setCustDistrict] = useState('ALL');
  const [custService, setCustService] = useState('ALL');

  // Technician Filters
  const [techDistrict, setTechDistrict] = useState('ALL');
  const [techService, setTechService] = useState('ALL');
  const [techAvailability, setTechAvailability] = useState('ALL');
  const [techActiveStatus, setTechActiveStatus] = useState('ALL');

  // Selected Profile Modals
  const [selectedCustomer, setSelectedCustomer] = useState<{
    customer: Customer;
    requests: ServiceRequest[];
  } | null>(null);

  const [selectedTechnician, setSelectedTechnician] = useState<Worker | null>(null);

  const loadData = () => {
    setCustomers(dataStore.getCustomers());
    setTechnicians(dataStore.getWorkers());
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Customers
  const filteredCustomers = customers.filter((c) => {
    const q = search.toLowerCase();
    const matchSearch =
      c.full_name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      (c.district && c.district.toLowerCase().includes(q)) ||
      (c.latestService && c.latestService.toLowerCase().includes(q));

    if (!matchSearch) return false;
    if (custDistrict !== 'ALL' && c.district?.toLowerCase() !== custDistrict.toLowerCase()) return false;
    if (custService !== 'ALL' && c.latestService?.toLowerCase() !== custService.toLowerCase()) return false;
    return true;
  });

  // Filtered Technicians
  const filteredTechnicians = technicians.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch =
      t.full_name.toLowerCase().includes(q) ||
      t.phone.includes(q) ||
      (t.district && t.district.toLowerCase().includes(q)) ||
      t.skills.some((s) => s.toLowerCase().includes(q));

    if (!matchSearch) return false;
    if (techDistrict !== 'ALL' && t.district?.toLowerCase() !== techDistrict.toLowerCase()) return false;
    if (techAvailability !== 'ALL' && t.availability !== techAvailability) return false;
    if (techActiveStatus !== 'ALL' && t.active_status !== techActiveStatus) return false;
    if (techService !== 'ALL') {
      const sLower = techService.toLowerCase();
      const hasService =
        t.service_ids.some((id) => id.toLowerCase().includes(sLower)) ||
        t.skills.some((s) => s.toLowerCase().includes(sLower));
      if (!hasService) return false;
    }
    return true;
  });

  const handleOpenCustomer = (customerId: string) => {
    const full = dataStore.getCustomerById(customerId);
    if (full) setSelectedCustomer(full);
  };

  return (
    <div className="flex-1 bg-slate-100 p-3 sm:p-6 space-y-4 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
            Permanent Directory
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <span>Contacts Directory</span>
          </h1>
        </div>

        {/* 2 Main Sections/Tabs: Customers and Technicians */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'customers'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Customers ({customers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('technicians')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'technicians'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Technicians ({technicians.length})
          </button>
        </div>
      </div>

      {/* Search & Strong Dropdown Filters */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        {/* Fast Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder={
              activeTab === 'customers'
                ? 'Search customer by name, phone, district, service...'
                : 'Search technician by name, phone, trade, district...'
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        {/* Filters based on active tab */}
        {activeTab === 'customers' ? (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                District
              </label>
              <select
                value={custDistrict}
                onChange={(e) => setCustDistrict(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white"
              >
                <option value="ALL">All Districts</option>
                {TAMIL_NADU_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Service
              </label>
              <select
                value={custService}
                onChange={(e) => setCustService(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white"
              >
                <option value="ALL">All Services</option>
                {STANDARDIZED_SERVICES.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                District
              </label>
              <select
                value={techDistrict}
                onChange={(e) => setTechDistrict(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white"
              >
                <option value="ALL">All Districts</option>
                {TAMIL_NADU_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Service
              </label>
              <select
                value={techService}
                onChange={(e) => setTechService(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white"
              >
                <option value="ALL">All Services</option>
                {STANDARDIZED_SERVICES.map((s) => (
                  <option key={s.id} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Availability
              </label>
              <select
                value={techAvailability}
                onChange={(e) => setTechAvailability(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white"
              >
                <option value="ALL">All Availability</option>
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="offline">Unavailable</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Active Status
              </label>
              <select
                value={techActiveStatus}
                onChange={(e) => setTechActiveStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white"
              >
                <option value="ALL">All Status</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Directory Tiles */}
      {activeTab === 'customers' ? (
        /* CUSTOMER TILES */
        <div className="space-y-2.5">
          {filteredCustomers.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No customers found</h3>
              <p className="text-xs text-slate-400">Try changing your search or filters.</p>
            </div>
          ) : (
            filteredCustomers.map((cust) => (
              <div
                key={cust.id}
                onClick={() => handleOpenCustomer(cust.id)}
                className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-emerald-500 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between gap-3"
              >
                <div>
                  <h3 className="text-sm font-black text-slate-900">{cust.full_name}</h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    <span className="font-semibold text-emerald-700">{cust.latestService || 'General Inquiry'}</span>
                    {' • '}
                    <span>{cust.district || 'Salem'}</span>
                    {' • '}
                    <span className="font-mono text-slate-800">{cust.phone}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <a
                    href={getTelUrl(cust.phone)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
                    title="Call Customer"
                  >
                    <PhoneCall className="w-4 h-4 text-emerald-600" />
                  </a>
                  <a
                    href={getWhatsAppUrl(cust.phone, `Vanakkam ${cust.full_name}, this is VIKASA service coordination.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors"
                    title="WhatsApp Customer"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                  </a>
                  <span className="text-slate-300">
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* TECHNICIAN TILES */
        <div className="space-y-2.5">
          {filteredTechnicians.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="text-sm font-bold text-slate-800">No technicians found</h3>
              <p className="text-xs text-slate-400">Try changing your search or filters.</p>
            </div>
          ) : (
            filteredTechnicians.map((tech) => (
              <div
                key={tech.id}
                onClick={() => setSelectedTechnician(tech)}
                className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-emerald-500 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-slate-900">{tech.full_name}</h3>
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        tech.availability === 'available'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {tech.availability.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">
                    <span className="font-semibold text-emerald-700">{tech.skills[0] || 'Technician'}</span>
                    {' • '}
                    <span>{tech.district || 'Salem'}</span>
                    {' • '}
                    <span className="font-mono text-slate-800">{tech.phone}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <a
                    href={getTelUrl(tech.phone)}
                    className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
                    title="Call Technician"
                  >
                    <PhoneCall className="w-4 h-4 text-emerald-600" />
                  </a>
                  <a
                    href={getWhatsAppUrl(tech.phone, `Vanakkam ${tech.full_name}, VIKASA admin here.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors"
                    title="WhatsApp Technician"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                  </a>
                  <span className="text-slate-300">
                    <ChevronRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Customer Full Profile Modal with Request History */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Permanent Customer Profile
                </span>
                <h2 className="text-xl font-black text-slate-900">
                  {selectedCustomer.customer.full_name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Profile Information */}
            <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Mobile:</span>
                <span className="font-mono font-bold text-slate-900">{selectedCustomer.customer.phone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">District:</span>
                <span className="font-bold text-slate-900">{selectedCustomer.customer.district || 'Salem'}</span>
              </div>
              {selectedCustomer.customer.address && (
                <div className="flex items-start justify-between">
                  <span className="text-slate-400 font-semibold shrink-0">Address:</span>
                  <span className="font-medium text-slate-800 text-right">{selectedCustomer.customer.address}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-1 border-t border-slate-200/60">
                <span className="text-slate-400 font-semibold">Customer Since:</span>
                <span>{new Date(selectedCustomer.customer.created_at).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Customer's Request History */}
            <div className="space-y-2 pt-1">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Service History ({selectedCustomer.requests.length} Requests)
              </h3>
              {selectedCustomer.requests.length === 0 ? (
                <p className="text-xs text-slate-400">No requests yet.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedCustomer.requests.map((r) => (
                    <div
                      key={r.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 text-xs flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block">{r.service_name}</span>
                        <span className="text-[11px] text-slate-500">{r.formatted_address}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadgeInfo(r.status).className}`}>
                        {getStatusBadgeInfo(r.status).label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Direct Actions */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
              <a
                href={getTelUrl(selectedCustomer.customer.phone)}
                className="py-3 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors text-center"
              >
                <PhoneCall className="w-4 h-4 text-emerald-600" />
                <span>Call Customer</span>
              </a>

              <a
                href={getWhatsAppUrl(selectedCustomer.customer.phone, `Vanakkam ${selectedCustomer.customer.full_name}, this is VIKASA coordination.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center justify-center gap-1.5 transition-colors text-center"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Technician Full Profile Modal */}
      {selectedTechnician && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Permanent Technician Profile
                </span>
                <h2 className="text-xl font-black text-slate-900">
                  {selectedTechnician.full_name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTechnician(null)}
                className="p-2 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Mobile:</span>
                <span className="font-mono font-bold text-slate-900">{selectedTechnician.phone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">WhatsApp:</span>
                <span className="font-mono font-bold text-slate-900">{selectedTechnician.whatsapp || selectedTechnician.phone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">District:</span>
                <span className="font-bold text-slate-900">{selectedTechnician.district || 'Salem'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Base Area:</span>
                <span className="font-medium text-slate-800">{selectedTechnician.base_location_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Experience:</span>
                <span className="font-bold text-slate-800">{selectedTechnician.experience_years}+ Years</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-semibold">Availability:</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  selectedTechnician.availability === 'available' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  {selectedTechnician.availability.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Skills */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Services &amp; Skills
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {selectedTechnician.skills.map((s) => (
                  <span key={s} className="px-2.5 py-1 bg-slate-100 rounded-xl text-xs font-medium text-slate-700">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Direct Actions */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
              <a
                href={getTelUrl(selectedTechnician.phone)}
                className="py-3 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors text-center"
              >
                <PhoneCall className="w-4 h-4 text-emerald-600" />
                <span>Call Technician</span>
              </a>

              <a
                href={getWhatsAppUrl(selectedTechnician.phone, `Vanakkam ${selectedTechnician.full_name}, this is VIKASA coordination.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="py-3 px-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center justify-center gap-1.5 transition-colors text-center"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
