'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { INITIAL_CATEGORIES, INITIAL_SERVICES } from '@/lib/taxonomy/catalog';
import { dataStore, SALEM_CENTER } from '@/lib/data/store';
import LocationPicker from '@/components/maps/LocationPicker';
import {
  Briefcase,
  User,
  MapPin,
  CheckCircle2,
  ShieldCheck,
  ChevronLeft,
  Sliders,
  Send,
  AlertCircle,
} from 'lucide-react';

export default function WorkerRegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [experienceYears, setExperienceYears] = useState(5);
  const [selectedServices, setSelectedServices] = useState<string[]>(['srv-pipe-leakage']);
  const [skillsInput, setSkillsInput] = useState('');
  const [bio, setBio] = useState('');
  const [serviceRadiusKm, setServiceRadiusKm] = useState(15);
  const [baseLocationName, setBaseLocationName] = useState('Suramangalam, Salem');
  const [coords, setCoords] = useState({
    latitude: SALEM_CENTER.lat,
    longitude: SALEM_CENTER.lon,
    formatted_address: 'Suramangalam, Salem, Tamil Nadu',
  });

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || fullName.length < 2) {
      setError('Please enter your full legal name.');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (selectedServices.length === 0) {
      setError('Please select at least one service you provide.');
      return;
    }

    const skills = skillsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    dataStore.registerWorker({
      full_name: fullName.trim(),
      phone: `+91 ${cleanPhone.slice(0, 5)} ${cleanPhone.slice(5)}`,
      email: email.trim() || undefined,
      experience_years: Number(experienceYears),
      skills: skills.length > 0 ? skills : ['General Specialist'],
      bio: bio.trim() || 'Verified local service technician.',
      availability: 'offline',
      base_location_name: baseLocationName,
      latitude: coords.latitude,
      longitude: coords.longitude,
      service_radius_km: Number(serviceRadiusKm),
      service_area_names: [baseLocationName],
      service_ids: selectedServices,
    });

    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h1 className="text-2xl font-black text-slate-900">
            Registration Submitted!
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            Thank you, <span className="font-bold text-slate-900">{fullName}</span>. Your technician profile has been created in <span className="font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">PENDING VERIFICATION</span> status.
          </p>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 text-left space-y-1.5">
            <span className="font-bold text-slate-900 block flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Next Steps:
            </span>
            <p>1. A VIKASA field inspector will call you to verify your trade credentials.</p>
            <p>2. Once verified, you will be added to the operator&apos;s active dispatch radar.</p>
          </div>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-block w-full py-3 bg-slate-900 text-white font-semibold text-xs rounded-xl"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-xl mx-auto space-y-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div>
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
            Technician Network
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
            Register as a VIKASA Professional
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Receive direct, verified customer jobs coordinated through our central dispatch operator.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Info */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" />
              1. Personal Details
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500/20 text-slate-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-bold">+91</span>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="98427 11029"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-11 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="kumar@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Trade & Skills */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-600" />
              2. Trade & Services
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Select Services You Can Perform <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1">
                {INITIAL_SERVICES.map((s) => {
                  const isChecked = selectedServices.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleService(s.id)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${
                        isChecked
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="truncate pr-2">{s.name}</span>
                      <span
                        className={`w-4 h-4 rounded border flex items-center justify-center text-[10px] shrink-0 ${
                          isChecked ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'
                        }`}
                      >
                        {isChecked && '✓'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Years of Experience
                </label>
                <input
                  type="number"
                  min={1}
                  max={45}
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Key Skills (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. PVC Piping, Concealed leaks"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900"
                />
              </div>
            </div>
          </div>

          {/* Base Location & Radius */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              3. Service Base & Coverage Radius
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Base Area / Neighborhood Name
              </label>
              <input
                type="text"
                value={baseLocationName}
                onChange={(e) => setBaseLocationName(e.target.value)}
                placeholder="e.g. Suramangalam, Salem"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900"
              />
            </div>

            {/* Radius Slider */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5" /> Maximum Service Radius:
                </span>
                <span className="font-bold text-emerald-700">{serviceRadiusKm} km</span>
              </div>
              <input
                type="range"
                min={5}
                max={30}
                step={1}
                value={serviceRadiusKm}
                onChange={(e) => setServiceRadiusKm(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>5 km (Local)</span>
                <span>15 km (City-wide)</span>
                <span>30 km (District)</span>
              </div>
            </div>

            <LocationPicker
              initialLat={coords.latitude}
              initialLon={coords.longitude}
              initialAddress={coords.formatted_address}
              onLocationSelected={(loc) => {
                setCoords({
                  latitude: loc.latitude,
                  longitude: loc.longitude,
                  formatted_address: loc.formatted_address,
                });
              }}
            />
          </div>

          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Submit Worker Application</span>
          </button>
        </form>
      </div>
    </div>
  );
}
