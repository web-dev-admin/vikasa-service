'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  STANDARDIZED_SERVICES,
  TAMIL_NADU_DISTRICTS,
  VIKASA_CONFIG,
} from '@/lib/constants';
import { dataStore, ERODE_CENTER } from '@/lib/data/store';
import {
  MapPin,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Phone,
  User,
  Navigation,
  MessageCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Languages,
  Sparkles,
} from 'lucide-react';
import { Language, TRANSLATIONS } from '@/lib/taxonomy/i18n';

interface LeadFormProps {
  onSuccess?: (trackingToken: string, requestNumber: number) => void;
  initialService?: string;
}

export default function LeadForm({ onSuccess, initialService }: LeadFormProps) {
  const [lang, setLang] = useState<Language>('en');
  const t = TRANSLATIONS[lang];

  // Default date to today
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [service, setService] = useState(initialService || 'Interior Design');
  const [customServiceNote, setCustomServiceNote] = useState('');
  const [preferredDate, setPreferredDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [district, setDistrict] = useState('Erode');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');

  // Location Coordinates & Geolocation State
  const [latitude, setLatitude] = useState(ERODE_CENTER.lat);
  const [longitude, setLongitude] = useState(ERODE_CENTER.lon);
  const [isLocating, setIsLocating] = useState(false);
  const [locationSuccessText, setLocationSuccessText] = useState<string | null>(null);

  // Submission & Validation State
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedData, setSubmittedData] = useState<{
    requestNumber: number;
    trackingToken: string;
    serviceName: string;
  } | null>(null);

  const isOtherSelected = service === 'Other' || service === 'பிற / புதிய சேவை';

  // GPS Current Location Handler
  const handleUseCurrentLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setErrors((prev) => ({
        ...prev,
        location: lang === 'ta'
          ? 'உங்கள் உலாவியில் GPS ஆதரிக்கப்படவில்லை. கீழே மாவட்டத்தை தேர்ந்தெடுக்கவும்.'
          : 'Geolocation is not supported by your browser. Please select district manually.',
      }));
      return;
    }

    setIsLocating(true);
    setErrors((prev) => {
      const copy = { ...prev };
      delete copy.location;
      return copy;
    });

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lon);

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);

          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`,
            { signal: controller.signal }
          );
          clearTimeout(timeoutId);

          if (res.ok) {
            const data = await res.json();
            const road = data.address?.road || data.address?.suburb || data.address?.neighbourhood || '';
            const city = data.address?.city || data.address?.town || data.address?.county || '';
            const detectedDistrict = data.address?.state_district || data.address?.county || '';

            const matchedDistrict = TAMIL_NADU_DISTRICTS.find(
              (d) =>
                detectedDistrict.toLowerCase().includes(d.toLowerCase()) ||
                city.toLowerCase().includes(d.toLowerCase())
            );
            if (matchedDistrict) {
              setDistrict(matchedDistrict);
            }

            const formatted = [road, city, matchedDistrict || district].filter(Boolean).join(', ');
            setAddress(formatted || `${lat.toFixed(4)}, ${lon.toFixed(4)}`);
            setLocationSuccessText(t.gpsSuccessText);
          } else {
            setAddress(`GPS Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
            setLocationSuccessText(t.gpsSuccessText);
          }
        } catch {
          setAddress(`GPS Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
          setLocationSuccessText(t.gpsSuccessText);
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        let msg = lang === 'ta'
          ? 'இருப்பிடத்தை அணுக முடியவில்லை. உங்கள் மாவட்டத்தை கீழே தேர்ந்தெடுக்கவும்.'
          : 'Could not access location. Please select your district below.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = lang === 'ta'
            ? 'இருப்பிட அனுமதி மறுக்கப்பட்டது. உங்கள் மாவட்டத்தை கைமுறையாக தேர்ந்தெடுக்கவும்.'
            : 'Location permission denied. Please choose your district manually.';
        }
        setErrors((prev) => ({ ...prev, location: msg }));
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const validate = () => {
    const errs: { [key: string]: string } = {};

    if (!name.trim() || name.trim().length < 2) {
      errs.name = t.errNameRequired;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      errs.phone = t.errPhoneInvalid;
    }

    if (!service) {
      errs.service = t.errServiceRequired;
    }

    if (isOtherSelected && !customServiceNote.trim()) {
      errs.customService = t.errCustomServiceRequired;
    }

    if (!preferredDate) {
      errs.preferredDate = t.errDateRequired;
    }

    if (!district) {
      errs.district = t.errDistrictRequired;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const formattedLocation = address.trim()
        ? `${address.trim()}, ${district}`
        : `${district}, Tamil Nadu`;

      const matchedServiceObj = STANDARDIZED_SERVICES.find(
        (s) => s.name.toLowerCase() === service.toLowerCase()
      );

      // Post to central server API endpoint
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: name.trim(),
          customer_phone: cleanPhone,
          service_name: isOtherSelected ? (customServiceNote.trim() || 'Custom Home Service') : service,
          service_id: isOtherSelected ? 'srv-other' : (matchedServiceObj?.id || 'srv-general'),
          category_name: service,
          description: description.trim() || `${service} requirement in ${district}`,
          custom_service_note: isOtherSelected ? customServiceNote.trim() : undefined,
          formatted_address: formattedLocation,
          district: district,
          latitude: latitude,
          longitude: longitude,
          preferred_date: preferredDate,
          preferred_time_slot: 'Today (Within 2 Hours)',
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || t.errSubmitFailed);
      }

      const created = json.data;

      // Immediately sync with local client store and broadcast to open admin tabs
      if (created.full_request) {
        dataStore.mergeRequests([created.full_request]);
      }

      setSubmittedData({
        requestNumber: created.request_number,
        trackingToken: created.tracking_token,
        serviceName: created.service_name,
      });

      if (onSuccess) {
        onSuccess(created.tracking_token, created.request_number);
      }
    } catch (err: unknown) {
      console.error('Submission error:', err);
      setErrors({ form: err instanceof Error ? err.message : t.errSubmitFailed });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Simple Confirmation Screen
  if (submittedData) {
    return (
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="space-y-1">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            {t.confirmTitle}
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight pt-2">
            #{submittedData.requestNumber}
          </h2>
          <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed pt-1">
            {t.confirmSubtitle}
          </p>
        </div>

        {/* Request Details Box */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-left text-xs space-y-2">
          <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
            <span className="text-slate-500">{t.serviceBookedLabel}:</span>
            <span className="font-bold text-slate-900">{submittedData.serviceName}</span>
          </div>
          <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
            <span className="text-slate-500">{t.districtLabel}:</span>
            <span className="font-bold text-slate-900">{district}</span>
          </div>
          <div className="flex justify-between items-center py-1">
            <span className="text-slate-500">{t.preferredDateLabel}:</span>
            <span className="font-bold text-slate-900">{preferredDate}</span>
          </div>
        </div>

        {/* Security & Human Verification Banner */}
        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center gap-2.5 text-left text-xs text-emerald-950">
          <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
          <p className="text-[11px] leading-snug">
            <strong>{lang === 'ta' ? 'பாதுகாப்பு உறுதி:' : 'Zero Cold Calls:'}</strong> {lang === 'ta' ? 'எங்கள் விகாசா அலுவலகத்திலிருந்து மட்டுமே உங்களுக்கு தொலைபேசி அழைப்பு வரும்.' : 'Only an authorized VIKASA coordinator will call you to confirm.'}
          </p>
        </div>

        <div className="space-y-2 pt-2">
          <Link
            href={`/track/${submittedData.trackingToken}`}
            className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
          >
            <span>{t.trackButtonText}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <a
            href={VIKASA_CONFIG.telUrl}
            className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <Phone className="w-4 h-4 text-emerald-600" />
            <span>{t.callCoordinatorText} ({VIKASA_CONFIG.phoneDisplay})</span>
          </a>

          <Link
            href="/"
            className="block text-xs font-semibold text-slate-500 hover:text-slate-900 pt-2"
          >
            ← {t.homeButtonText}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl relative">
      {/* Language Switcher Badge in Form Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            {lang === 'ta' ? 'சேவை முன்பதிவு' : 'Fast Service Booking'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setLang(lang === 'en' ? 'ta' : 'en')}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
        >
          <Languages className="w-3.5 h-3.5 text-emerald-600" />
          <span>{t.switchLanguage}</span>
        </button>
      </div>

      <div className="mb-6 space-y-1">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          {t.formTitle}
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          {t.formSubtitle}
        </p>
      </div>

      {errors.form && (
        <div className="p-3 mb-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errors.form}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {/* 1. Name */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700">
            {t.fullNameLabel} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.fullNamePlaceholder}
              className={`w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border bg-slate-50/50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all ${
                errors.name ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
              }`}
            />
          </div>
          {errors.name && <p className="text-[11px] text-red-600 font-medium">{errors.name}</p>}
        </div>

        {/* 2. Phone */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700">
            {t.mobileLabel} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500 font-bold text-xs">
              +91
            </div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder={t.mobilePlaceholder}
              maxLength={10}
              className={`w-full pl-12 pr-4 py-2.5 text-sm rounded-xl border bg-slate-50/50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono ${
                errors.phone ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
              }`}
            />
          </div>
          {errors.phone ? (
            <p className="text-[11px] text-red-600 font-medium">{errors.phone}</p>
          ) : (
            <p className="text-[11px] text-slate-400">{t.mobileHint}</p>
          )}
        </div>

        {/* 3. Service Selector */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-slate-700">
            {t.serviceLabel} <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {STANDARDIZED_SERVICES.map((s) => {
              const localizedName = t.services[s.name]?.name || s.name;
              const isSelected = service.toLowerCase() === s.name.toLowerCase();

              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setService(s.name)}
                  className={`p-2.5 rounded-xl border text-left text-xs font-bold transition-all flex flex-col justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-2 ring-emerald-500/20'
                      : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate">{localizedName}</span>
                </button>
              );
            })}
          </div>
          {errors.service && <p className="text-[11px] text-red-600 font-medium">{errors.service}</p>}
        </div>

        {/* 3b. Custom Service Input (if "Other" selected) */}
        {isOtherSelected && (
          <div className="space-y-1 p-3 bg-amber-50/70 border border-amber-200 rounded-2xl animate-in fade-in duration-150">
            <label className="block text-xs font-bold text-amber-950">
              {t.customServiceLabel} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={customServiceNote}
              onChange={(e) => setCustomServiceNote(e.target.value)}
              placeholder={t.customServicePlaceholder}
              className="w-full px-3 py-2 text-sm rounded-xl border border-amber-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
            {errors.customService && (
              <p className="text-[11px] text-red-600 font-medium">{errors.customService}</p>
            )}
            <p className="text-[11px] text-amber-800">
              {lang === 'ta'
                ? 'எங்கள் ஒருங்கிணைப்பாளர் உங்கள் தேவைக்கேற்ப தகுந்த நிபுணரை கண்டறிந்து உங்களை அழைப்பார்.'
                : 'Our coordinator will manually review your custom requirement and match an appropriate specialist.'}
            </p>
          </div>
        )}

        {/* 4. District and Date Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              {t.districtLabel} <span className="text-red-500">*</span>
            </label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              {TAMIL_NADU_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700">
              {t.preferredDateLabel} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                value={preferredDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>
        </div>

        {/* 5. Address & GPS */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700">
              {t.addressLabel}
            </label>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <Navigation className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? t.gpsLocatingText : t.useGpsButton}</span>
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
              <MapPin className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t.addressPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
          {errors.location && <p className="text-[11px] text-amber-600 font-medium">{errors.location}</p>}
          {locationSuccessText && (
            <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> {locationSuccessText}
            </p>
          )}
        </div>

        {/* 6. Description */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-slate-700">
            {t.descriptionLabel}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t.descriptionPlaceholder}
            rows={2}
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
          />
        </div>

        {/* Privacy Assurance */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 leading-snug flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{t.privacyNotice}</span>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>{t.submittingText}</span>
            </>
          ) : (
            <>
              <span>{t.submitButtonText}</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
