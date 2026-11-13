'use client';

import React, { useState, useEffect } from 'react';
import {
  INITIAL_CATEGORIES,
} from '@/lib/taxonomy/catalog';
import { ServiceCategory, ServiceItem, ServiceAlias } from '@/types';
import { dataStore } from '@/lib/data/store';
import {
  Briefcase,
  Layers,
  Tags,
  Plus,
  CheckCircle2,
  AlertCircle,
  Hash,
  Search,
  Check,
  Trash2,
  Tag,
  IndianRupee,
  Info,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export default function AdminServicesPage() {
  const [categories, setCategories] = useState<ServiceCategory[]>([...INITIAL_CATEGORIES]);
  const [services, setServices] = useState<(ServiceItem & { price_estimate?: string })[]>(() =>
    dataStore.getAllServices()
  );
  const [selectedCatId, setSelectedCatId] = useState<string>(INITIAL_CATEGORIES[0]?.id || 'cat-plumbing');

  // Form State
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState(INITIAL_CATEGORIES[0]?.id || 'cat-plumbing');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('From ₹199');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadServices = () => {
    // 1. Immediate local hydration
    setServices(dataStore.getAllServices());

    // 2. Server API fetch
    fetch('/api/services')
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.success && Array.isArray(json.data) && json.data.length > 0) {
          setServices(json.data);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadServices();
    const handleUpdate = () => loadServices();
    window.addEventListener('vikasa_services_updated', handleUpdate);
    window.addEventListener('vikasa_data_updated', handleUpdate);
    return () => {
      window.removeEventListener('vikasa_services_updated', handleUpdate);
      window.removeEventListener('vikasa_data_updated', handleUpdate);
    };
  }, []);

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) {
      showToast('Please enter a valid service name');
      return;
    }

    setIsSubmitting(true);
    const token = typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('vikasa_admin_auth') || '{}').token
      : null;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-admin-portal': 'true',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: newServiceName.trim(),
          category_id: newServiceCategory,
          description: newServiceDesc.trim() || `${newServiceName.trim()} professional doorstep service`,
          price_estimate: newServicePrice.trim() || 'Custom Quote',
          is_active: true,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to save service');
      }

      dataStore.addCustomService(json.data);
      setServices(dataStore.getAllServices());
      setNewServiceName('');
      setNewServiceDesc('');
      showToast(`Service "${json.data.name}" added successfully and synced to booking dropdown!`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error adding service');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteService = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete service "${name}"?`)) return;

    const token = typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('vikasa_admin_auth') || '{}').token
      : null;

    const headers: Record<string, string> = {
      'x-admin-portal': 'true',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    try {
      const res = await fetch(`/api/services?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers,
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to delete service');
      }

      dataStore.deleteCustomService(id);
      setServices(dataStore.getAllServices());
      showToast(`Service "${name}" deleted.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error deleting service');
    }
  };

  const filteredServices = services.filter((s) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q)) ||
        (s.category_id && s.category_id.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="flex-1 bg-slate-100 p-3 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 p-3.5 bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-1 border border-emerald-200">
            <Layers className="w-3.5 h-3.5 text-emerald-700" />
            <span>Service Catalog Management</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Manage Services &amp; Booking Options
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Add new home services, configure short descriptions for the &ldquo;i&rdquo; info tooltip, set pricing estimates, and manage live availability.
          </p>
        </div>

        <button
          onClick={loadServices}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh List</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Add New Service Form */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4 h-fit">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">Add New Service</h2>
              <span className="text-[11px] text-slate-500">Appears instantly in customer booking dropdown</span>
            </div>
          </div>

          <form onSubmit={handleAddService} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Service Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Solar Water Heater Maintenance"
                value={newServiceName}
                onChange={(e) => setNewServiceName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Category
              </label>
              <select
                value={newServiceCategory}
                onChange={(e) => setNewServiceCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Short Description (Shown on &ldquo;i&rdquo; Button)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Panel descaling, tank flushing, pipeline leak check and thermostat replacement."
                value={newServiceDesc}
                onChange={(e) => setNewServiceDesc(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Price Estimate / Rate Note
              </label>
              <input
                type="text"
                placeholder="e.g. From ₹299 or Inspection ₹150"
                value={newServicePrice}
                onChange={(e) => setNewServicePrice(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving Service...' : 'Add to Service Catalog'}</span>
            </button>
          </form>
        </div>

        {/* Right 2 Columns: Live Service Catalog List */}
        <div className="lg:col-span-2 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-black text-slate-900">
                Active Catalog Items ({filteredServices.length})
              </h2>
              <span className="text-[11px] text-slate-500">Live options available in the customer booking form</span>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredServices.map((s) => (
              <div
                key={s.id}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-emerald-300 transition-all flex flex-col justify-between space-y-2 group shadow-2xs"
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">{s.name}</h3>
                    {s.price_estimate && (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 shrink-0">
                        {s.price_estimate}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                    {s.description || 'Professional verified doorstep service.'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px]">
                  <span className="font-mono text-slate-500 text-[10px] uppercase">
                    {s.category_id || 'general'}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleDeleteService(s.id, s.name)}
                    aria-label={`Delete service ${s.name}`}
                    className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {filteredServices.length === 0 && (
              <div className="col-span-full p-8 text-center text-slate-500 text-xs">
                No services found matching &ldquo;{searchQuery}&rdquo;.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
