'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { audioAlert, HeavyAlarmState } from '@/lib/utils/audioAlert';
import { VolumeX, FileText, BellRing, Clock, AlertTriangle } from 'lucide-react';

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function HeavyAlarmBanner() {
  const [alarmState, setAlarmState] = useState<HeavyAlarmState>(() => audioAlert.getHeavyAlarmState());
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const handleStateChange = (e: Event) => {
      const customEvent = e as CustomEvent<HeavyAlarmState>;
      if (customEvent.detail) {
        setAlarmState(customEvent.detail);
        setElapsed(customEvent.detail.elapsedSeconds);
      }
    };

    window.addEventListener('vikasa_heavy_alarm_change', handleStateChange);

    // Live 1-second ticker while active
    const timer = setInterval(() => {
      const current = audioAlert.getHeavyAlarmState();
      if (current.isActive) {
        setAlarmState(current);
        setElapsed(current.elapsedSeconds);
      }
    }, 1000);

    return () => {
      window.removeEventListener('vikasa_heavy_alarm_change', handleStateChange);
      clearInterval(timer);
    };
  }, []);

  if (!alarmState.isActive || !alarmState.info) {
    return null;
  }

  const remainingSeconds = Math.max(0, 600 - elapsed); // 10-minute cap (600s)
  const isCloseToTimeout = remainingSeconds <= 60;

  const handleAcknowledge = () => {
    audioAlert.acknowledgeHeavyAlarm();
  };

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="sticky top-0 z-50 w-full bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white shadow-2xl border-b-2 border-amber-300/80 animate-in fade-in slide-in-from-top-4 duration-200"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Flashing Siren & Client Lead Details */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-white text-red-600 flex items-center justify-center shadow-lg animate-bounce">
              <BellRing className="w-5 h-5 text-red-600 animate-pulse" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-300 opacity-80" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-400" />
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-md bg-white/20 text-white text-[10px] font-black tracking-widest uppercase border border-white/30">
                🚨 HEAVY ALARM • CLIENT LEAD
              </span>
              <span className="text-[11px] font-mono text-amber-200 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Ringing {formatTimer(elapsed)}</span>
                <span className="text-white/60">•</span>
                <span className={isCloseToTimeout ? 'text-amber-300 font-bold animate-pulse' : 'text-amber-100'}>
                  Auto-off in {formatTimer(remainingSeconds)}
                </span>
              </span>
            </div>

            <div className="text-xs sm:text-sm font-extrabold text-white tracking-tight truncate mt-0.5">
              {alarmState.info.customerName || 'New Client'}{' '}
              <span className="font-normal text-amber-100">
                requested{' '}
                <strong className="font-bold underline decoration-amber-300">
                  {alarmState.info.serviceName || 'Home Service'}
                </strong>
                {alarmState.info.district ? ` in ${alarmState.info.district}` : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Mandatory Acknowledgment & View Actions */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-end shrink-0">
          <button
            type="button"
            onClick={handleAcknowledge}
            className="flex-1 md:flex-initial px-4 py-2 rounded-xl bg-white hover:bg-amber-50 active:scale-95 text-red-700 hover:text-red-800 text-xs font-black shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer min-h-[40px]"
            title="Silence the heavy siren sound and acknowledge client lead"
          >
            <VolumeX className="w-4 h-4 text-red-600 shrink-0" />
            <span>ACKNOWLEDGE &amp; SILENCE ALARM</span>
          </button>

          <Link
            href="/admin/requests"
            onClick={handleAcknowledge}
            className="px-3.5 py-2 rounded-xl bg-slate-950/60 hover:bg-slate-950 active:scale-95 text-white hover:text-amber-200 text-xs font-bold border border-white/25 flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer min-h-[40px]"
            title="Acknowledge alarm and view client booking"
          >
            <FileText className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="hidden sm:inline">View &amp; Allocate</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
