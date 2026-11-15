/**
 * Web Audio API Alarm Buzzer & Haptic Vibration Utility
 * Synthesizes an unmistakable, high-urgency multi-pulse alarm buzzer
 * and triggers synchronized device vibration on mobile devices (e.g. Android PWA).
 */

class AudioAlertManager {
  private audioCtx: AudioContext | null = null;

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
   * Plays an authentic, high-penetration electronic alarm buzzer.
   * Synthesizes 4 rapid, urgent alternating buzzer bursts (960Hz / 1080Hz + 1920Hz harmonics)
   * modeled after industrial dispatch, emergency alert, and digital timer alarms.
   */
  public playAlarmBuzzer(cycles: number = 1): void {
    if (typeof window === 'undefined') return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const pulseDuration = 0.13; // 130ms pulse sound
      const pauseDuration = 0.07; // 70ms pause
      const cycleDuration = (pulseDuration + pauseDuration) * 4;

      const safeCycles = Math.min(3, Math.max(1, cycles));

      for (let c = 0; c < safeCycles; c++) {
        const cycleStart = now + c * (cycleDuration + 0.15);

        // 4 rapid buzzer pulses per cycle
        for (let i = 0; i < 4; i++) {
          const pulseStart = cycleStart + i * (pulseDuration + pauseDuration);
          const pulseEnd = pulseStart + pulseDuration;

          // Oscillator 1: Primary piercing buzzer tone (alternating 960Hz & 1080Hz)
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

          // Oscillator 2: High harmonic overtone (1920Hz) for piercing digital acoustic penetration
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

  /**
   * Plays the alarm buzzer sound. Maintained for full backward compatibility.
   */
  public playAlertChime(): void {
    this.playAlarmBuzzer(1);
  }

  /**
   * Triggers device haptic vibration pattern synchronized with alarm buzzer pulses.
   */
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

  /**
   * Plays alarm buzzer sound AND triggers tactile vibration simultaneously.
   */
  public triggerFullAlert(cycles: number = 1): void {
    this.playAlarmBuzzer(cycles);
    this.triggerVibration([250, 70, 250, 70, 250, 70, 450]);
  }
}

export const audioAlert = new AudioAlertManager();
