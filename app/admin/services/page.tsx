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

  const filteredServices = services.filter((s) => s.category_id === selectedCatId);

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
    <div className="flex-1 bg-slate-100 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-600" />
          Controlled Service Catalog & Alias Engine
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Guarantees taxonomy consistency. Synonyms such as &quot;woodwork&quot; or &quot;tap leak&quot; map deterministically to verified catalog services.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Categories */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center justify-between">
            <span>Categories ({categories.length})</span>
          </h2>
          <div className="space-y-2">
            {categories.map((cat) => {
              const isSelected = cat.id === selectedCatId;
              const count = services.filter((s) => s.category_id === cat.id).length;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCatId(cat.id)}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-500 font-bold text-emerald-950 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-xs">{cat.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white border border-slate-200 font-semibold text-slate-600">
                    {count} services
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Column 2: Controlled Services for Category */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide">
            Services in Selected Category
          </h2>

          <form onSubmit={handleAddService} className="flex gap-2">
            <input
              type="text"
              placeholder="Add official service..."
              value={newServiceName}
              onChange={(e) => setNewServiceName(e.target.value)}
              className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-900"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </form>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredServices.map((service) => (
              <div
                key={service.id}
                className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900 block">{service.name}</span>
                  <span className="text-[10px] font-mono text-slate-400">slug: {service.slug}</span>
                </div>

                <button
                  onClick={() => toggleServiceActive(service.id)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    service.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {service.is_active ? 'ACTIVE' : 'DISABLED'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Service Synonyms & Aliases */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
            <Tags className="w-4 h-4 text-purple-600" />
            Service Aliases / Synonyms
          </h2>

          <p className="text-[11px] text-slate-500">
            Map common colloquial phrases to official catalog services.
          </p>

          <form onSubmit={handleAddAlias} className="space-y-2">
            <select
              value={targetServiceIdForAlias}
              onChange={(e) => setTargetServiceIdForAlias(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white text-slate-800"
            >
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Alias e.g. 'faucet leak'"
                value={newAliasText}
                onChange={(e) => setNewAliasText(e.target.value)}
                className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-xs text-slate-900"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Map
              </button>
            </div>
          </form>

          <div className="space-y-1.5 max-h-80 overflow-y-auto">
            {aliases.map((alias) => {
              const targetService = services.find((s) => s.id === alias.service_id);
              return (
                <div
                  key={alias.id}
                  className="p-2.5 rounded-xl border border-purple-100 bg-purple-50/50 flex items-center justify-between text-xs"
                >
                  <span className="font-bold text-purple-950">&quot;{alias.alias}&quot;</span>
                  <span className="text-[10px] font-semibold text-slate-600 truncate max-w-[150px]">
                    → {targetService?.name || 'Unknown'}
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
