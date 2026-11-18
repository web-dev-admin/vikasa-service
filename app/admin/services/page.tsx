'use client';

import React, { useState, useEffect } from 'react';
import {
  INITIAL_CATEGORIES,
} from '@/lib/taxonomy/catalog';
import { ServiceCategory, ServiceItem } from '@/types';
import { dataStore } from '@/lib/data/store';
import {
  Briefcase,
  Layers,
  Plus,
  CheckCircle2,
  Search,
  Trash2,
  RefreshCw,
  FolderPlus,
  X,
  Wrench,
  Zap,
  Hammer,
  Sparkles,
  ShieldCheck,
  Layout,
  Droplets,
  Wind,
  Flame,
  Sun,
  Cpu,
  Home,
  Tag,
} from 'lucide-react';

const AVAILABLE_ICONS = [
  { id: 'Layers', label: 'Layers / General', icon: Layers },
  { id: 'Wrench', label: 'Wrench / Plumbing', icon: Wrench },
  { id: 'Zap', label: 'Zap / Electrical', icon: Zap },
  { id: 'Hammer', label: 'Hammer / Carpentry', icon: Hammer },
  { id: 'Sparkles', label: 'Sparkles / Cleaning', icon: Sparkles },
  { id: 'Layout', label: 'Layout / Interiors', icon: Layout },
  { id: 'ShieldCheck', label: 'Shield / Security & CCTV', icon: ShieldCheck },
  { id: 'Droplets', label: 'Droplets / Water & RO', icon: Droplets },
  { id: 'Wind', label: 'Wind / AC & Ventilation', icon: Wind },
  { id: 'Flame', label: 'Flame / Heating & Gas', icon: Flame },
  { id: 'Sun', label: 'Sun / Solar & Energy', icon: Sun },
  { id: 'Cpu', label: 'Cpu / Electronics & Smart Home', icon: Cpu },
  { id: 'Home', label: 'Home / Renovation & Civil', icon: Home },
];

function CategoryIcon({ name, className = 'w-4 h-4' }: { name?: string; className?: string }) {
  const found = AVAILABLE_ICONS.find((i) => i.id === name);
  const IconComponent = found ? found.icon : Layers;
  return <IconComponent className={className} />;
}

export default function AdminServicesPage() {
  const [activeTab, setActiveTab] = useState<'services' | 'categories'>('services');

  // Categories & Services State
  const [categories, setCategories] = useState<ServiceCategory[]>(() => dataStore.getAllCategories());
  const [services, setServices] = useState<(ServiceItem & { price_estimate?: string })[]>(() =>
    dataStore.getAllServices()
  );
  const [selectedCatFilter, setSelectedCatFilter] = useState<string>('ALL');

  // Add Service Form State
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState<string>('');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('From ₹199');
  const [isSubmittingService, setIsSubmittingService] = useState(false);

  // Add Category Modal / Form State
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('Layers');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [isSubmittingCategory, setIsSubmittingCategory] = useState(false);

  // Search & Toast
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadCategories = () => {
    setCategories(dataStore.getAllCategories());
    fetch('/api/categories')
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.success && Array.isArray(json.data) && json.data.length > 0) {
          setCategories(json.data);
        }
      })
      .catch(() => {});
  };

  const loadServices = () => {
    setServices(dataStore.getAllServices());
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
    loadCategories();
    loadServices();

    const handleUpdate = () => {
      loadCategories();
      loadServices();
    };

    window.addEventListener('vikasa_categories_updated', handleUpdate);
    window.addEventListener('vikasa_services_updated', handleUpdate);
    window.addEventListener('vikasa_data_updated', handleUpdate);
    return () => {
      window.removeEventListener('vikasa_categories_updated', handleUpdate);
      window.removeEventListener('vikasa_services_updated', handleUpdate);
      window.removeEventListener('vikasa_data_updated', handleUpdate);
    };
  }, []);

  // Set default category for service form once categories load
  useEffect(() => {
    if (!newServiceCategory && categories.length > 0) {
      setNewServiceCategory(categories[0].id);
    }
  }, [categories, newServiceCategory]);

  // Handle Add Service
  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) {
      showToast('Please enter a valid service name');
      return;
    }

    setIsSubmittingService(true);
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
          category_id: newServiceCategory || (categories[0]?.id || 'cat-general'),
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
      showToast(`Service "${json.data.name}" added to catalog & booking dropdown!`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error adding service');
    } finally {
      setIsSubmittingService(false);
    }
  };

  // Handle Delete Service
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
        credentials: 'include',
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

  // Handle Add Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      showToast('Please enter a valid category name');
      return;
    }

    setIsSubmittingCategory(true);
    const token = typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('vikasa_admin_auth') || '{}').token
      : null;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-admin-portal': 'true',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: newCategoryName.trim(),
          description: newCategoryDesc.trim() || `${newCategoryName.trim()} home services`,
          icon: newCategoryIcon,
          is_active: true,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to save category');
      }

      dataStore.addCustomCategory(json.data);
      loadCategories();
      setNewCategoryName('');
      setNewCategoryDesc('');
      setIsAddCategoryModalOpen(false);
      setNewServiceCategory(json.data.id); // Auto-select for service creation
      showToast(`Category "${json.data.name}" created successfully!`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error adding category');
    } finally {
      setIsSubmittingCategory(false);
    }
  };

  // Handle Delete Category
  const handleDeleteCategory = async (id: string, name: string) => {
    const isBaseline = INITIAL_CATEGORIES.some((c) => c.id === id);
    if (isBaseline) {
      showToast('System baseline categories cannot be deleted.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete category "${name}"? Services linked to it will remain safe.`)) return;

    const token = typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('vikasa_admin_auth') || '{}').token
      : null;

    const headers: Record<string, string> = {
      'x-admin-portal': 'true',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    try {
      const res = await fetch(`/api/categories?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to delete category');
      }

      dataStore.deleteCustomCategory(id);
      loadCategories();
      showToast(`Category "${name}" deleted.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error deleting category');
    }
  };

  // Count services in each category
  const getServicesCountForCategory = (catId: string, slug?: string) => {
    return services.filter(
      (s) => s.category_id === catId || (slug && s.category_id === slug)
    ).length;
  };

  // Filtered Services List
  const filteredServices = services.filter((s) => {
    const matchesCategory =
      selectedCatFilter === 'ALL' ||
      s.category_id === selectedCatFilter ||
      (selectedCatFilter.startsWith('cat-') && s.category_id === selectedCatFilter.replace('cat-', ''));

    if (!matchesCategory) return false;

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
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 p-3.5 bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-1 border border-emerald-200">
            <Layers className="w-3.5 h-3.5 text-emerald-700" />
            <span>Catalog &amp; Taxonomy Engine</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Manage Services &amp; Categories
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Add custom trade categories, create new home services, configure info tooltips, and manage live booking availability.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsAddCategoryModalOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>+ Add Category</span>
          </button>

          <button
            onClick={() => {
              loadCategories();
              loadServices();
            }}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('services')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'services'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Services Catalog</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
              activeTab === 'services' ? 'bg-slate-700 text-emerald-400' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {services.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'categories'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Service Categories</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
              activeTab === 'categories' ? 'bg-slate-700 text-emerald-400' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {categories.length}
          </span>
        </button>
      </div>

      {/* TAB 1: SERVICES CATALOG */}
      {activeTab === 'services' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Add New Service Form */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4 h-fit">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900">Add New Service</h2>
                <span className="text-[11px] text-slate-500">Appears immediately in customer booking dropdown</span>
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddCategoryModalOpen(true)}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>New Category</span>
                  </button>
                </div>
                <select
                  value={newServiceCategory}
                  onChange={(e) => setNewServiceCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
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
                  Short Description (Shown on Customer &ldquo;ℹ️&rdquo; Tooltip)
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Panel descaling, tank flushing, pipeline leak check and thermostat replacement."
                  value={newServiceDesc}
                  onChange={(e) => setNewServiceDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingService}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <Plus className="w-4 h-4" />
                <span>{isSubmittingService ? 'Saving Service...' : 'Add to Service Catalog'}</span>
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

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                onClick={() => setSelectedCatFilter('ALL')}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCatFilter === 'ALL'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Categories ({services.length})
              </button>
              {categories.map((c) => {
                const count = getServicesCountForCategory(c.id, c.slug);
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCatFilter(c.id)}
                    className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                      selectedCatFilter === c.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{c.name}</span>
                    <span className="text-[10px] opacity-80">({count})</span>
                  </button>
                );
              })}
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
                  No services found matching your filters.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CATEGORIES MANAGEMENT */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Create New Category Form */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4 h-fit">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <FolderPlus className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900">Create New Category</h2>
                <span className="text-[11px] text-slate-500">Group services under a custom domain</span>
              </div>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Appliance Repair &amp; Servicing"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category Icon
                </label>
                <select
                  value={newCategoryIcon}
                  onChange={(e) => setNewCategoryIcon(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                >
                  {AVAILABLE_ICONS.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Washing machine, refrigerator, TV, microwave and kitchen appliance servicing."
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingCategory}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
              >
                <FolderPlus className="w-4 h-4" />
                <span>{isSubmittingCategory ? 'Saving Category...' : 'Save Category'}</span>
              </button>
            </form>
          </div>

          {/* Right 2 Columns: All Categories Grid */}
          <div className="lg:col-span-2 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-sm font-black text-slate-900">
                  Service Categories ({categories.length})
                </h2>
                <span className="text-[11px] text-slate-500">Categories organize your services catalog and dispatch assignments</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {categories.map((c) => {
                const isBaseline = INITIAL_CATEGORIES.some((base) => base.id === c.id);
                const sCount = getServicesCountForCategory(c.id, c.slug);

                return (
                  <div
                    key={c.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-emerald-300 transition-all flex flex-col justify-between space-y-3 shadow-2xs"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center">
                            <CategoryIcon name={c.icon} className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm leading-tight">{c.name}</h3>
                            <span className="font-mono text-[10px] text-slate-400">{c.slug}</span>
                          </div>
                        </div>

                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                            isBaseline
                              ? 'bg-slate-100 text-slate-600 border-slate-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {isBaseline ? 'Baseline' : 'Custom'}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                        {c.description || 'Specialized home services and repairs.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-[11px]">
                      <span className="font-semibold text-slate-500 flex items-center gap-1">
                        <Tag className="w-3 h-3 text-slate-400" />
                        <span>{sCount} {sCount === 1 ? 'Service' : 'Services'}</span>
                      </span>

                      {!isBaseline ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(c.id, c.name)}
                          aria-label={`Delete category ${c.name}`}
                          className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-400">Protected</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* QUICK ADD CATEGORY MODAL */}
      {isAddCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Add New Category</h3>
                  <span className="text-[11px] text-slate-500">Instantly available in service creator</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddCategoryModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Appliance Repair, CCTV &amp; Security"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Icon
                </label>
                <select
                  value={newCategoryIcon}
                  onChange={(e) => setNewCategoryIcon(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                >
                  {AVAILABLE_ICONS.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Washing machine, refrigerator, TV and domestic appliance repairs."
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCategory}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  <span>{isSubmittingCategory ? 'Saving...' : 'Create Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
