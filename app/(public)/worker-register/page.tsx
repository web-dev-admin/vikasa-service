'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  STANDARDIZED_SERVICES,
  TAMIL_NADU_DISTRICTS,
  VIKASA_CONFIG,
} from '@/lib/constants';
import { dataStore, SALEM_CENTER } from '@/lib/data/store';
import {
  Briefcase,
  User,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  ChevronLeft,
  Navigation,
  Send,
  AlertCircle,
  Phone,
  MessageCircle,
} from 'lucide-react';

export default function WorkerRegisterPage() {
  const router = useRouter();

  // Personal Information
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [sameAsPhone, setSameAsPhone] = useState(true);
  const [whatsapp, setWhatsapp] = useState('');
  const [profilePhoto, setProfilePhoto] = useState('');

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

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  // Geolocation Handler
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
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
              (d) => detectedDistrict.toLowerCase().includes(d.toLowerCase()) || city.toLowerCase().includes(d.toLowerCase())
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
      (err) => {
        setIsLocating(false);
        setError('Location permission was denied. Please select your district manually below.');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || fullName.length < 2) {
      setError('Please enter your full name.');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (selectedServices.length === 0) {
      setError('Please select at least one trade service you provide.');
      return;
    }

    const cleanWhatsapp = sameAsPhone
      ? cleanPhone
      : whatsapp.replace(/\D/g, '') || cleanPhone;

    // Resolve service names for skills
    const skillNames = selectedServices.map(
      (sid) => STANDARDIZED_SERVICES.find((s) => s.id === sid)?.name || sid
    );

    dataStore.registerWorker({
      full_name: fullName.trim(),
      phone: `+91 ${cleanPhone.slice(-10, -5)} ${cleanPhone.slice(-5)}`,
      whatsapp: `+91 ${cleanWhatsapp.slice(-10, -5)} ${cleanWhatsapp.slice(-5)}`,
      avatar_url: profilePhoto.trim() || undefined,
      experience_years: Number(experienceYears),
      skills: skillNames,
      bio: `Verified ${skillNames.join(', ')} technician based in ${district}.`,
      verification_status: 'verified',
      availability,
      active_status: 'active',
      district,
      base_location_name: address.trim() || `${district}, Tamil Nadu`,
      latitude,
      longitude,
      service_radius_km: 25,
      service_area_names: [workingArea.trim() || district],
      service_ids: selectedServices,
    });

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto ring-8 ring-emerald-50">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900">
              Registration Complete!
            </h1>
            <p className="text-sm font-semibold text-emerald-800">
              Welcome, {fullName}
            </p>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Your technician profile has been permanently stored. Our admin can now recommend and assign jobs in <span className="font-bold text-slate-900">{district}</span> directly to you.
          </p>

          <div className="space-y-2 pt-2">
            <Link
              href="/technician"
              className="block w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-md transition-all text-center"
            >
              Open Technician Job Portal
            </Link>

            <Link
              href="/"
              className="block w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl transition-all text-center"
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
            Join the VIKASA service network in Salem, Erode &amp; Tamil Nadu. Receive direct jobs from coordinators.
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

          {/* Section 1: Personal Information */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-1 border-b border-slate-100">
              <User className="w-4 h-4 text-emerald-600" />
              1. Personal Information
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Legal Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Kumarasamy R."
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number (Calling) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-xs font-bold text-slate-400">
                    +91
                  </span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="98427 11029"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-12 pr-3.5 py-2.5 rounded-2xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  WhatsApp Number
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3 text-xs font-bold text-slate-400">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    disabled={sameAsPhone}
                    placeholder="98427 11029"
                    value={sameAsPhone ? phone : whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-12 pr-3.5 py-2.5 rounded-2xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>
                <label className="flex items-center gap-1.5 mt-1.5 text-[11px] text-slate-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sameAsPhone}
                    onChange={(e) => setSameAsPhone(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Same as Calling Number</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Profile Photo URL (Optional)
              </label>
              <input
                type="url"
                placeholder="https://example.com/photo.jpg"
                value={profilePhoto}
                onChange={(e) => setProfilePhoto(e.target.value)}
                className="w-full px-4 py-2 rounded-2xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900"
              />
            </div>
          </div>

          {/* Section 2: Professional Information */}
          <div className="space-y-4 pt-2">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-1 border-b border-slate-100">
              <Briefcase className="w-4 h-4 text-emerald-600" />
              2. Professional Information
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Services Provided (Select all that apply) <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {STANDARDIZED_SERVICES.map((s) => {
                  const isChecked = selectedServices.includes(s.id);
                  return (
                    <label
                      key={s.id}
                      className={`p-3 rounded-2xl border text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all ${
                        isChecked
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-xs'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleService(s.id)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{s.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                  onChange={(e) => setAvailability(e.target.value as any)}
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
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900"
              />
            </div>
          </div>

          {/* Section 3: Location Information */}
          <div className="space-y-4 pt-2">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2 pb-1 border-b border-slate-100">
              <MapPin className="w-4 h-4 text-emerald-600" />
              3. Location &amp; District
            </h2>

            {/* GPS Location Button */}
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className="w-full py-2.5 px-4 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {isLocating ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  <span>Locating via GPS...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Use Current Location (GPS)</span>
                </>
              )}
            </button>

            {locationSuccess && (
              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 text-emerald-900 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{locationSuccess}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  District <span className="text-red-500">*</span>
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-sm font-semibold bg-white text-slate-900"
                >
                  {TAMIL_NADU_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Base Area / Landmark Details
                </label>
                <input
                  type="text"
                  placeholder="e.g. Suramangalam, Near Junction"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 active:scale-[0.99] transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Register Technician Profile</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
