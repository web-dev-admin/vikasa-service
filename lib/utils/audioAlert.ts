/**
 * Web Audio API Alarm Buzzer, Heavy Industrial Siren & Haptic Vibration Utility
 * Synthesizes:
 * 1. High-urgency multi-pulse alarm buzzer (standard alerts)
 * 2. Heavy-Noise Emergency Siren (Client / Homeowner leads only) with continuous 10-minute auto-timeout loop
 * 3. Haptic vibration synchronization on mobile devices (Android PWA)
 */

export interface HeavyAlarmInfo {
  requestId: string;
  customerName?: string;
  serviceName?: string;
  district?: string;
  message?: string;
}

export interface HeavyAlarmState {
  isActive: boolean;
  info: HeavyAlarmInfo | null;
  startedAt: number | null;
  elapsedSeconds: number;
}

class AudioAlertManager {
  private audioCtx: AudioContext | null = null;
  private heavyAlarmInterval: NodeJS.Timeout | null = null;
  private heavyAlarmTimeout: NodeJS.Timeout | null = null;
  private isHeavyAlarmActive: boolean = false;
  private activeAlarmInfo: HeavyAlarmInfo | null = null;
  private alarmStartedAt: number | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      // Auto-resume AudioContext on first user interaction to satisfy browser autoplay policies
      const unlockAudio = () => {
        if (this.audioCtx && this.audioCtx.state === 'suspended') {
          this.audioCtx.resume().catch(() => {});
        }
      };
      window.addEventListener('click', unlockAudio, { passive: true });
      window.addEventListener('touchstart', unlockAudio, { passive: true });
      window.addEventListener('keydown', unlockAudio, { passive: true });
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.audioCtx) {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      return this.audioCtx;
    } catch (e) {
      console.warn('AudioContext initialization warning:', e);
      return null;
    }
  }

  /**
   * Plays a heavy-noise, industrial multi-layer emergency buzzer burst.
   * Acoustic architecture:
   * 1. Sub-bass punch: 180Hz - 220Hz square wave with aggressive harmonic body.
   * 2. Urgent dual sweeping siren: 840Hz to 1260Hz alternating sawtooth sweep.
   * 3. Piercing industrial acoustic overtone: 2400Hz - 2800Hz resonant bandpass pulse.
   * Maximum gain (~0.85) designed for maximum penetration through laptop/phone speakers.
   */
  public playHeavyNoiseBurst(): void {
    if (typeof window === 'undefined') return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const pulseDuration = 0.22; // 220ms pulse
      const pauseDuration = 0.08; // 80ms pause
      const numPulses = 3;

      for (let i = 0; i < numPulses; i++) {
        const pulseStart = now + i * (pulseDuration + pauseDuration);
        const pulseEnd = pulseStart + pulseDuration;

        // Layer 1: Sub-bass body & punch (180Hz square wave)
        const subOsc = ctx.createOscillator();
        const subGain = ctx.createGain();
        subOsc.type = 'square';
        subOsc.frequency.setValueAtTime(180 + i * 25, pulseStart);

        subGain.gain.setValueAtTime(0, pulseStart);
        subGain.gain.linearRampToValueAtTime(0.55, pulseStart + 0.015);
        subGain.gain.setValueAtTime(0.55, pulseEnd - 0.02);
        subGain.gain.exponentialRampToValueAtTime(0.001, pulseEnd);

        subOsc.connect(subGain);
        subGain.connect(ctx.destination);
        subOsc.start(pulseStart);
        subOsc.stop(pulseEnd);

        // Layer 2: Urgent industrial siren (sweeping sawtooth 840Hz <-> 1260Hz)
        const sirenOsc = ctx.createOscillator();
        const sirenGain = ctx.createGain();
        sirenOsc.type = 'sawtooth';
        const startFreq = i % 2 === 0 ? 840 : 1260;
        const endFreq = i % 2 === 0 ? 1260 : 880;
        sirenOsc.frequency.setValueAtTime(startFreq, pulseStart);
        sirenOsc.frequency.exponentialRampToValueAtTime(endFreq, pulseEnd);

        sirenGain.gain.setValueAtTime(0, pulseStart);
        sirenGain.gain.linearRampToValueAtTime(0.8, pulseStart + 0.012);
        sirenGain.gain.setValueAtTime(0.8, pulseEnd - 0.02);
        sirenGain.gain.exponentialRampToValueAtTime(0.001, pulseEnd);

        sirenOsc.connect(sirenGain);
        sirenGain.connect(ctx.destination);
        sirenOsc.start(pulseStart);
        sirenOsc.stop(pulseEnd);

        // Layer 3: Piercing high-harmonic overtone (2400Hz - 2800Hz)
        const highOsc = ctx.createOscillator();
        const highGain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        highOsc.type = 'square';
        highOsc.frequency.setValueAtTime(2400, pulseStart);
        highOsc.frequency.linearRampToValueAtTime(2800, pulseEnd);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2600, pulseStart);
        filter.Q.setValueAtTime(3.0, pulseStart);

        highGain.gain.setValueAtTime(0, pulseStart);
        highGain.gain.linearRampToValueAtTime(0.35, pulseStart + 0.015);
        highGain.gain.setValueAtTime(0.35, pulseEnd - 0.02);
        highGain.gain.exponentialRampToValueAtTime(0.001, pulseEnd);

        highOsc.connect(filter);
        filter.connect(highGain);
        highGain.connect(ctx.destination);
        highOsc.start(pulseStart);
        highOsc.stop(pulseEnd);
      }
    } catch (err) {
      console.warn('Could not play heavy noise burst:', err);
    }
  }

  /**
   * Starts a persistent, looping Heavy Alarm specifically for Client / Homeowner leads.
   * Repeats heavy noise bursts and aggressive tactile vibration every 2.2 seconds.
   * Continues until an administrator acknowledges it OR auto-shuts down after 10 minutes (600,000ms).
   */
  public startHeavyAlarm(info: HeavyAlarmInfo): void {
    if (typeof window === 'undefined') return;

    // Check if this request was already acknowledged
    if (this.isAcknowledged(info.requestId)) {
      return;
    }

    // If already active for this exact request, avoid redundant restart
    if (this.isHeavyAlarmActive && this.activeAlarmInfo?.requestId === info.requestId) {
      return;
    }

    // Stop any existing alarm
    this.stopHeavyAlarm(false);

    this.isHeavyAlarmActive = true;
    this.activeAlarmInfo = info;
    this.alarmStartedAt = Date.now();

    // Immediate first burst & vibration
    this.playHeavyNoiseBurst();
    this.triggerVibration([450, 100, 450, 100, 600, 800]);

    // Repeating loop every 2200ms
    this.heavyAlarmInterval = setInterval(() => {
      if (!this.isHeavyAlarmActive) return;
      this.playHeavyNoiseBurst();
      this.triggerVibration([450, 100, 450, 100, 600, 800]);
    }, 2200);

    // 10-Minute Maximum Auto-Timeout (600 seconds = 600,000ms)
    const TEN_MINUTES_MS = 10 * 60 * 1000;
    this.heavyAlarmTimeout = setTimeout(() => {
      console.info('[AudioAlert] Heavy client alarm auto-timed out after 10 minutes without acknowledgment.');
      this.stopHeavyAlarm(true);
    }, TEN_MINUTES_MS);

    this.broadcastState();
  }

  /**
   * Acknowledges and immediately silences the active heavy alarm.
   * Permanently marks this request ID as acknowledged so it will never ring again.
   */
  public acknowledgeHeavyAlarm(requestId?: string): void {
    const id = requestId || this.activeAlarmInfo?.requestId;
    if (id) {
      this.markAcknowledged(id);
    }
    this.stopHeavyAlarm(false);
  }

  /**
   * Stops the heavy alarm sound, clears timers, and halts device vibration.
   */
  public stopHeavyAlarm(isTimeout: boolean = false): void {
    if (this.heavyAlarmInterval) {
      clearInterval(this.heavyAlarmInterval);
      this.heavyAlarmInterval = null;
    }
    if (this.heavyAlarmTimeout) {
      clearTimeout(this.heavyAlarmTimeout);
      this.heavyAlarmTimeout = null;
    }

    // Cancel device vibration
    if (typeof window !== 'undefined' && 'vibrate' in navigator && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(0);
      } catch {
        // ignore
      }
    }

    this.isHeavyAlarmActive = false;
    this.activeAlarmInfo = null;
    this.alarmStartedAt = null;

    this.broadcastState();
  }

  public getHeavyAlarmState(): HeavyAlarmState {
    const now = Date.now();
    const elapsedSeconds = this.alarmStartedAt ? Math.floor((now - this.alarmStartedAt) / 1000) : 0;
    return {
      isActive: this.isHeavyAlarmActive,
      info: this.activeAlarmInfo,
      startedAt: this.alarmStartedAt,
      elapsedSeconds,
    };
  }

  private broadcastState(): void {
    if (typeof window === 'undefined') return;
    try {
      const state = this.getHeavyAlarmState();
      window.dispatchEvent(new CustomEvent('vikasa_heavy_alarm_change', { detail: state }));
    } catch {
      // ignore
    }
  }

  public isAcknowledged(requestId: string): boolean {
    if (typeof window === 'undefined' || !requestId) return false;
    try {
      const stored = (typeof localStorage !== 'undefined' ? localStorage.getItem('vikasa_acknowledged_alarms') : null) ||
                     (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('vikasa_acknowledged_alarms') : null);
      if (stored) {
        const ids: string[] = JSON.parse(stored);
        return ids.includes(requestId);
      }
    } catch {
      // ignore
    }
    return false;
  }

  public markAcknowledged(requestId: string): void {
    if (typeof window === 'undefined' || !requestId) return;
    try {
      const stored = (typeof localStorage !== 'undefined' ? localStorage.getItem('vikasa_acknowledged_alarms') : null) ||
                     (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('vikasa_acknowledged_alarms') : null);
      const ids: string[] = stored ? JSON.parse(stored) : [];
      if (!ids.includes(requestId)) {
        ids.push(requestId);
        const serialized = JSON.stringify(ids.slice(-100));
        if (typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem('vikasa_acknowledged_alarms', serialized);
          } catch {}
        }
        if (typeof sessionStorage !== 'undefined') {
          try {
            sessionStorage.setItem('vikasa_acknowledged_alarms', serialized);
          } catch {}
        }
      }
    } catch {
      // ignore
    }
  }

  // --------------------------------------------------------------------------
  // Standard Alerts (Maintained for 100% Backward Compatibility)
  // --------------------------------------------------------------------------

  /**
   * Plays standard 4-pulse alarm buzzer (for minor notifications/technicians).
   */
  public playAlarmBuzzer(cycles: number = 1): void {
    if (typeof window === 'undefined') return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const pulseDuration = 0.13;
      const pauseDuration = 0.07;
      const cycleDuration = (pulseDuration + pauseDuration) * 4;
      const safeCycles = Math.min(3, Math.max(1, cycles));

      for (let c = 0; c < safeCycles; c++) {
        const cycleStart = now + c * (cycleDuration + 0.15);

        for (let i = 0; i < 4; i++) {
          const pulseStart = cycleStart + i * (pulseDuration + pauseDuration);
          const pulseEnd = pulseStart + pulseDuration;

          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.type = i % 2 === 0 ? 'sawtooth' : 'triangle';
          osc1.frequency.setValueAtTime(i % 2 === 0 ? 960 : 1080, pulseStart);

          gain1.gain.setValueAtTime(0, pulseStart);
          gain1.gain.linearRampToValueAtTime(0.45, pulseStart + 0.012);
          gain1.gain.setValueAtTime(0.45, pulseEnd - 0.02);
          gain1.gain.exponentialRampToValueAtTime(0.001, pulseEnd);

          osc1.connect(gain1);
          gain1.connect(ctx.destination);
          osc1.start(pulseStart);
          osc1.stop(pulseEnd);

          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = 'square';
          osc2.frequency.setValueAtTime(1920, pulseStart);

          const filter = ctx.createBiquadFilter();
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(2800, pulseStart);

          gain2.gain.setValueAtTime(0, pulseStart);
          gain2.gain.linearRampToValueAtTime(0.18, pulseStart + 0.015);
          gain2.gain.setValueAtTime(0.18, pulseEnd - 0.02);
          gain2.gain.exponentialRampToValueAtTime(0.001, pulseEnd);

          osc2.connect(filter);
          filter.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start(pulseStart);
          osc2.stop(pulseEnd);
        }
      }
    } catch (err) {
      console.warn('Could not play alarm buzzer:', err);
    }
  }

  public playAlertChime(): void {
    this.playAlarmBuzzer(1);
  }

  public triggerVibration(pattern: number[] = [250, 70, 250, 70, 250, 70, 450]): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    try {
      if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
        return navigator.vibrate(pattern);
      }
    } catch (e) {
      console.warn('Vibration not supported or denied:', e);
    }
    return false;
  }

  public triggerFullAlert(cycles: number = 1): void {
    this.playAlarmBuzzer(cycles);
    this.triggerVibration([250, 70, 250, 70, 250, 70, 450]);
  }
}

export const audioAlert = new AudioAlertManager();
