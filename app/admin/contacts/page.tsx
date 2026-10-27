'use client';

import React, { useState } from 'react';
import { dataStore } from '@/lib/data/store';
import {
  STANDARDIZED_SERVICES,
  TAMIL_NADU_DISTRICTS,
  getStatusBadgeInfo,
} from '@/lib/constants';
import { Customer, Worker, ServiceRequest } from '@/types';
import {
  Users,
  MessageCircle,
  Search,
  CheckCircle2,
  X,
  ChevronRight,
  PhoneCall,
  Download,
  ShieldAlert,
  RotateCw,
  Award,
  Briefcase,
  MapPin,
  RotateCcw,
  SlidersHorizontal,
  Star,
  Check,
} from 'lucide-react';
import { getTelUrl, getWhatsAppUrl } from '@/lib/utils/phone';

export default function AdminContactsPage() {
  const [activeTab, setActiveTab] = useState<'customers' | 'technicians'>('customers');
  const [customers, setCustomers] = useState<Array<Customer & { totalRequests: number; latestService?: string; latestStatus?: string }>>(() => dataStore.getCustomers());
  const [technicians, setTechnicians] = useState<Worker[]>(() => dataStore.getWorkers());
  const [search, setSearch] = useState('');

  // Customer Filters
  const [custDistrict, setCustDistrict] = useState('ALL');
  const [custService, setCustService] = useState('ALL');

  // Technician Filters
  const [techDistrict, setTechDistrict] = useState('ALL');
  const [techService, setTechService] = useState('ALL');
  const [techExperience, setTechExperience] = useState('ALL'); // 'ALL' | '1' | '3' | '5' | '10' | 'fresh'
  const [techAvailability, setTechAvailability] = useState('ALL');
  const [techActiveStatus, setTechActiveStatus] = useState('ALL');
  const [techVerification, setTechVerification] = useState('ALL');
  const [techSort, setTechSort] = useState<'exp_desc' | 'exp_asc' | 'name_asc' | 'default'>('exp_desc');

  // Selected Profile Modals
  const [selectedCustomer, setSelectedCustomer] = useState<{
    customer: Customer;
    requests: ServiceRequest[];
  } | null>(null);

  const [selectedTechnician, setSelectedTechnician] = useState<Worker | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadData = React.useCallback(() => {
    // 1. Immediately hydrate from local store
    setCustomers(dataStore.getCustomers());
    setTechnicians(dataStore.getWorkers());

    // 2. Fetch from server API with admin authentication
    const token = typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('vikasa_admin_auth') || '{}').token
      : null;

    const headers: Record<string, string> = {
      'x-admin-portal': 'true',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    setIsLoading(true);

    Promise.all([
      fetch('/api/customers', { headers }).then((r) => (r.ok ? r.json() : null)),
      fetch('/api/technicians', { headers }).then((r) => (r.ok ? r.json() : null)),
      fetch('/api/requests', { headers }).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([custRes, techRes, reqRes]) => {
        // If requests arrived, merge them first (which auto-synthesizes customer profiles)
        if (reqRes?.success && Array.isArray(reqRes.data)) {
          dataStore.mergeRequests(reqRes.data);
        }

        // If customers arrived from Supabase, merge them
        if (custRes?.success && Array.isArray(custRes.data) && custRes.data.length > 0) {
          dataStore.mergeCustomers(custRes.data);
        }

        // If technicians arrived from Supabase, merge them
        if (techRes?.success && Array.isArray(techRes.data) && techRes.data.length > 0) {
          dataStore.mergeWorkers(techRes.data);
        }

        // Re-read finalized unified state
        setCustomers(dataStore.getCustomers());
        setTechnicians(dataStore.getWorkers());
      })
      .catch((err) => {
        console.warn('Admin contacts sync warning:', err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  React.useEffect(() => {
    loadData();
    const handleUpdate = () => {
      setCustomers(dataStore.getCustomers());
      setTechnicians(dataStore.getWorkers());
    };
    window.addEventListener('vikasa_data_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('vikasa_data_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [loadData]);

  const handleToggleTechnicianStatus = (id: string, currentStatus?: string) => {
    const nextStatus = currentStatus === 'inactive' ? 'active' : 'inactive';
    dataStore.updateWorker(id, { active_status: nextStatus });
    loadData();
    if (selectedTechnician && selectedTechnician.id === id) {
      setSelectedTechnician({ ...selectedTechnician, active_status: nextStatus });
    }
  };

  const handleVerifyTechnician = (id: string) => {
    dataStore.updateWorker(id, { verification_status: 'verified', verified_at: new Date().toISOString() });
    loadData();
    if (selectedTechnician && selectedTechnician.id === id) {
      setSelectedTechnician({ ...selectedTechnician, verification_status: 'verified' });
    }
  };

  const exportContactsCSV = () => {
    if (activeTab === 'customers') {
      const headers = ['ID', 'Full Name', 'Phone', 'District', 'Total Requests', 'Latest Service', 'Created At'];
      const rows = filteredCustomers.map((c) => [
        c.id,
        `"${(c.full_name || '').replace(/"/g, '""')}"`,
        `"${c.phone}"`,
        `"${c.district || ''}"`,
        c.totalRequests,
        `"${c.latestService || ''}"`,
        c.created_at,
      ]);
      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      downloadCSV(csvContent, `vikasa_customers_${new Date().toISOString().split('T')[0]}.csv`);
    } else {
      const headers = ['ID', 'Full Name', 'Phone', 'District', 'Experience Years', 'Skills', 'Availability', 'Verification', 'Status'];
      const rows = filteredTechnicians.map((t) => [
        t.id,
        `"${(t.full_name || '').replace(/"/g, '""')}"`,
        `"${t.phone}"`,
        `"${t.district || ''}"`,
        t.experience_years,
        `"${(t.skills || []).join('; ')}"`,
        t.availability,
        t.verification_status,
        t.active_status || 'active',
      ]);
      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      downloadCSV(csvContent, `vikasa_technicians_${new Date().toISOString().split('T')[0]}.csv`);
    }
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Strict Phone-Based Deduplicated Customers
  const uniqueCustomerMap = new Map<string, (typeof customers)[0]>();
  for (const c of customers) {
    if (!c) continue;
    const cleanPhone = c.phone ? c.phone.replace(/\D/g, '').slice(-10) : c.id;
    if (cleanPhone && !uniqueCustomerMap.has(cleanPhone)) {
      uniqueCustomerMap.set(cleanPhone, c);
    }
  }

  const filteredCustomers = Array.from(uniqueCustomerMap.values()).filter((c) => {
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

  // Strict Phone-Based Deduplicated Technicians
  const uniqueTechMap = new Map<string, Worker>();
  for (const t of technicians) {
    if (!t) continue;
    const cleanPhone = t.phone ? t.phone.replace(/\D/g, '').slice(-10) : t.id;
    if (cleanPhone && !uniqueTechMap.has(cleanPhone)) {
      uniqueTechMap.set(cleanPhone, t);
    }
  }

  // Available Districts (Combined from predefined + actual technicians)
  const availableDistricts = React.useMemo(() => {
    const list = new Set<string>(TAMIL_NADU_DISTRICTS);
    technicians.forEach((t) => {
      if (t.district && t.district.trim()) {
        list.add(t.district.trim());
      }
    });
    return Array.from(list).sort((a, b) => a.localeCompare(b));
  }, [technicians]);

  const activeTechFilterCount = [
    techDistrict !== 'ALL',
    techService !== 'ALL',
    techExperience !== 'ALL',
    techAvailability !== 'ALL',
    techActiveStatus !== 'ALL',
    techVerification !== 'ALL',
    techSort !== 'exp_desc',
  ].filter(Boolean).length;

  const handleResetTechFilters = () => {
    setTechDistrict('ALL');
    setTechService('ALL');
    setTechExperience('ALL');
    setTechAvailability('ALL');
    setTechActiveStatus('ALL');
    setTechVerification('ALL');
    setTechSort('exp_desc');
    setSearch('');
  };

  const filteredTechnicians = Array.from(uniqueTechMap.values())
    .filter((t) => {
      const q = search.toLowerCase();
      const matchSearch =
        t.full_name.toLowerCase().includes(q) ||
        t.phone.includes(q) ||
        (t.district && t.district.toLowerCase().includes(q)) ||
        (t.base_location_name && t.base_location_name.toLowerCase().includes(q)) ||
        t.skills.some((s) => s.toLowerCase().includes(q));

      if (!matchSearch) return false;
      if (techDistrict !== 'ALL' && t.district?.toLowerCase() !== techDistrict.toLowerCase()) return false;
      if (techAvailability !== 'ALL' && t.availability !== techAvailability) return false;
      if (techActiveStatus !== 'ALL' && t.active_status !== techActiveStatus) return false;
      if (techVerification !== 'ALL' && t.verification_status !== techVerification) return false;

      // Filter based on experience
      if (techExperience !== 'ALL') {
        const exp = Number(t.experience_years) || 0;
        if (techExperience === '1' && exp < 1) return false;
        if (techExperience === '3' && exp < 3) return false;
        if (techExperience === '5' && exp < 5) return false;
        if (techExperience === '10' && exp < 10) return false;
        if (techExperience === 'fresh' && exp >= 2) return false;
      }

      if (techService !== 'ALL') {
        const sLower = techService.toLowerCase();
        const hasService =
          t.service_ids.some((id) => id.toLowerCase().includes(sLower)) ||
          t.skills.some((s) => s.toLowerCase().includes(sLower));
        if (!hasService) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (techSort === 'exp_desc') {
        return (Number(b.experience_years) || 0) - (Number(a.experience_years) || 0);
      }
      if (techSort === 'exp_asc') {
        return (Number(a.experience_years) || 0) - (Number(b.experience_years) || 0);
      }
      if (techSort === 'name_asc') {
        return a.full_name.localeCompare(b.full_name);
      }
      return 0;
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
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={loadData}
            disabled={isLoading}
            className="px-3 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-slate-200"
            title="Sync latest contacts from database"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-600' : 'text-slate-600'}`} />
            <span className="hidden sm:inline">{isLoading ? 'Syncing...' : 'Sync'}</span>
          </button>

          <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('customers')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'customers'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Customers ({uniqueCustomerMap.size})
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
              Technicians ({uniqueTechMap.size})
            </button>
          </div>
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
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
              {/* 1. District Filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-rose-500" />
                  <span>District</span>
                </label>
                <select
                  value={techDistrict}
                  onChange={(e) => setTechDistrict(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="ALL">All Districts ({availableDistricts.length})</option>
                  {availableDistricts.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Experience Filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Award className="w-3 h-3 text-amber-500" />
                  <span>Experience</span>
                </label>
                <select
                  value={techExperience}
                  onChange={(e) => setTechExperience(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="ALL">All Experience</option>
                  <option value="1">1+ Years</option>
                  <option value="3">3+ Years</option>
                  <option value="5">5+ Years (Senior)</option>
                  <option value="10">10+ Years (Master)</option>
                  <option value="fresh">Fresh (&lt; 2 Yrs)</option>
                </select>
              </div>

              {/* 3. Service / Skill Filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <Briefcase className="w-3 h-3 text-emerald-500" />
                  <span>Trade / Skill</span>
                </label>
                <select
                  value={techService}
                  onChange={(e) => setTechService(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="ALL">All Trades</option>
                  {STANDARDIZED_SERVICES.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Availability Filter */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Availability
                </label>
                <select
                  value={techAvailability}
                  onChange={(e) => setTechAvailability(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="ALL">All Availability</option>
                  <option value="available">Available Now</option>
                  <option value="busy">Busy on Job</option>
                  <option value="offline">Offline / Off Duty</option>
                </select>
              </div>

              {/* 5. Verification Status */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Verification
                </label>
                <select
                  value={techVerification}
                  onChange={(e) => setTechVerification(e.target.value)}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="ALL">All Verification</option>
                  <option value="verified">Verified Only</option>
                  <option value="pending_verification">Pending Review</option>
                </select>
              </div>

              {/* 6. Sort By */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                  <SlidersHorizontal className="w-3 h-3 text-slate-500" />
                  <span>Sort By</span>
                </label>
                <select
                  value={techSort}
                  onChange={(e) => setTechSort(e.target.value as any)}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="exp_desc">Experience: High → Low</option>
                  <option value="exp_asc">Experience: Low → High</option>
                  <option value="name_asc">Name: A → Z</option>
                  <option value="default">Default Order</option>
                </select>
              </div>
            </div>

            {/* Filter Summary & Quick Reset Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-600">
                  Showing <span className="font-bold text-slate-900">{filteredTechnicians.length}</span> of {uniqueTechMap.size} technicians
                </span>
                {activeTechFilterCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    {activeTechFilterCount} filter{activeTechFilterCount > 1 ? 's' : ''} active
                  </span>
                )}
              </div>

              {activeTechFilterCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetTechFilters}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear All Filters</span>
                </button>
              )}
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
                    <span>{cust.district || 'Erode'}</span>
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
                className="bg-white rounded-2xl p-4 border border-slate-200 hover:border-emerald-500 hover:shadow-xs transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <h3 className="text-sm font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {tech.full_name}
                    </h3>

                    {/* Experience Badge */}
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200/80">
                      <Award className="w-3 h-3 text-amber-600" />
                      <span>{Number(tech.experience_years) || 0}+ Yrs Exp</span>
                    </span>

                    {/* Verification Badge */}
                    {tech.verification_status === 'verified' ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <Check className="w-2.5 h-2.5 text-emerald-600" />
                        <span>Verified</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        Pending
                      </span>
                    )}

                    {/* Availability Badge */}
                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        tech.availability === 'available'
                          ? 'bg-emerald-100 text-emerald-800'
                          : tech.availability === 'busy'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {tech.availability}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-600">
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                      <Briefcase className="w-3 h-3 text-emerald-600" />
                      <span>{tech.skills[0] || 'Technician'}</span>
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="inline-flex items-center gap-1 text-slate-700">
                      <MapPin className="w-3 h-3 text-rose-500" />
                      <span className="font-medium">{tech.district || 'Erode'}</span>
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="font-mono text-slate-800">{tech.phone}</span>
                  </div>

                  {/* Skills tags */}
                  {tech.skills && tech.skills.length > 1 && (
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {tech.skills.slice(0, 3).map((s) => (
                        <span
                          key={s}
                          className="text-[10px] font-medium px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md"
                        >
                          {s}
                        </span>
                      ))}
                      {tech.skills.length > 3 && (
                        <span className="text-[10px] font-medium text-slate-400">
                          +{tech.skills.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0" onClick={(e) => e.stopPropagation()}>
                  <a
                    href={getTelUrl(tech.phone)}
                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
                    title="Call Technician"
                  >
                    <PhoneCall className="w-4 h-4 text-emerald-600" />
                  </a>
                  <a
                    href={getWhatsAppUrl(tech.phone, `Vanakkam ${tech.full_name}, VIKASA admin here.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 transition-colors"
                    title="WhatsApp Technician"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                  </a>
                  <span className="text-slate-300 pl-1">
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
                <span className="font-bold text-slate-900">{selectedCustomer.customer.district || 'Erode'}</span>
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
                <span className="font-bold text-slate-900">{selectedTechnician.district || 'Erode'}</span>
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
