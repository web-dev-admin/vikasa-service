'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  INITIAL_CATEGORIES,
  INITIAL_SERVICES,
  resolveServiceFromInput,
} from '@/lib/taxonomy/catalog';
import { captureAttribution, trackMetaLeadConversion } from '@/lib/marketing/attribution';
import { dataStore, SALEM_CENTER } from '@/lib/data/store';
import LocationPicker from '@/components/maps/LocationPicker';
import {
  Send,
  Phone,
  User,
  AlertTriangle,
  Clock,
  Calendar,
  Sparkles,
  Camera,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export default function LeadForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [categoryId, setCategoryId] = useState(INITIAL_CATEGORIES[0].id);
  const [serviceId, setServiceId] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<'low' | 'medium' | 'high' | 'emergency'>('medium');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTimeSlot, setPreferredTimeSlot] = useState('Today (Within 2 Hours)');
  const [consent, setConsent] = useState(true);

  // Location state
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
    formatted_address: string;
    accuracy?: number;
  }>({
    latitude: SALEM_CENTER.lat,
    longitude: SALEM_CENTER.lon,
    formatted_address: 'Fairlands, Salem, Tamil Nadu',
    accuracy: 10,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-fill category from query param if available (e.g. ?cat=plumbing)
  useEffect(() => {
    const catQuery = searchParams.get('cat');
    if (catQuery) {
      const foundCat = INITIAL_CATEGORIES.find((c) => c.slug === catQuery);
      if (foundCat) {
        setCategoryId(foundCat.id);
      }
    }
    // Set default date to today
    const today = new Date().toISOString().split('T')[0];
    setPreferredDate(today);
  }, [searchParams]);

  // Available services for currently selected category
  const filteredServices = INITIAL_SERVICES.filter((s) => s.category_id === categoryId);

  // Select first service if current serviceId does not match category
  useEffect(() => {
    if (!filteredServices.some((s) => s.id === serviceId)) {
      setServiceId(filteredServices[0]?.id || '');
    }
  }, [categoryId, filteredServices, serviceId]);

  // Smart service synonym detector as user types description
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setDescription(text);

    if (text.length > 4) {
      const matched = resolveServiceFromInput(text);
      if (matched && matched.id !== serviceId) {
        setCategoryId(matched.category_id);
        setServiceId(matched.id);
      }
    }
  };

  const validate = () => {
    const errs: { [key: string]: string } = {};

    if (!fullName.trim() || fullName.trim().length < 2) {
      errs.fullName = 'Please enter your full name.';
    }

    // Indian phone format check: 10 digits starting with 6,7,8,9
    const cleanPhone = phone.replace(/\D/g, '');
    const indianPhoneRegex = /^[6-9]\d{9}$/;
    if (!indianPhoneRegex.test(cleanPhone)) {
      errs.phone = 'Enter a valid 10-digit Indian mobile number (e.g. 9840122334).';
    }

    if (!serviceId) {
      errs.serviceId = 'Please select a specific service.';
    }

    if (!description.trim() || description.trim().length < 5) {
      errs.description = 'Please describe your requirement (at least 5 characters).';
    }

    if (!consent) {
      errs.consent = 'Please give consent for a VIKASA representative to contact you.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // 1. Capture UTM & Attribution
      const attribution = captureAttribution();

      // 2. Resolve Names
      const selectedCategory = INITIAL_CATEGORIES.find((c) => c.id === categoryId);
      const selectedService = INITIAL_SERVICES.find((s) => s.id === serviceId);

      // Clean phone
      const cleanPhone = phone.replace(/\D/g, '');
      const formattedPhone = cleanPhone.length === 10 ? `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}` : phone;

      // 3. Create Service Request via local repository / DB
      const newRequest = dataStore.createRequest({
        customer_id: `cust-${Date.now()}`,
        customer_name: fullName.trim(),
        customer_phone: formattedPhone,
        customer_email: email.trim() || undefined,
        category_id: categoryId,
        category_name: selectedCategory?.name || 'General',
        service_id: serviceId,
        service_name: selectedService?.name || 'Service',
        description: description.trim(),
        formatted_address: coords.formatted_address,
        latitude: coords.latitude,
        longitude: coords.longitude,
        location_accuracy: coords.accuracy,
        urgency,
        preferred_date: preferredDate,
        preferred_time_slot: preferredTimeSlot,
        status: 'NEW',
        customer_confirmed: false,
        source: attribution.source,
        utm_source: attribution.utm_source,
        utm_medium: attribution.utm_medium,
        utm_campaign: attribution.utm_campaign,
        utm_content: attribution.utm_content,
        utm_term: attribution.utm_term,
        landing_page: attribution.landing_page,
        referrer: attribution.referrer,
      });

      // 4. Fire Meta Lead conversion tracking
      trackMetaLeadConversion(newRequest.id, newRequest.service_name);

      // 5. Route to privacy-preserving confirmation page with secure tracking token
      router.push(`/request/success/${newRequest.tracking_token}`);
    } catch (err) {
      console.error('Request creation error:', err);
      setErrors({ form: 'Unable to submit request. Please try again or call us directly.' });
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.form && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-500" />
          <span>{errors.form}</span>
        </div>
      )}

      {/* 1. Contact Information */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <User className="w-4 h-4 text-emerald-600" />
          1. Your Contact Details
        </h2>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Raj Kumar"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900"
          />
          {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>Mobile Number (WhatsApp / Calling) <span className="text-red-500">*</span></span>
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 text-xs font-semibold text-slate-400">
                +91
              </span>
              <input
                type="tel"
                required
                maxLength={10}
                placeholder="98401 22334"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                className="w-full pl-12 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium tracking-wide focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900"
              />
            </div>
            {errors.phone ? (
              <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1">
                Our operator will call this number to confirm details.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Email (Optional)
            </label>
            <input
              type="email"
              placeholder="e.g. rajkumar@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900"
            />
          </div>
        </div>
      </div>

      {/* 2. Controlled Service Selection */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          2. Required Service
        </h2>

        {/* Category Pills */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Select Category <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {INITIAL_CATEGORIES.map((cat) => {
              const isSelected = cat.id === categoryId;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategoryId(cat.id)}
                  className={`px-3 py-2.5 rounded-xl text-left border transition-all text-xs flex flex-col gap-1 ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold shadow-sm'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="font-semibold">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Specific Service Dropdown */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Specific Service <span className="text-red-500">*</span>
          </label>
          <select
            value={serviceId}
            onChange={(e) => setServiceId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white text-slate-900"
          >
            {filteredServices.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
          {errors.serviceId && <p className="text-xs text-red-500 mt-1">{errors.serviceId}</p>}
        </div>

        {/* Problem Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Describe the problem or requirement <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            required
            placeholder="e.g. Bathroom sink water pipe dripping, need tap washer replacement or pipe joint fix."
            value={description}
            onChange={handleDescriptionChange}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900"
          />
          {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
          <p className="text-[11px] text-slate-400 mt-1">
            Tip: Be specific (e.g. &apos;door lock jammed&apos; or &apos;pipe leakage&apos;) so we match the closest skilled specialist.
          </p>
        </div>
      </div>

      {/* 3. Location Picker */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <LocationPicker
          initialLat={coords.latitude}
          initialLon={coords.longitude}
          initialAddress={coords.formatted_address}
          onLocationSelected={(loc) => {
            setCoords({
              latitude: loc.latitude,
              longitude: loc.longitude,
              formatted_address: loc.formatted_address,
              accuracy: loc.accuracy,
            });
          }}
        />

        <div className="mt-3">
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Door / Street / Landmark Details
          </label>
          <input
            type="text"
            placeholder="e.g. Door No 24, Near Gokul Hospital, Brindavan Road"
            value={coords.formatted_address}
            onChange={(e) => setCoords((prev) => ({ ...prev, formatted_address: e.target.value }))}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
          />
        </div>
      </div>

      {/* 4. Preferred Time & Urgency */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-600" />
          3. Urgency & Time Preference
        </h2>

        {/* Urgency Buttons */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            How urgent is this?
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'low', label: 'Flexible', desc: 'Anytime this week' },
              { id: 'medium', label: 'Standard', desc: 'Today / Tomorrow' },
              { id: 'high', label: 'Urgent', desc: 'Within 2-4 hours' },
              { id: 'emergency', label: 'Emergency', desc: 'Immediate assistance' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setUrgency(item.id as typeof urgency)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  urgency === item.id
                    ? item.id === 'emergency'
                      ? 'bg-red-50 border-red-500 text-red-950 font-bold ring-2 ring-red-200'
                      : 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-2 ring-emerald-200'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="text-xs font-bold">{item.label}</div>
                <div className="text-[10px] text-slate-500">{item.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Time slot */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Preferred Date
            </label>
            <input
              type="date"
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Preferred Time Window
            </label>
            <select
              value={preferredTimeSlot}
              onChange={(e) => setPreferredTimeSlot(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-800 bg-white"
            >
              <option value="Today (Immediate / ASAP)">Immediately / ASAP</option>
              <option value="Morning (9:00 AM - 12:00 PM)">Morning (9:00 AM - 12:00 PM)</option>
              <option value="Afternoon (12:00 PM - 3:00 PM)">Afternoon (12:00 PM - 3:00 PM)</option>
              <option value="Evening (3:00 PM - 6:00 PM)">Evening (3:00 PM - 6:00 PM)</option>
              <option value="Night (6:00 PM - 8:30 PM)">Night (6:00 PM - 8:30 PM)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Consent & Privacy Notice */}
      <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-3">
        <label className="flex items-start gap-2.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="text-xs text-emerald-950 font-medium leading-relaxed">
            I agree to receive a verification call from a VIKASA representative to confirm my requirement and dispatch a nearby professional.
          </span>
        </label>
        {errors.consent && <p className="text-xs text-red-600 pl-6">{errors.consent}</p>}

        <div className="flex items-center gap-2 text-[11px] text-emerald-800 pt-1 border-t border-emerald-200/60 pl-6">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>Your contact info is strictly confidential and protected by VIKASA intermediary protocols.</span>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 active:scale-[0.99] transition-all disabled:opacity-75 cursor-pointer"
      >
        {isSubmitting ? (
          <>
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Sending Your Request...</span>
          </>
        ) : (
          <>
            <Send className="w-5 h-5" />
            <span>Request Service Now</span>
          </>
        )}
      </button>
    </form>
  );
}
