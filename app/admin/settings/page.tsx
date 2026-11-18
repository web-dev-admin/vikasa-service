'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PWAInstallButton from '@/components/pwa/PWAInstallButton';
import { audioAlert } from '@/lib/utils/audioAlert';
import { dataStore } from '@/lib/data/store';
import { VIKASA_CONFIG } from '@/lib/constants';
import {
  Settings,
  Bell,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Database,
  Volume2,
  Play,
  Layers,
  Plus,
  Trash2,
  AlertTriangle,
  FileCode,
  ArrowRight,
  Sparkles,
  FolderPlus,
  X,
  BellRing,
  VolumeX,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [adminEmail, setAdminEmail] = useState('admin@vikasa.com');

  // Sound Test Feedback
  const [soundTestSuccess, setSoundTestSuccess] = useState(false);

  // Quick Add Service State
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('From ₹199');
  const [isSavingService, setIsSavingService] = useState(false);
  const [serviceFeedback, setServiceFeedback] = useState<string | null>(null);
  const [servicesCount, setServicesCount] = useState(() => dataStore.getAllServices().length);

  // Dynamic Categories State
  const [categories, setCategories] = useState(() => dataStore.getAllCategories());
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('Layers');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  // Database Purge State
  const [isPurging, setIsPurging] = useState(false);
  const [purgeFeedback, setPurgeFeedback] = useState<string | null>(null);
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);

  useEffect(() => {
    // Read session
    const auth = typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('vikasa_admin_auth') || '{}')
      : null;
    if (auth?.email) setAdminEmail(auth.email);

    const updateCounts = () => {
      setServicesCount(dataStore.getAllServices().length);
      setCategories(dataStore.getAllCategories());
    };

    fetch('/api/categories')
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.success && Array.isArray(json.data) && json.data.length > 0) {
          setCategories(json.data);
        }
      })
      .catch(() => {});

    window.addEventListener('vikasa_services_updated', updateCounts);
    window.addEventListener('vikasa_categories_updated', updateCounts);
    return () => {
      window.removeEventListener('vikasa_services_updated', updateCounts);
      window.removeEventListener('vikasa_categories_updated', updateCounts);
    };
  }, []);

  const handleQuickAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setIsSavingCategory(true);
    const token = typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('vikasa_admin_auth') || '{}').token
      : null;

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-portal': 'true',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          description: newCategoryDesc.trim() || `${newCategoryName.trim()} home services`,
          icon: newCategoryIcon,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to create category');
      }

      dataStore.addCustomCategory(json.data);
      setCategories(dataStore.getAllCategories());
      setNewServiceCategory(json.data.id);
      setServiceFeedback(`Category "${json.data.name}" created and ready for services!`);
      setNewCategoryName('');
      setNewCategoryDesc('');
      setIsAddCategoryOpen(false);
    } catch (err) {
      setServiceFeedback(err instanceof Error ? err.message : 'Error adding category');
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleTestSoundAndVibration = () => {
    audioAlert.triggerFullAlert();
    setSoundTestSuccess(true);
    setTimeout(() => setSoundTestSuccess(false), 3000);
  };

  const handleQuickAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim()) return;

    setIsSavingService(true);
    setServiceFeedback(null);

    const token = typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('vikasa_admin_auth') || '{}').token
      : null;

    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-portal': 'true',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: newServiceName.trim(),
          category_id: newServiceCategory,
          description: newServiceDesc.trim() || `${newServiceName.trim()} doorstep service`,
          price_estimate: newServicePrice.trim() || 'Custom Quote',
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to add service');
      }

      dataStore.addCustomService(json.data);
      setServicesCount(dataStore.getAllServices().length);
      setServiceFeedback(`Service "${json.data.name}" added successfully and available in booking dropdown!`);
      setNewServiceName('');
      setNewServiceDesc('');
      setIsAddServiceOpen(false);
    } catch (err) {
      setServiceFeedback(err instanceof Error ? err.message : 'Error adding service');
    } finally {
      setIsSavingService(false);
    }
  };

  const handlePurgeAllData = async () => {
    setIsPurging(true);
    setPurgeFeedback(null);

    const token = typeof window !== 'undefined'
      ? JSON.parse(localStorage.getItem('vikasa_admin_auth') || '{}').token
      : null;

    try {
      const res = await fetch('/api/admin/clear-dummy-data', {
        method: 'POST',
        headers: {
          'x-admin-portal': 'true',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to purge database');
      }

      // Also clean localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('vikasa_requests');
        localStorage.removeItem('vikasa_workers');
        localStorage.removeItem('vikasa_customers');
        localStorage.removeItem('vikasa_attempts');
        localStorage.removeItem('vikasa_logs');
        localStorage.removeItem('vikasa_notifications');
        window.dispatchEvent(new Event('vikasa_data_updated'));
      }

      setPurgeFeedback('All test requests, customers, technicians, and notifications successfully wiped!');
      setIsPurgeModalOpen(false);
    } catch (err) {
      setPurgeFeedback(err instanceof Error ? err.message : 'Error purging data');
    } finally {
      setIsPurging(false);
    }
  };

  return (
    <div className="flex-1 bg-slate-100 p-3 sm:p-6 space-y-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-1 border border-emerald-200">
          <Settings className="w-3.5 h-3.5 text-emerald-700" />
          <span>Advanced Admin Settings &amp; Engine</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          System Preferences, Push Alerts &amp; Catalog Management
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure real-time Android push alerts with vibration &amp; chime sound, add new home services to booking dropdown, and maintain database integrity.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. In-App Audio Alerts & 10-Minute Siren Controls */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">In-App Audio Alerts &amp; Siren Controls</h3>
                <span className="text-[11px] text-slate-500">Urgent Chime Buzzer &amp; 10-Minute Client Siren</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Vikasa uses high-priority in-browser audio synthesis and vibration. When a new customer booking arrives, a loud continuous heavy siren sounds for up to 10 minutes until acknowledged by an admin.
            </p>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Alert Engine:</span>
                <span className="font-mono font-bold px-2 py-0.5 rounded-md text-[11px] bg-slate-200 text-slate-800">
                  DISABLED (100% SILENT)
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Customer Lead Siren:</span>
                <span className="font-mono font-bold text-slate-600">Permanently Muted</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Audio alarms and notifications are completely disabled for zero distraction.</span>
          </div>
        </div>

        {/* 2. Advanced Service Management */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Advanced Services Catalog</h3>
                <span className="text-[11px] text-slate-500">Live Booking Dropdown Options</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Add new services on the fly. Each service automatically appears in the customer booking dropdown with short descriptions for the &ldquo;i&rdquo; info button.
            </p>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Active Categories:</span>
                <span className="font-mono font-bold text-emerald-800">{categories.length} Categories</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Active Services:</span>
                <span className="font-mono font-bold text-emerald-800">{servicesCount} Services</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Customer Selection Mode:</span>
                <span className="font-bold text-slate-900">Single Dropdown + Info Card</span>
              </div>
            </div>

            {serviceFeedback && (
              <p className="text-[11px] font-bold text-emerald-700">{serviceFeedback}</p>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
            <Link
              href="/admin/services"
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer min-h-[38px]"
            >
              <span>Manage Catalog</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
            </Link>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsAddCategoryOpen(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center gap-1.5 transition-all cursor-pointer min-h-[38px]"
              >
                <FolderPlus className="w-3.5 h-3.5 text-emerald-600" />
                <span>+ Category</span>
              </button>

              <button
                onClick={() => setIsAddServiceOpen(true)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs flex items-center gap-1.5 transition-all cursor-pointer min-h-[38px] active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Service</span>
              </button>
            </div>
          </div>
        </div>

        {/* 3. Android PWA Installation */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Install Vikasa on Android</h3>
                <span className="text-[11px] text-slate-500">Standalone Progressive Web Application</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Install Vikasa directly to your Android Home Screen via Google Chrome. Enjoy a native app experience, fast offline caching, full-screen display, and real-time push alerts.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">Installation Status</span>
            <PWAInstallButton />
          </div>
        </div>

        {/* 4. Database Reset & Clean Slate Purge */}
        <div className="bg-white p-5 rounded-3xl border border-rose-200 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Database Purge &amp; Reset</h3>
                <span className="text-[11px] text-rose-600 font-bold">Wipe Test Data &bull; Clean Slate</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Remove all existing test bookings, synthetic customers, and mock technicians from both Supabase and local storage. Starts fresh without crashing.
            </p>

            <div className="p-3 bg-rose-50/60 rounded-2xl border border-rose-100 text-xs text-rose-800 space-y-1">
              <p className="font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>One-Click Safe Clean Slate</span>
              </p>
              <p className="text-[11px] text-rose-700 leading-tight">
                To also reset Supabase tables and apply ON DELETE CASCADE, run the provided SQL script in Supabase SQL Editor.
              </p>
            </div>

            {purgeFeedback && (
              <p className="text-[11px] font-bold text-emerald-700">{purgeFeedback}</p>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-medium">Danger Zone</span>
            <button
              onClick={() => setIsPurgeModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 active:scale-95 text-white transition-all cursor-pointer min-h-[38px] flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Purge All Data</span>
            </button>
          </div>
        </div>
      </div>

      {/* QUICK ADD SERVICE MODAL */}
      {isAddServiceOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Add New Service</h3>
              </div>
              <button
                onClick={() => setIsAddServiceOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickAddService} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Service Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chimney Deep Cleaning & Service"
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
                    onClick={() => setIsAddCategoryOpen(true)}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <FolderPlus className="w-3 h-3" />
                    <span>+ New Category</span>
                  </button>
                </div>
                <select
                  value={newServiceCategory || (categories[0]?.id || 'cat-other')}
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
                  Short Description (Shown on &ldquo;i&rdquo; Button)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Deep degreasing, carbon filter wash, motor inspection."
                  value={newServiceDesc}
                  onChange={(e) => setNewServiceDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Price Estimate / Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. From ₹399"
                  value={newServicePrice}
                  onChange={(e) => setNewServicePrice(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddServiceOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingService}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 disabled:opacity-50"
                >
                  {isSavingService ? 'Saving...' : 'Add Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ADD CATEGORY MODAL */}
      {isAddCategoryOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <FolderPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Create New Category</h3>
                  <span className="text-[11px] text-slate-500">Add to service catalog taxonomy</span>
                </div>
              </div>
              <button
                onClick={() => setIsAddCategoryOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickAddCategory} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Appliance Repair, Solar &amp; Inverter"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Washing machine, refrigerator, TV, microwave and kitchen appliances."
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddCategoryOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCategory}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 disabled:opacity-50"
                >
                  {isSavingCategory ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DATABASE PURGE MODAL */}
      {isPurgeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-black text-slate-900 text-base">Purge All Test &amp; Operational Data?</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                This will permanently delete all service booking requests, customer leads, technician applications, and notifications. Only your service catalog and administrative login are preserved.
              </p>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
              <p className="font-bold">Database Reset Notice:</p>
              <p className="text-[11px]">
                To update your remote Supabase schema cleanly, run the script in <code>supabase/COMPLETE_RESET_AND_FRESH_SETUP.sql</code>.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                disabled={isPurging}
                onClick={() => setIsPurgeModalOpen(false)}
                className="flex-1 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isPurging}
                onClick={handlePurgeAllData}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isPurging ? 'Purging Database...' : 'Yes, Purge Everything'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
