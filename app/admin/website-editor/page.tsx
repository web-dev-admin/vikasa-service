'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { WebsiteContent, FAQItem, ShowcaseProject } from '@/types';
import { DEFAULT_WEBSITE_CONTENT } from '@/lib/data/website_content';
import {
  Globe,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Phone,
  MessageCircle,
  HelpCircle,
  Sparkles,
  Layers,
  MapPin,
  Clock,
  ShieldCheck,
  Image as ImageIcon,
} from 'lucide-react';

export default function WebsiteEditorPage() {
  const [content, setContent] = useState<WebsiteContent>({ ...DEFAULT_WEBSITE_CONTENT });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'hero' | 'contact' | 'about' | 'faqs' | 'showcase'>('hero');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // New FAQ form state
  const [newFaqQ, setNewFaqQ] = useState('');
  const [newFaqA, setNewFaqA] = useState('');

  // New Showcase form state
  const [newShowcaseTitle, setNewShowcaseTitle] = useState('');
  const [newShowcaseSubtitle, setNewShowcaseSubtitle] = useState('');
  const [newShowcaseImg, setNewShowcaseImg] = useState('/showcase/modular_kitchen_erode.webp');
  const [newShowcaseDesc, setNewShowcaseDesc] = useState('');

  useEffect(() => {
    fetch('/api/content')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.success && json.data) {
          setContent(json.data);
        }
      })
      .catch((err) => console.warn('Could not load website content:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('vikasa_admin_auth') || '{}').token
        : null;

      const res = await fetch('/api/content', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-portal': 'true',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(content),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update website content');
      }

      showToast('Website content successfully saved and published!');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error saving content';
      showToast(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Are you sure you want to reset all content to Vikasa default settings?')) {
      setContent({ ...DEFAULT_WEBSITE_CONTENT });
      showToast('Content reset to standard defaults. Click Save to publish.');
    }
  };

  // FAQ Handlers
  const handleAddFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaqQ.trim() || !newFaqA.trim()) return;

    const newFaq: FAQItem = {
      id: `faq-${Date.now()}`,
      question: newFaqQ.trim(),
      answer: newFaqA.trim(),
      order: content.faqs.length + 1,
    };

    setContent((prev) => ({
      ...prev,
      faqs: [...prev.faqs, newFaq],
    }));

    setNewFaqQ('');
    setNewFaqA('');
    showToast('FAQ item added.');
  };

  const handleDeleteFaq = (id: string) => {
    setContent((prev) => ({
      ...prev,
      faqs: prev.faqs.filter((f) => f.id !== id),
    }));
    showToast('FAQ item removed.');
  };

  // Showcase Handlers
  const handleAddShowcase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShowcaseTitle.trim() || !newShowcaseDesc.trim()) return;

    const newProject: ShowcaseProject = {
      id: `showcase-${Date.now()}`,
      title: newShowcaseTitle.trim(),
      subtitle: newShowcaseSubtitle.trim() || 'Erode, Tamil Nadu',
      image: newShowcaseImg.trim() || '/showcase/modular_kitchen_erode.webp',
      alt: newShowcaseTitle.trim(),
      tags: ['BWP Marine Ply', 'Custom Woodwork'],
      description: newShowcaseDesc.trim(),
      categorySlug: 'interior-design',
    };

    setContent((prev) => ({
      ...prev,
      showcase: [...prev.showcase, newProject],
    }));

    setNewShowcaseTitle('');
    setNewShowcaseSubtitle('');
    setNewShowcaseDesc('');
    showToast('Showcase project added.');
  };

  const handleDeleteShowcase = (id: string) => {
    setContent((prev) => ({
      ...prev,
      showcase: prev.showcase.filter((p) => p.id !== id),
    }));
    showToast('Showcase project removed.');
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-slate-500">
        <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        <span className="text-xs font-medium">Loading Website Editor CMS...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-100 p-3 sm:p-6 space-y-6 max-w-6xl mx-auto w-full">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold text-white transition-all animate-in fade-in slide-in-from-bottom-2 ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-rose-600'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Action Header */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold mb-1 border border-emerald-200">
            <Globe className="w-3.5 h-3.5 text-emerald-700" />
            <span>Live Website CMS</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Website Content &amp; Media Editor
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Update hero headlines, phone numbers, WhatsApp, Erode address, FAQs, and portfolio works. Changes publish instantly.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleResetDefaults}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors min-h-[42px]"
            title="Reset to factory defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs active:scale-95 disabled:opacity-50 transition-all min-h-[42px]"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Publishing...' : 'Save & Publish'}</span>
          </button>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 scrollbar-none">
        <button
          onClick={() => setActiveTab('hero')}
          className={`px-4 py-2 text-xs font-bold rounded-xl shrink-0 transition-all ${
            activeTab === 'hero' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          Hero &amp; Headlines
        </button>
        <button
          onClick={() => setActiveTab('contact')}
          className={`px-4 py-2 text-xs font-bold rounded-xl shrink-0 transition-all ${
            activeTab === 'contact' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          Contact &amp; Helpline
        </button>
        <button
          onClick={() => setActiveTab('about')}
          className={`px-4 py-2 text-xs font-bold rounded-xl shrink-0 transition-all ${
            activeTab === 'about' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          About Section
        </button>
        <button
          onClick={() => setActiveTab('faqs')}
          className={`px-4 py-2 text-xs font-bold rounded-xl shrink-0 transition-all ${
            activeTab === 'faqs' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          FAQs ({content.faqs.length})
        </button>
        <button
          onClick={() => setActiveTab('showcase')}
          className={`px-4 py-2 text-xs font-bold rounded-xl shrink-0 transition-all ${
            activeTab === 'showcase' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
        >
          Showcase Projects ({content.showcase.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. HERO SECTION EDITOR */}
      {/* ========================================================================= */}
      {activeTab === 'hero' && (
        <div className="space-y-6">
          {/* Live Preview Card */}
          <div className="bg-emerald-50/70 p-5 rounded-3xl border border-emerald-200">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-2">
              Live Preview of Hero Banner
            </span>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-bold">
                {content.hero.badge}
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight">
                {content.hero.heading}{' '}
                <span className="text-emerald-700">{content.hero.headingHighlight}</span>
              </h2>
              <p className="text-xs text-slate-600">{content.hero.description}</p>
            </div>
          </div>

          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-900">Hero Section Content</h3>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Top Trust Badge / Tagline</label>
              <input
                type="text"
                value={content.hero.badge}
                onChange={(e) =>
                  setContent({ ...content, hero: { ...content.hero, badge: e.target.value } })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Main Heading (Primary Text)</label>
                <input
                  type="text"
                  value={content.hero.heading}
                  onChange={(e) =>
                    setContent({ ...content, hero: { ...content.hero, heading: e.target.value } })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Heading Highlight (Emerald Color)</label>
                <input
                  type="text"
                  value={content.hero.headingHighlight}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      hero: { ...content.hero, headingHighlight: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Hero Subtitle / Description</label>
              <textarea
                rows={3}
                value={content.hero.description}
                onChange={(e) =>
                  setContent({ ...content, hero: { ...content.hero, description: e.target.value } })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Top Announcement Banner Bar</label>
              <input
                type="text"
                value={content.hero.callout}
                onChange={(e) =>
                  setContent({ ...content, hero: { ...content.hero, callout: e.target.value } })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* 3 Trust Badges */}
            <div className="pt-2 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 mb-3">Hero Trust Badges</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Badge 1</span>
                  <input
                    type="text"
                    placeholder="IS:710"
                    value={content.hero.trustBadge1Number}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        hero: { ...content.hero, trustBadge1Number: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                  />
                  <input
                    type="text"
                    placeholder="BWP Marine Ply"
                    value={content.hero.trustBadge1Label}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        hero: { ...content.hero, trustBadge1Label: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-[11px]"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Badge 2</span>
                  <input
                    type="text"
                    placeholder="Factory"
                    value={content.hero.trustBadge2Number}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        hero: { ...content.hero, trustBadge2Number: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                  />
                  <input
                    type="text"
                    placeholder="Machine Finish"
                    value={content.hero.trustBadge2Label}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        hero: { ...content.hero, trustBadge2Label: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-[11px]"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Badge 3</span>
                  <input
                    type="text"
                    placeholder="Turnkey"
                    value={content.hero.trustBadge3Number}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        hero: { ...content.hero, trustBadge3Number: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-bold"
                  />
                  <input
                    type="text"
                    placeholder="Erode & Beyond"
                    value={content.hero.trustBadge3Label}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        hero: { ...content.hero, trustBadge3Label: e.target.value },
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-[11px]"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CONTACT & HELPLINE EDITOR */}
      {/* ========================================================================= */}
      {activeTab === 'contact' && (
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-black text-slate-900">Direct Contact &amp; Helpline Details</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Primary Helpline Phone</span>
              </label>
              <input
                type="text"
                value={content.contact.phoneDisplay}
                onChange={(e) =>
                  setContent({
                    ...content,
                    contact: {
                      ...content.contact,
                      phoneDisplay: e.target.value,
                      phone: e.target.value.replace(/\D/g, '').slice(-10),
                    },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp Consultation Number</span>
              </label>
              <input
                type="text"
                value={content.contact.whatsappDisplay}
                onChange={(e) =>
                  setContent({
                    ...content,
                    contact: {
                      ...content.contact,
                      whatsappDisplay: e.target.value,
                      whatsappNumber: e.target.value.replace(/\D/g, ''),
                    },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700">Official Support Email</label>
              <input
                type="email"
                value={content.contact.email}
                onChange={(e) =>
                  setContent({
                    ...content,
                    contact: { ...content.contact, email: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Office / Helpline Hours</span>
              </label>
              <input
                type="text"
                value={content.contact.officeHours}
                onChange={(e) =>
                  setContent({
                    ...content,
                    contact: { ...content.contact, officeHours: e.target.value },
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Office Address */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Registered Headquarters Address</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Street Address</label>
                <input
                  type="text"
                  value={content.contact.addressStreet}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      contact: { ...content.contact, addressStreet: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-500 block mb-1">City / District</label>
                <input
                  type="text"
                  value={content.contact.addressCity}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      contact: { ...content.contact, addressCity: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-500 block mb-1">Postal Code (PIN)</label>
                <input
                  type="text"
                  value={content.contact.addressPostalCode}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      contact: { ...content.contact, addressPostalCode: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ABOUT SECTION EDITOR */}
      {/* ========================================================================= */}
      {activeTab === 'about' && (
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-sm font-black text-slate-900">About Section Content</h3>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">About Section Title</label>
            <input
              type="text"
              value={content.about.title}
              onChange={(e) =>
                setContent({ ...content, about: { ...content.about, title: e.target.value } })
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700">Company Bio / Narrative</label>
            <textarea
              rows={4}
              value={content.about.description}
              onChange={(e) =>
                setContent({ ...content, about: { ...content.about, description: e.target.value } })
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. FAQS MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'faqs' && (
        <div className="space-y-6">
          {/* Add FAQ Form */}
          <form
            onSubmit={handleAddFaq}
            className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3"
          >
            <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Add New Frequently Asked Question</span>
            </h3>

            <input
              type="text"
              placeholder="Question (e.g., Do you provide custom 3D kitchen designs?)"
              value={newFaqQ}
              onChange={(e) => setNewFaqQ(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />

            <textarea
              rows={2}
              placeholder="Answer explanation..."
              value={newFaqA}
              onChange={(e) => setNewFaqA(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Question</span>
            </button>
          </form>

          {/* List of FAQs */}
          <div className="space-y-3">
            {content.faqs.map((faq, index) => (
              <div
                key={faq.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2 relative group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <span className="text-[10px] font-bold text-emerald-700 block">Q{index + 1}.</span>
                    <input
                      type="text"
                      value={faq.question}
                      onChange={(e) => {
                        const updated = content.faqs.map((f) =>
                          f.id === faq.id ? { ...f, question: e.target.value } : f
                        );
                        setContent({ ...content, faqs: updated });
                      }}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 font-bold text-xs text-slate-900 focus:border-emerald-500"
                    />
                  </div>

                  <button
                    onClick={() => handleDeleteFaq(faq.id)}
                    className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg transition-colors shrink-0 mt-4"
                    title="Delete Question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <textarea
                  rows={2}
                  value={faq.answer}
                  onChange={(e) => {
                    const updated = content.faqs.map((f) =>
                      f.id === faq.id ? { ...f, answer: e.target.value } : f
                    );
                    setContent({ ...content, faqs: updated });
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 focus:border-emerald-500"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. SHOWCASE PROJECTS GALLERY */}
      {/* ========================================================================= */}
      {activeTab === 'showcase' && (
        <div className="space-y-6">
          {/* Add Project Form */}
          <form
            onSubmit={handleAddShowcase}
            className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3"
          >
            <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>Add New Featured Work Showcase Card</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Project Title (e.g. Luxury False Ceiling & Lighting)"
                value={newShowcaseTitle}
                onChange={(e) => setNewShowcaseTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Location / Subtitle (e.g. Perundurai Road, Erode)"
                value={newShowcaseSubtitle}
                onChange={(e) => setNewShowcaseSubtitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-500">Image URL or Path</label>
              <input
                type="text"
                placeholder="/showcase/modular_kitchen_erode.webp"
                value={newShowcaseImg}
                onChange={(e) => setNewShowcaseImg(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <textarea
              rows={2}
              placeholder="Description of materials, plywood grade, and craftsmanship..."
              value={newShowcaseDesc}
              onChange={(e) => setNewShowcaseDesc(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Project Card</span>
            </button>
          </form>

          {/* List of Projects */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {content.showcase.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between"
              >
                <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover"
                  />
                  <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    <span>{item.subtitle}</span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{item.title}</h4>
                    <p className="text-xs text-slate-600 line-clamp-3 mt-1 leading-snug">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                      {item.categorySlug}
                    </span>
                    <button
                      onClick={() => handleDeleteShowcase(item.id)}
                      className="p-1 text-slate-300 hover:text-rose-500 rounded-md transition-colors"
                      title="Delete Project Card"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

