'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  STANDARDIZED_SERVICES,
  TAMIL_NADU_DISTRICTS,
  VIKASA_CONFIG,
} from '@/lib/constants';
import { dataStore, SALEM_CENTER } from '@/lib/data/store';
import {
  MapPin,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Phone,
  User,
  Wrench,
  Navigation,
  MessageCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface LeadFormProps {
  onSuccess?: (trackingToken: string, requestNumber: number) => void;
}

export default function LeadForm({ onSuccess }: LeadFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Form Fields in exact requested order:
  // Name -> Mobile Number -> Service Required -> Preferred Date -> Location -> Short Description
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [service, setService] = useState('Plumbing');
  const [preferredDate, setPreferredDate] = useState('');
  const [district, setDistrict] = useState('Salem');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');

  // Location Coordinates & Geolocation State
  const [latitude, setLatitude] = useState(SALEM_CENTER.lat);
  const [longitude, setLongitude] = useState(SALEM_CENTER.lon);
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

  // Set default date to today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setPreferredDate(today);

    // Auto-select service from query params (?cat=... or ?service=...)
    const queryService = searchParams.get('service') || searchParams.get('cat');
    if (queryService) {
      const match = STANDARDIZED_SERVICES.find(
        (s) => s.slug === queryService || s.name.toLowerCase() === queryService.toLowerCase()
      );
      if (match) {
        setService(match.name);
      }
    }
  }, [searchParams]);

  // GPS Current Location Handler
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrors((prev) => ({
        ...prev,
        location: 'Geolocation is not supported by your browser. Please select district manually.',
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
          // Reverse geocoding via OpenStreetMap reverse lookup with 4s timeout
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

            // Match detected district to predefined list
            const matchedDistrict = TAMIL_NADU_DISTRICTS.find(
              (d) => detectedDistrict.toLowerCase().includes(d.toLowerCase()) || city.toLowerCase().includes(d.toLowerCase())
            );
            if (matchedDistrict) {
              setDistrict(matchedDistrict);
            }

            const formatted = [road, city, matchedDistrict || district].filter(Boolean).join(', ');
            setAddress(formatted || `${lat.toFixed(4)}, ${lon.toFixed(4)}`);
            setLocationSuccessText(`Location captured: ${formatted || 'GPS Verified'}`);
          } else {
            setAddress(`Current Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
            setLocationSuccessText('GPS Location pinned successfully.');
          }
        } catch {
          setAddress(`Current Location (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
          setLocationSuccessText('GPS Location pinned successfully.');
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        let msg = 'Could not access location. Please select your district below.';
        if (err.code === err.PERMISSION_DENIED) {
          msg = 'Location permission denied. Please choose your district manually.';
        }
        setErrors((prev) => ({ ...prev, location: msg }));
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const validate = () => {
    const errs: { [key: string]: string } = {};

    if (!name.trim() || name.trim().length < 2) {
      errs.name = 'Please enter your name.';
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      errs.phone = 'Enter a valid 10-digit mobile number.';
    }

    if (!service) {
      errs.service = 'Please select a service.';
    }

    if (!preferredDate) {
      errs.preferredDate = 'Please select a preferred date.';
    }

    if (!district) {
      errs.district = 'Please select your district.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const formattedPhone = `+91 ${cleanPhone.slice(-10, -5)} ${cleanPhone.slice(-5)}`;

      const formattedLocation = address.trim()
        ? `${address.trim()}, ${district}`
        : `${district}, Tamil Nadu`;

      const matchedServiceObj = STANDARDIZED_SERVICES.find((s) => s.name === service);

      const newReq = dataStore.createRequest({
        customer_id: '', // Automatically created/upserted by dataStore
        customer_name: name.trim(),
        customer_phone: formattedPhone,
        customer_whatsapp: formattedPhone,
        service_id: matchedServiceObj?.id || 'srv-general',
        service_name: service,
        category_id: 'cat-general',
        category_name: service,
        description: description.trim() || `${service} requirement in ${district}`,
        formatted_address: formattedLocation,
        district: district,
        latitude: latitude,
        longitude: longitude,
        preferred_date: preferredDate,
        preferred_time_slot: 'Today (Within 2 Hours)',
        status: 'NEW',
        customer_confirmed: false,
      });

      setSubmittedData({
        requestNumber: newReq.request_number,
        trackingToken: newReq.tracking_token,
        serviceName: newReq.service_name,
      });

      if (onSuccess) {
        onSuccess(newReq.tracking_token, newReq.request_number);
      }
    } catch (err) {
      console.error('Submission error:', err);
      setErrors({ form: 'Unable to submit request. Please try again or call 9865652420.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Simple Confirmation Screen
  if (submittedData) {
    return (
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xl shadow-emerald-950/5 text-center space-y-5">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Your request has been received.
          </h2>
          <p className="text-sm font-semibold text-emerald-800">
            Request ID: #{submittedData.requestNumber}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 text-xs text-emerald-950 text-left space-y-1.5">
          <div className="font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Our team will contact you shortly.</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            A coordinator will call <span className="font-semibold text-slate-900">{phone}</span> to confirm your {submittedData.serviceName} service and arrange a nearby technician.
          </p>
        </div>

        <div className="space-y-2 pt-2">
          <a
            href={`https://wa.me/${VIKASA_CONFIG.whatsappNumber}?text=${encodeURIComponent(`Hello VIKASA, I just submitted request #${submittedData.requestNumber} for ${submittedData.serviceName}.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Chat with Us on WhatsApp</span>
          </a>

          <Link
            href={`/track/${submittedData.trackingToken}`}
            className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
          >
            <span>Track Request Status</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-900/5 overflow-hidden">
      {/* Top Friendly Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white px-6 py-5">
        <h2 className="text-lg sm:text-xl font-black tracking-tight">
          Tell us what you need
        </h2>
        <p className="text-xs text-emerald-100 mt-0.5">
          Fast doorstep service across Salem, Erode &amp; Tamil Nadu.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-5">
        {errors.form && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{errors.form}</span>
          </div>
        )}

        {/* 1. Name */}
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
            1. Your Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              required
              placeholder="e.g. Arun Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900"
            />
          </div>
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        {/* 2. Mobile Number */}
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
            2. Mobile Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-4 top-3.5 text-xs font-bold text-slate-400">
              +91
            </span>
            <input
              type="tel"
              required
              maxLength={10}
              placeholder="98401 22334"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 text-sm font-semibold tracking-wide focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900"
            />
          </div>
          {errors.phone ? (
            <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
          ) : (
            <p className="text-[11px] text-slate-400 mt-1">
              Enter a valid 10-digit mobile number for appointment confirmation.
            </p>
          )}
        </div>

        {/* 3. Service Required (Clean dropdown) */}
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
            3. Service Required <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              value={service}
              onChange={(e) => setService(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-white text-slate-900 cursor-pointer"
            >
              {STANDARDIZED_SERVICES.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          {errors.service && <p className="text-xs text-red-500 mt-1">{errors.service}</p>}
        </div>

        {/* 4. Preferred Date */}
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
            4. Preferred Date <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="date"
              required
              value={preferredDate}
              onChange={(e) => setPreferredDate(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 bg-white"
            />
          </div>
          {errors.preferredDate && <p className="text-xs text-red-500 mt-1">{errors.preferredDate}</p>}
        </div>

        {/* 5. Location with GPS Button + Standardized District Dropdown */}
        <div className="space-y-2.5 pt-1">
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
            5. Location <span className="text-red-500">*</span>
          </label>

          {/* GPS Location Button */}
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="w-full py-2.5 px-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-98"
          >
            {isLocating ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                <span>Detecting location...</span>
              </>
            ) : (
              <>
                <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                <span>Use My Current Location</span>
              </>
            )}
          </button>

          {locationSuccessText && (
            <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="truncate">{locationSuccessText}</span>
            </div>
          )}

          {errors.location && (
            <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200">
              {errors.location}
            </p>
          )}

          {/* Predefined District Dropdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                District <span className="text-red-500">*</span>
              </label>
              <select
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white text-slate-900"
              >
                {TAMIL_NADU_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Area / Street Details (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Fairlands / Door 24"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
              />
            </div>
          </div>
        </div>

        {/* 6. Short Description */}
        <div>
          <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
            6. Short Description
          </label>
          <textarea
            rows={2}
            placeholder="Briefly describe what needs fixing (e.g. tap leaking under bathroom sink)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 placeholder:text-slate-400"
          />
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-75"
          >
            {isSubmitting ? (
              <>
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Sending Request...</span>
              </>
            ) : (
              <span>Submit Request</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
