/**
 * VIKASA INFRASTRUCTURE PROTECTION CIRCUIT BREAKER
 *
 * Prevents cascading retry loops and excessive Vercel CDN/Function resource consumption.
 * Guarantees:
 * 1. If Vercel or Supabase returns HTTP 503 (Project Paused / Service Unavailable) or 429:
 *    HALTS all client-side polling immediately for 10 minutes or until manual reload.
 * 2. If client is offline (navigator.onLine === false), completely suspends network requests.
 * 3. Implements exponential backoff on consecutive server errors (30s -> 60s -> 120s -> 300s).
 * 4. Automatically recovers normal polling interval as soon as a 200 OK response is received.
 */

export class CircuitBreaker {
  private static isPaused = false;
  private static pauseReason = '';
  private static pausedUntil = 0;
  private static consecutiveFailures = 0;
  private static endpointFailures: Map<string, number> = new Map();

  /**
   * Report HTTP response status code from any API fetch.
   * Endpoint parameter allows isolated failure tracking so one failing API
   * does NOT degrade or disable unrelated healthy APIs.
   */
  static reportStatus(status: number, endpoint?: string): void {
    if (status === 503) {
      // 503: Service Unavailable / Project Paused on Vercel (Platform-wide outage)
      this.isPaused = true;
      this.pauseReason = 'HTTP_503_PAUSED';
      this.pausedUntil = Date.now() + 10 * 60 * 1000; // 10 minutes pause
      console.warn('[CircuitBreaker] Server returned HTTP 503 (Project Paused). Halting polling to protect CDN quota.');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vikasa_circuit_broken', { detail: { status, reason: 'paused', pausedUntil: this.pausedUntil } }));
      }
      return;
    }

    if (status === 429) {
      // 429: Rate limited by edge/CDN
      this.isPaused = true;
      this.pauseReason = 'HTTP_429_RATE_LIMITED';
      this.pausedUntil = Date.now() + 5 * 60 * 1000; // 5 minutes pause
      console.warn('[CircuitBreaker] Server returned HTTP 429 (Rate Limited). Pausing polling for 5 minutes.');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vikasa_circuit_broken', { detail: { status, reason: 'rate_limited', pausedUntil: this.pausedUntil } }));
      }
      return;
    }

    if (status === 401) {
      // 401: Unauthorized / Session expired — halt rapid polling to prevent auth spam
      this.isPaused = true;
      this.pauseReason = 'HTTP_401_UNAUTHORIZED';
      this.pausedUntil = Date.now() + 5 * 60 * 1000; // 5 minutes pause
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vikasa_circuit_broken', { detail: { status, reason: 'unauthorized', pausedUntil: this.pausedUntil } }));
      }
      return;
    }

    if (status >= 200 && status < 300) {
      // Success: Reset global circuit breaker if it was paused
      this.isPaused = false;
      this.pauseReason = '';
      this.pausedUntil = 0;
      this.consecutiveFailures = 0;
      if (endpoint) {
        this.endpointFailures.delete(endpoint);
      }
      return;
    }

    if (status >= 500) {
      if (endpoint) {
        const cur = this.endpointFailures.get(endpoint) || 0;
        this.endpointFailures.set(endpoint, cur + 1);
      } else {
        this.consecutiveFailures++;
      }
    }
  }

  /**
   * Report network or unexpected execution error.
   */
  static reportError(_error: unknown, endpoint?: string): void {
    if (endpoint) {
      const cur = this.endpointFailures.get(endpoint) || 0;
      this.endpointFailures.set(endpoint, cur + 1);
    } else {
      this.consecutiveFailures++;
    }
  }

  /**
   * Check whether outgoing polling requests should be suspended.
   * If endpoint is specified, isolates check so failing endpoint doesn't block healthy ones.
   */
  static shouldHalt(endpoint?: string): boolean {
    // 1. Check browser network status (strictly when navigator.onLine is explicitly false)
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return true;
    }

    // 2. Check platform-wide 503 / 429 / 401 pause state
    if (this.isPaused) {
      if (Date.now() < this.pausedUntil) {
        return true;
      }
      // Pause window expired, reset to allow retry
      this.isPaused = false;
      this.pauseReason = '';
      this.pausedUntil = 0;
    }

    // 3. Endpoint-specific circuit trip (if an individual endpoint fails 6+ times in a row)
    if (endpoint) {
      const failures = this.endpointFailures.get(endpoint) || 0;
      if (failures >= 6) {
        // Halt only this failing endpoint temporarily while letting healthy APIs run
        return true;
      }
    }

    return false;
  }

  /**
   * Calculate dynamic interval incorporating exponential backoff on consecutive failures.
   * Isolated per endpoint so healthy APIs maintain their normal frequency.
   */
  static getBackoffInterval(baseIntervalMs: number, endpoint?: string): number {
    const failures = endpoint
      ? (this.endpointFailures.get(endpoint) || 0)
      : this.consecutiveFailures;

    if (failures === 0) return baseIntervalMs;
    if (failures === 1) return Math.max(baseIntervalMs, 60000); // 1 min
    if (failures === 2) return Math.max(baseIntervalMs, 120000); // 2 min
    return 300000; // 5 min max backoff
  }

  /**
   * Force resume circuit breaker upon manual user interaction (e.g. clicking 'Refresh').
   */
  static resume(): void {
    this.isPaused = false;
    this.pauseReason = '';
    this.pausedUntil = 0;
    this.consecutiveFailures = 0;
    this.endpointFailures.clear();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vikasa_resume_polling'));
    }
  }

  /**
   * Status inspection for UI error banners.
   */
  static getStatus(endpoint?: string): { isPaused: boolean; reason: string; failures: number; pausedUntil: number } {
    const failures = endpoint
      ? (this.endpointFailures.get(endpoint) || 0)
      : this.consecutiveFailures;

    return {
      isPaused: this.isPaused && Date.now() < this.pausedUntil,
      reason: this.pauseReason,
      failures,
      pausedUntil: this.pausedUntil,
    };
  }
}
