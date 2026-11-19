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

/**
 * AudioAlertManager (Silent / Disabled Mode)
 *
 * All audio sirens, heavy buzzers, tactile vibrations, and looping intervals
 * have been permanently silenced and disabled.
 * All method signatures are preserved for 100% backward compatibility.
 */
export class AudioAlertManager {
  private acknowledgedSet: Set<string> = new Set();

  public playHeavyNoiseBurst(): void {
    // Intentionally disabled: 100% silent
  }

  public startHeavyAlarm(_info: HeavyAlarmInfo): void {
    // Intentionally disabled: 100% silent
  }

  public stopHeavyAlarm(_isTimeout: boolean = false): void {
    // Intentionally disabled: 100% silent
  }

  public acknowledgeHeavyAlarm(requestId?: string): void {
    if (requestId) {
      this.markAcknowledged(requestId);
    }
  }

  public getHeavyAlarmState(): HeavyAlarmState {
    return {
      isActive: false,
      info: null,
      startedAt: null,
      elapsedSeconds: 0,
    };
  }

  public isAcknowledged(requestId: string): boolean {
    if (typeof window === 'undefined' || !requestId) return false;
    if (this.acknowledgedSet.has(requestId)) return true;
    try {
      const stored = (typeof localStorage !== 'undefined' ? localStorage.getItem('vikasa_acknowledged_alarms') : null) ||
                     (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('vikasa_acknowledged_alarms') : null);
      if (stored) {
        const ids: string[] = JSON.parse(stored);
        if (Array.isArray(ids) && ids.includes(requestId)) {
          this.acknowledgedSet.add(requestId);
          return true;
        }
      }
    } catch {
      // ignore
    }
    return false;
  }

  public markAcknowledged(requestId: string): void {
    if (typeof window === 'undefined' || !requestId) return;
    this.acknowledgedSet.add(requestId);
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

  public playAlarmBuzzer(_cycles: number = 1): void {
    // Intentionally disabled: 100% silent
  }

  public playAlertChime(): void {
    // Intentionally disabled: 100% silent
  }

  public triggerVibration(_pattern?: number | number[]): void {
    // Intentionally disabled: 100% silent
  }

  public triggerFullAlert(): void {
    // Intentionally disabled: 100% silent
  }
}

export const audioAlert = new AudioAlertManager();
