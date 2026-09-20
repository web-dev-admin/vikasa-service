'use client';

import React, { useState } from 'react';
import {
  INITIAL_CATEGORIES,
  INITIAL_SERVICES,
  INITIAL_ALIASES,
} from '@/lib/taxonomy/catalog';
import { ServiceCategory, ServiceItem, ServiceAlias } from '@/types';
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
} from 'lucide-react';

export default function AdminServicesPage() {
  const [categories, setCategories] = useState<ServiceCategory[]>([...INITIAL_CATEGORIES]);
  const [services, setServices] = useState<ServiceItem[]>([...INITIAL_SERVICES]);
  const [aliases, setAliases] = useState<ServiceAlias[]>([...INITIAL_ALIASES]);

  const [selectedCatId, setSelectedCatId] = useState<string>(INITIAL_CATEGORIES[0].id);
  const [newServiceName, setNewServiceName] = useState('');
  const [newAliasText, setNewAliasText] = useState('');
  const [targetServiceIdForAlias, setTargetServiceIdForAlias] = useState<string>(
    INITIAL_SERVICES[0]?.id || ''
  );

  const [activeMobileTab, setActiveMobileTab] = useState<'categories' | 'services' | 'aliases'>('services');

  const filteredServices = services.filter((s) => s.category_id === selectedCatId);
  const selectedCategory = categories.find((c) => c.id === selectedCatId);

  const handleAddService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    const newService: ServiceItem = {
      id: `srv-${Date.now()}`,
      category_id: selectedCatId,
      name: newServiceName.trim(),
      slug: newServiceName.trim().toLowerCase().replace(/\s+/g, '-'),
      is_active: true,
      sort_order: services.length + 1,
      created_at: new Date().toISOString(),
    };

    setServices([...services, newService]);
    setNewServiceName('');
  };

  const handleAddAlias = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAliasText.trim() || !targetServiceIdForAlias) return;

    const newAlias: ServiceAlias = {
      id: `al-${Date.now()}`,
      service_id: targetServiceIdForAlias,
      alias: newAliasText.trim().toLowerCase(),
    };

    setAliases([...aliases, newAlias]);
    setNewAliasText('');
  };

  const toggleServiceActive = (id: string) => {
    setServices(
      services.map((s) => (s.id === id ? { ...s, is_active: !s.is_active } : s))
    );
  };

  return (
    <div className="flex-1 bg-slate-100 p-3 sm:p-6 space-y-5 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs">
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-600" />
          Service Catalog &amp; Smart Search Engine
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage trade categories, official service items, and customer search keywords (synonyms like &quot;tap leak&quot; or &quot;switch repair&quot;).
        </p>
      </div>

      {/* Mobile Tab Switcher */}
      <div className="lg:hidden grid grid-cols-3 gap-1 bg-slate-200/70 p-1 rounded-2xl">
        <button
          onClick={() => setActiveMobileTab('categories')}
          className={`py-2 text-xs font-bold rounded-xl transition-all ${
            activeMobileTab === 'categories' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          Categories ({categories.length})
        </button>
        <button
          onClick={() => setActiveMobileTab('services')}
          className={`py-2 text-xs font-bold rounded-xl transition-all ${
            activeMobileTab === 'services' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          Services ({filteredServices.length})
        </button>
        <button
          onClick={() => setActiveMobileTab('aliases')}
          className={`py-2 text-xs font-bold rounded-xl transition-all ${
            activeMobileTab === 'aliases' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          Keywords ({aliases.length})
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Column 1: Categories */}
        <div
          className={`${
            activeMobileTab === 'categories' ? 'block' : 'hidden lg:block'
          } bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3`}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide">
              1. Categories ({categories.length})
            </h2>
            <span className="text-[10px] text-slate-400">Select to view services</span>
          </div>

          <div className="space-y-2">
            {categories.map((cat) => {
              const isSelected = cat.id === selectedCatId;
              const count = services.filter((s) => s.category_id === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCatId(cat.id);
                    setActiveMobileTab('services');
                  }}
                  className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-500 font-bold text-emerald-950 shadow-xs ring-1 ring-emerald-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-xs font-bold">{cat.name}</span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white border border-slate-200 font-bold text-slate-600">
                    {count} services
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Column 2: Controlled Services for Category */}
        <div
          className={`${
            activeMobileTab === 'services' ? 'block' : 'hidden lg:block'
          } bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4`}
        >
          <div>
            <h2 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide">
              2. {selectedCategory?.name || 'Category'} Services
            </h2>
            <p className="text-[11px] text-slate-400">Services listed under this category</p>
          </div>

          {/* Add Service Form */}
          <form onSubmit={handleAddService} className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Inverter Installation..."
              value={newServiceName}
              onChange={(e) => setNewServiceName(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 bg-white"
            />
            <button
              type="submit"
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </form>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="p-3 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-black text-slate-900 block">{service.name}</span>
                  <span className="text-[10px] font-mono text-slate-400">slug: {service.slug}</span>
                </div>

                <button
                  onClick={() => toggleServiceActive(service.id)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                    service.is_active
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {service.is_active ? 'Active' : 'Hidden'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Keyword / Synonyms Engine */}
        <div
          className={`${
            activeMobileTab === 'aliases' ? 'block' : 'hidden lg:block'
          } bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4`}
        >
          <div>
            <h2 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide">
              3. Search Keywords &amp; Synonyms
            </h2>
            <p className="text-[11px] text-slate-400">Maps customer slang / typos to verified services</p>
          </div>

          {/* Add Alias Form */}
          <form onSubmit={handleAddAlias} className="space-y-2">
            <select
              value={targetServiceIdForAlias}
              onChange={(e) => setTargetServiceIdForAlias(e.target.value)}
              aria-label="Target Service for Synonym"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 bg-slate-50"
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  Target: {s.name}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Synonym keyword (e.g. tap drop)..."
                value={newAliasText}
                onChange={(e) => setNewAliasText(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-xs text-slate-900 bg-white"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shrink-0"
              >
                Add
              </button>
            </div>
          </form>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {aliases.map((alias) => {
              const targetService = services.find((s) => s.id === alias.service_id);
              return (
                <div
                  key={alias.id}
                  className="p-3 rounded-2xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-black text-slate-900 font-mono">&quot;{alias.alias}&quot;</span>
                    <span className="text-[10px] text-slate-500 block">
                      maps to → <strong className="text-emerald-800">{targetService?.name || 'Unknown'}</strong>
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-slate-500 border border-slate-200">
                    Alias
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
