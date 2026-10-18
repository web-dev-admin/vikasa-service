'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  STANDARDIZED_SERVICES,
  TAMIL_NADU_DISTRICTS,
  VIKASA_CONFIG,
} from '@/lib/constants';
import { SALEM_CENTER } from '@/lib/data/store';
import {
  Briefcase,
  User,
  MapPin,
  CheckCircle2,
  ChevronLeft,
  Navigation,
  Send,
  AlertCircle,
  PhoneCall,
  Clock,
} from 'lucide-react';

export default function WorkerRegisterPage() {
  // Personal Information
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [sameAsPhone, setSameAsPhone] = useState(true);
  const [whatsapp, setWhatsapp] = useState('');

  // Professional Information
  const [selectedServices, setSelectedServices] = useState<string[]>(['srv-plumbing']);
  const [experienceYears, setExperienceYears] = useState(5);
  const [availability, setAvailability] = useState<'available' | 'busy' | 'offline'>('available');
  const [workingArea, setWorkingArea] = useState('Salem & Surrounding');

  // Location Information
  const [district, setDistrict] = useState('Salem');
  const [address, setAddress] = useState('Fairlands, Salem');
  const [latitude, setLatitude] = useState(SALEM_CENTER.lat);
  const [longitude, setLongitude] = useState(SALEM_CENTER.lon);
  const [isLocating, setIsLocating] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  // Geolocation Handler
  const handleUseCurrentLocation = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Geolocation is not supported by your browser. Please select district manually.');
      return;
    }

    setIsLocating(true);
    setError(null);

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
            const city = data.address?.city || data.address?.town || data.address?.suburb || '';
            const detectedDistrict = data.address?.state_district || data.address?.county || '';

            const matchedDistrict = TAMIL_NADU_DISTRICTS.find(
              (d) =>
                detectedDistrict.toLowerCase().includes(d.toLowerCase()) ||
                city.toLowerCase().includes(d.toLowerCase())
            );
            if (matchedDistrict) setDistrict(matchedDistrict);

            const label = [city, matchedDistrict || district].filter(Boolean).join(', ');
            setAddress(label || `${lat.toFixed(4)}, ${lon.toFixed(4)}`);
            setLocationSuccess(`Location pinned: ${label || 'GPS Coordinates captured'}`);
          } else {
            setLocationSuccess('GPS Coordinates captured successfully.');
          }
        } catch {
          setLocationSuccess('GPS Coordinates captured successfully.');
        } finally {
          setIsLocating(false);
        }
      },
      () => {
        setIsLocating(false);
        setError('Location permission was denied. Please select your district manually below.');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setError('Please enter your full name (minimum 2 letters).');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
      setError('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    if (selectedServices.length === 0) {
      setError('Please select at least one trade service you provide.');
      return;
    }

    const cleanWhatsapp = sameAsPhone
      ? cleanPhone
      : whatsapp.replace(/\D/g, '') || cleanPhone;

    const skillNames = selectedServices.map(
      (sid) => STANDARDIZED_SERVICES.find((s) => s.id === sid)?.name || sid
    );

    setIsSubmitting(true);

    try {
      // POST to central server API endpoint
      const res = await fetch('/api/technicians', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          phone: cleanPhone,
          whatsapp: cleanWhatsapp,
          experience_years: Number(experienceYears),
          skills: skillNames,
          service_ids: selectedServices,
          district: district,
          base_location_name: address.trim() || `${district}, Tamil Nadu`,
          latitude: latitude,
          longitude: longitude,
          service_radius_km: 25,
          availability: availability,
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to submit registration');
      }

      setSubmitted(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit registration. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center space-y-5 animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto ring-8 ring-amber-50">
            <Clock className="w-9 h-9" />
          </div>

          <div className="space-y-1">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Registration Under Review
            </span>
            <h1 className="text-2xl font-black text-slate-900 pt-2">
              Welcome, {fullName}
            </h1>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Your technician profile has been successfully registered and is <strong>pending verification</strong>.
          </p>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 text-left text-xs space-y-2 text-slate-700">
            <p className="font-semibold text-slate-900">What happens next?</p>
            <p>1. Our operations coordinator will call you to verify your trade experience, documents, and active service areas in <strong>{district}</strong>.</p>
            <p>2. Once verified, you will be added to our local dispatch pool.</p>
            <p>3. When customer requirements arise in your area, our coordinator will call you directly to confirm willingness and schedule the job.</p>
          </div>

          <div className="space-y-2 pt-2">
            <a
              href={VIKASA_CONFIG.telUrl}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <PhoneCall className="w-4 h-4" />
              <span>Contact Coordinator: {VIKASA_CONFIG.phoneDisplay}</span>
            </a>

            <Link
              href="/"
              className="block w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl transition-all text-center"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-white to-slate-50 py-10 px-4">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Navigation Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Home
          </Link>
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Technician Registration
          </span>
        </div>

        {/* Title */}
        <div className="space-y-1 text-center">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Register as a Verified Technician
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Join the VIKASA service network in Salem &amp; Tamil Nadu. Receive direct jobs from coordinators.
          </p>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xl shadow-slate-900/5 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Contact Information */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <User className="w-3.5 h-3.5" /> 1. Contact Details
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Kumarasamy R."
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Mobile Number (Calls) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-2.5 text-sm font-semibold text-slate-400">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  placeholder="98427 11029"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full pl-14 pr-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 font-mono"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sameAsPhone}
                  onChange={(e) => setSameAsPhone(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="text-xs font-medium text-slate-700">
                  WhatsApp number is the same as calling number
                </span>
              </label>

              {!sameAsPhone && (
                <div className="relative pt-1">
                  <span className="absolute left-4 top-3.5 text-sm font-semibold text-slate-400">
                    +91
                  </span>
                  <input
                    type="tel"
                    placeholder="WhatsApp number"
                    maxLength={10}
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="w-full pl-14 pr-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900 font-mono"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 2. Trade & Experience */}
          <div className="space-y-4 pt-2">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Briefcase className="w-3.5 h-3.5" /> 2. Services &amp; Trade Skills
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Select Your Trades <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {STANDARDIZED_SERVICES.filter((s) => s.id !== 'srv-other').map((s) => {
                  const isChecked = selectedServices.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleService(s.id)}
                      className={`p-3 rounded-2xl border text-xs font-bold text-left transition-all flex flex-col justify-between cursor-pointer ${
                        isChecked
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-2 ring-emerald-500/20'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-sm block mb-1">{s.name}</span>
                      <span className="text-[10px] text-slate-500">
                        {isChecked ? '✓ Selected' : '+ Add'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Years of Experience
                </label>
                <select
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-semibold bg-white text-slate-900"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20].map((yr) => (
                    <option key={yr} value={yr}>
                      {yr} {yr === 1 ? 'Year' : 'Years'} Experience
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Current Availability
                </label>
                <select
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value as 'available' | 'busy' | 'offline')}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-semibold bg-white text-slate-900"
                >
                  <option value="available">Available (Ready for Jobs)</option>
                  <option value="busy">Busy (Currently on Job)</option>
                  <option value="offline">Unavailable (Leave / Off Duty)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Working Area / Localities
              </label>
              <input
                type="text"
                placeholder="e.g. Fairlands, Suramangalam, Meyyanur (Salem)"
                value={workingArea}
                onChange={(e) => setWorkingArea(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900"
              />
            </div>
          </div>

          {/* 3. Base Location */}
          <div className="space-y-4 pt-2">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <MapPin className="w-3.5 h-3.5" /> 3. Base Location
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Home District <span className="text-red-500">*</span>
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-semibold bg-white text-slate-900"
                >
                  {TAMIL_NADU_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Base Address / Landmark
                  </label>
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    disabled={isLocating}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <Navigation className={`w-3 h-3 ${isLocating ? 'animate-spin' : ''}`} />
                    <span>{isLocating ? 'Locating...' : 'GPS Pin'}</span>
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Near New Bus Stand, Meyyanur"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-900"
                />
              </div>
            </div>

            {locationSuccess && (
              <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{locationSuccess}</span>
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Submitting Registration...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Technician Registration</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
