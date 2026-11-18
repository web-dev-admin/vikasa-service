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
  public playHeavyNoiseBurst(): void {
    // Intentionally disabled: 100% silent
  }

  public startHeavyAlarm(_info: HeavyAlarmInfo): void {
    // Intentionally disabled: 100% silent
  }

  public stopHeavyAlarm(_isTimeout: boolean = false): void {
    // Intentionally disabled: 100% silent
  }

  public acknowledgeHeavyAlarm(_requestId?: string): void {
    // Intentionally disabled: 100% silent
  }

  public getHeavyAlarmState(): HeavyAlarmState {
    return {
      isActive: false,
      info: null,
      startedAt: null,
      elapsedSeconds: 0,
    };
  }

  public isAcknowledged(_requestId: string): boolean {
    return true; // Always acknowledged to permanently prevent alarms
  }

  public markAcknowledged(_requestId: string): void {
    // No-op
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
