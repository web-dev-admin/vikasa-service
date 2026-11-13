/**
 * Web Audio API Alert Chime & Haptic Vibration Utility
 * Synthesizes a crisp, professional two-tone notification chime
 * and triggers device vibration on mobile devices (e.g. Android PWA).
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
   * Plays a distinct, pleasant 2-tone alert chime (E5 -> A5, 659Hz -> 880Hz)
   * used for new booking and technician registration alerts.
   */
  public playAlertChime(): void {
    if (typeof window === 'undefined') return;

    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Tone 1: 659.25 Hz (E5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.3, now + 0.02);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.18);

      // Tone 2: 880.00 Hz (A5) - brighter confirmation
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(880, now + 0.12);
      gain2.gain.setValueAtTime(0, now + 0.12);
      gain2.gain.linearRampToValueAtTime(0.35, now + 0.14);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.45);
    } catch (err) {
      console.warn('Could not play alert chime:', err);
    }
  }

  /**
   * Triggers device haptic vibration pattern for mobile / Android devices.
   */
  public triggerVibration(pattern: number[] = [200, 100, 200, 100, 200]): boolean {
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
   * Plays alert sound AND triggers tactile vibration simultaneously.
   */
  public triggerFullAlert(): void {
    this.playAlertChime();
    this.triggerVibration([200, 100, 200, 100, 200]);
  }
}

export const audioAlert = new AudioAlertManager();

