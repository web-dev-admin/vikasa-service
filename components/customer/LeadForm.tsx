'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  STANDARDIZED_SERVICES,
  TAMIL_NADU_DISTRICTS,
  VIKASA_CONFIG,
} from '@/lib/constants';
import { INITIAL_CATEGORIES } from '@/lib/taxonomy/catalog';
import { sanitizeIndianMobile10 } from '@/lib/utils/phone';
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
  Info,
  X,
} from 'lucide-react';
import { Language, TRANSLATIONS } from '@/lib/taxonomy/i18n';

function resolveInitialService(catParam: string | null | undefined, initialService?: string): string {
  if (initialService) {
    const directMatch = STANDARDIZED_SERVICES.find(
      (s) => s.name.toLowerCase() === initialService.toLowerCase() || s.slug.toLowerCase() === initialService.toLowerCase()
    );
    if (directMatch) return directMatch.name;
  }

  if (!catParam) return 'Interior Design';
  const clean = catParam.trim().toLowerCase();

  // 1. Direct slug or name match on STANDARDIZED_SERVICES
  const stdMatch = STANDARDIZED_SERVICES.find(
    (s) => s.slug.toLowerCase() === clean || s.name.toLowerCase() === clean
  );
  if (stdMatch) return stdMatch.name;

  // 2. Direct slug, id or name match on INITIAL_CATEGORIES
  const catMatch = INITIAL_CATEGORIES.find(
    (c) => c.slug.toLowerCase() === clean || c.id.toLowerCase() === clean || c.name.toLowerCase() === clean
  );
  if (catMatch) {
    switch (catMatch.slug) {
      case 'interior-design':
        return 'Interior Design';
      case 'carpentry':
        return 'Carpentry & Plywood Work';
      case 'electrical':
        return 'Electrical & Lighting';
      case 'plumbing':
        return 'Plumbing';
      case 'painting':
        return 'Painting & Wall Finish';
      case 'ac-appliances':
        return 'AC & Appliances';
      case 'cleaning':
        return 'Cleaning';
      case 'other-services':
        return 'Other Services';
      default:
        break;
    }
    const nameMatch = STANDARDIZED_SERVICES.find((s) =>
      s.name.toLowerCase().includes(catMatch.name.toLowerCase()) ||
      catMatch.name.toLowerCase().includes(s.name.toLowerCase())
    );
    if (nameMatch) return nameMatch.name;
  }

  // 3. Common aliases and synonyms
  if (clean.includes('kitchen') || clean.includes('wardrobe') || clean.includes('interior')) {
    return 'Interior Design';
  }
  if (clean.includes('wood') || clean.includes('plywood') || clean.includes('carpenter') || clean.includes('carpentry')) {
    return 'Carpentry & Plywood Work';
  }
  if (clean.includes('electric') || clean.includes('light') || clean.includes('wiring')) {
    return 'Electrical & Lighting';
  }
  if (clean.includes('plumb') || clean.includes('pipe') || clean.includes('leak') || clean.includes('tap')) {
    return 'Plumbing';
  }
  if (clean.includes('paint') || clean.includes('putty') || clean.includes('whitewash')) {
    return 'Painting & Wall Finish';
  }
  if (clean.includes('ac') || clean.includes('air') || clean.includes('appliance')) {
    return 'AC & Appliances';
  }
  if (clean.includes('clean') || clean.includes('deep-clean')) {
    return 'Cleaning';
  }
  if (clean.includes('other')) {
    return 'Other Services';
  }

  return 'Interior Design';
}

interface LeadFormProps {
  onSuccess?: (trackingToken: string, requestNumber: number) => void;
  initialService?: string;
}

export default function LeadForm({ onSuccess, initialService }: LeadFormProps) {
  const searchParams = useSearchParams();
  const catParam = searchParams.get('cat') || searchParams.get('service');

  const [lang, setLang] = useState<Language>('en');
  const t = TRANSLATIONS[lang];

  // Default date to today
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [service, setService] = useState(() => resolveInitialService(catParam, initialService));
  const [prevCatParam, setPrevCatParam] = useState(catParam);

  if (catParam !== prevCatParam) {
    setPrevCatParam(catParam);
    if (catParam) {
      setService(resolveInitialService(catParam, initialService));
    }
  }
  const [customServiceNote, setCustomServiceNote] = useState('');
  const [preferredDate, setPreferredDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [district, setDistrict] = useState('Erode');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');

  const [availableServices, setAvailableServices] = useState(() => dataStore.getAllServices());
  const [showServiceInfo, setShowServiceInfo] = useState(false);

  useEffect(() => {
    fetch('/api/services')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.success && Array.isArray(json.data) && json.data.length > 0) {
          setAvailableServices(json.data);
        }
      })
      .catch(() => {});

    const handleServicesUpdate = () => {
      setAvailableServices(dataStore.getAllServices());
    };

    window.addEventListener('vikasa_services_updated', handleServicesUpdate);
    window.addEventListener('vikasa_data_updated', handleServicesUpdate);
    return () => {
      window.removeEventListener('vikasa_services_updated', handleServicesUpdate);
      window.removeEventListener('vikasa_data_updated', handleServicesUpdate);
    };
  }, []);

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

    const cleanPhone = sanitizeIndianMobile10(phone);
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
      const cleanPhone = sanitizeIndianMobile10(phone);
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
            className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
          >
            <span>{t.trackButtonText}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <a
            href={VIKASA_CONFIG.telUrl}
            className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
          >
            <Phone className="w-4 h-4 text-emerald-600" />
            <span>{t.callCoordinatorText} ({VIKASA_CONFIG.phoneDisplay})</span>
          </a>

          <Link
            href="/"
            className="block text-xs font-semibold text-slate-600 hover:text-slate-900 pt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 rounded-lg"
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
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1"
        >
          <Languages className="w-3.5 h-3.5 text-emerald-600" />
          <span>{t.switchLanguage}</span>
        </button>
      </div>

      <div className="mb-6 space-y-1">
        <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          {t.formTitle}
        </h2>
        <p className="text-xs text-slate-600 leading-relaxed">
          {t.formSubtitle}
        </p>
      </div>

      {errors.form && (
        <div role="alert" aria-live="assertive" className="p-3 mb-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errors.form}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {/* 1. Name */}
        <div className="space-y-1">
          <label htmlFor="lead-name" className="block text-xs font-bold text-slate-700">
            {t.fullNameLabel} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <User className="w-4 h-4" />
            </div>
            <input
              id="lead-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.fullNamePlaceholder}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'lead-name-error' : undefined}
              className={`w-full pl-10 pr-4 py-2.5 text-base sm:text-sm rounded-xl border bg-slate-50/50 text-slate-900 focus:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1 transition-all ${
                errors.name ? 'border-red-400 bg-red-50/20' : 'border-slate-200 focus:border-emerald-600'
              }`}
            />
          </div>
          {errors.name && (
            <p id="lead-name-error" role="alert" className="text-[11px] text-red-700 font-medium">
              {errors.name}
            </p>
          )}
        </div>

        {/* 2. Phone */}
        <div className="space-y-1">
          <label htmlFor="lead-phone" className="block text-xs font-bold text-slate-700">
            {t.mobileLabel} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-700 font-bold text-xs">
              +91
            </div>
            <input
              id="lead-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(sanitizeIndianMobile10(e.target.value))}
              onPaste={(e) => {
                e.preventDefault();
                const pasted = e.clipboardData.getData('text');
                setPhone(sanitizeIndianMobile10(pasted));
              }}
              placeholder={t.mobilePlaceholder}
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? 'lead-phone-error' : 'lead-phone-hint'}
              className={`w-full pl-12 pr-4 py-2.5 text-base sm:text-sm rounded-xl border bg-slate-50/50 text-slate-900 focus:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1 transition-all font-mono ${
                errors.phone ? 'border-red-400 bg-red-50/20' : 'border-slate-200 focus:border-emerald-600'
              }`}
            />
          </div>
          {errors.phone ? (
            <p id="lead-phone-error" role="alert" className="text-[11px] text-red-700 font-medium">
              {errors.phone}
            </p>
          ) : (
            <p id="lead-phone-hint" className="text-[11px] text-slate-600 font-medium">
              {t.mobileHint}
            </p>
          )}
        </div>

        {/* 3. Service Selector Dropdown & "i" Info Tooltip */}
        {(() => {
          const activeServiceObj = availableServices.find(
            (s) => s.name.toLowerCase() === service.toLowerCase() || s.id === service
          );
          const localizedServiceName = t.services[service]?.name || activeServiceObj?.name || service;
          const currentServiceDescription =
            t.services[service]?.description ||
            activeServiceObj?.description ||
            (lang === 'ta'
              ? 'விகாசா சரிபார்க்கப்பட்ட தொழில் வல்லுநர்கள் வழங்கும் நம்பகமான சேவை.'
              : 'Verified Vikasa technician doorstep service with transparent rates.');
          const currentServicePrice = activeServiceObj?.price_estimate;

          return (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="lead-service" className="block text-xs font-bold text-slate-700">
                  {t.serviceLabel} <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-slate-500 font-medium">
                  {lang === 'ta' ? 'ஒரு சேவையை மட்டும் தேர்வு செய்யவும்' : 'Select one service'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <select
                    id="lead-service"
                    value={service}
                    onChange={(e) => {
                      setService(e.target.value);
                      setShowServiceInfo(true);
                    }}
                    aria-invalid={Boolean(errors.service)}
                    aria-describedby={errors.service ? 'lead-service-error' : undefined}
                    className={`w-full px-4 py-3 min-h-[48px] rounded-2xl border text-sm font-semibold transition-all bg-white text-slate-900 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1 focus-visible:border-emerald-600 ${
                      errors.service ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                    }`}
                  >
                    <option value="" disabled>
                      {lang === 'ta' ? '-- சேவையைத் தேர்ந்தெடுக்கவும் --' : '-- Choose a Service --'}
                    </option>
                    {availableServices
                      .filter((s) => s.is_active !== false)
                      .map((s) => {
                        const displayName = t.services[s.name]?.name || s.name;
                        return (
                          <option key={s.id} value={s.name}>
                            {displayName}
                          </option>
                        );
                      })}
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setShowServiceInfo((prev) => !prev)}
                  aria-label={lang === 'ta' ? 'சேவை விவரங்களைப் பார்க்க' : 'View service details'}
                  title={lang === 'ta' ? 'சேவை விளக்கம்' : 'Click for service details'}
                  className={`min-h-[48px] min-w-[48px] rounded-2xl border flex items-center justify-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1 active:scale-95 shadow-xs ${
                    showServiceInfo
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200'
                  }`}
                >
                  <Info className="w-5 h-5" />
                </button>
              </div>

              {/* "i" Info Card displaying short description */}
              {showServiceInfo && service && (
                <div className="p-3.5 bg-emerald-50/90 border border-emerald-200 rounded-2xl text-xs space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                      <span>{localizedServiceName}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowServiceInfo(false)}
                      className="text-slate-400 hover:text-slate-700 p-0.5 rounded-md cursor-pointer"
                      aria-label="Close"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    {currentServiceDescription}
                  </p>
                  {currentServicePrice && (
                    <div className="pt-0.5">
                      <span className="inline-block text-[10px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-lg border border-emerald-200">
                        {currentServicePrice}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {errors.service && (
                <p id="lead-service-error" role="alert" className="text-[11px] text-red-700 font-medium">
                  {errors.service}
                </p>
              )}
            </div>
          );
        })()}

        {/* 3b. Custom Service Input (if "Other" selected) */}
        {isOtherSelected && (
          <div className="space-y-1 p-3 bg-amber-50/70 border border-amber-200 rounded-2xl animate-in fade-in duration-150">
            <label htmlFor="lead-custom-service" className="block text-xs font-bold text-amber-950">
              {t.customServiceLabel} <span className="text-red-500">*</span>
            </label>
            <input
              id="lead-custom-service"
              type="text"
              value={customServiceNote}
              onChange={(e) => setCustomServiceNote(e.target.value)}
              placeholder={t.customServicePlaceholder}
              aria-invalid={!!errors.customService}
              aria-describedby={errors.customService ? 'lead-custom-error' : undefined}
              className="w-full px-3 py-2 text-base sm:text-sm rounded-xl border border-amber-300 bg-white text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-1"
            />
            {errors.customService && (
              <p id="lead-custom-error" role="alert" className="text-[11px] text-red-700 font-medium">
                {errors.customService}
              </p>
            )}
            <p className="text-[11px] text-amber-900 font-medium">
              {lang === 'ta'
                ? 'எங்கள் ஒருங்கிணைப்பாளர் உங்கள் தேவைக்கேற்ப தகுந்த நிபுணரை கண்டறிந்து உங்களை அழைப்பார்.'
                : 'Our coordinator will manually review your custom requirement and match an appropriate specialist.'}
            </p>
          </div>
        )}

        {/* 4. District and Date Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label htmlFor="lead-district" className="block text-xs font-bold text-slate-700">
              {t.districtLabel} <span className="text-red-500">*</span>
            </label>
            <select
              id="lead-district"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              aria-invalid={!!errors.district}
              aria-describedby={errors.district ? 'lead-district-error' : undefined}
              className="w-full px-3 py-2.5 text-base sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 font-semibold focus:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1 focus:border-emerald-600"
            >
              {TAMIL_NADU_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            {errors.district && (
              <p id="lead-district-error" role="alert" className="text-[11px] text-red-700 font-medium">
                {errors.district}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label htmlFor="lead-preferred-date" className="block text-xs font-bold text-slate-700">
              {t.preferredDateLabel} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="lead-preferred-date"
                type="date"
                value={preferredDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setPreferredDate(e.target.value)}
                aria-invalid={!!errors.preferredDate}
                aria-describedby={errors.preferredDate ? 'lead-date-error' : undefined}
                className="w-full px-3 py-2.5 text-base sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 font-medium focus:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1 focus:border-emerald-600"
              />
            </div>
            {errors.preferredDate && (
              <p id="lead-date-error" role="alert" className="text-[11px] text-red-700 font-medium">
                {errors.preferredDate}
              </p>
            )}
          </div>
        </div>

        {/* 5. Address & GPS */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="lead-address" className="block text-xs font-bold text-slate-700">
              {t.addressLabel}
            </label>
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              aria-label="Use device GPS location"
              className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1 rounded-sm active:scale-95 transition-transform"
            >
              <Navigation className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? t.gpsLocatingText : t.useGpsButton}</span>
            </button>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <MapPin className="w-4 h-4" />
            </div>
            <input
              id="lead-address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={t.addressPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 text-base sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1 focus:border-emerald-600"
            />
          </div>
          {errors.location && (
            <p role="alert" className="text-[11px] text-amber-800 font-medium">
              {errors.location}
            </p>
          )}
          {locationSuccessText && (
            <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {locationSuccessText}
            </p>
          )}
        </div>

        {/* 6. Description */}
        <div className="space-y-1">
          <label htmlFor="lead-description" className="block text-xs font-bold text-slate-700">
            {t.descriptionLabel}
          </label>
          <textarea
            id="lead-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t.descriptionPlaceholder}
            rows={2}
            className="w-full px-3.5 py-2 text-base sm:text-sm rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 focus:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1 focus:border-emerald-600 resize-none"
          />
        </div>

        {/* Privacy Assurance */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 leading-snug flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{t.privacyNotice}</span>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="min-h-[48px] w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
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
