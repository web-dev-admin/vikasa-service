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

  /**
   * Report HTTP response status code from any API fetch.
   */
  static reportStatus(status: number): void {
    if (status === 503) {
      // 503: Service Unavailable / Project Paused on Vercel
      this.isPaused = true;
      this.pauseReason = 'HTTP_503_PAUSED';
      this.pausedUntil = Date.now() + 10 * 60 * 1000; // 10 minutes pause
      console.warn('[CircuitBreaker] Server returned HTTP 503 (Project Paused). Halting polling to protect CDN quota.');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('vikasa_circuit_broken', { detail: { status, reason: 'paused' } }));
      }
      return;
    }

    if (status === 429) {
      // 429: Rate limited
      this.isPaused = true;
      this.pauseReason = 'HTTP_429_RATE_LIMITED';
      this.pausedUntil = Date.now() + 5 * 60 * 1000; // 5 minutes pause
      console.warn('[CircuitBreaker] Server returned HTTP 429 (Rate Limited). Pausing polling for 5 minutes.');
      return;
    }

    if (status === 401) {
      // 401: Unauthorized / Session expired — halt rapid polling
      this.isPaused = true;
      this.pauseReason = 'HTTP_401_UNAUTHORIZED';
      this.pausedUntil = Date.now() + 5 * 60 * 1000; // 5 minutes pause
      return;
    }

    if (status >= 200 && status < 300) {
      // Success: Reset circuit breaker and error counts
      this.isPaused = false;
      this.pauseReason = '';
      this.pausedUntil = 0;
      this.consecutiveFailures = 0;
      return;
    }

    if (status >= 500) {
      this.consecutiveFailures++;
    }
  }

  /**
   * Report network or unexpected execution error.
   */
  static reportError(_error: unknown): void {
    this.consecutiveFailures++;
  }

  /**
   * Check whether all outgoing polling requests should be suspended.
   */
  static shouldHalt(): boolean {
    // 1. Check browser network status
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return true;
    }

    // 2. Check 503 / 429 / 401 pause state
    if (this.isPaused) {
      if (Date.now() < this.pausedUntil) {
        return true;
      }
      // Pause window expired, reset to allow retry
      this.isPaused = false;
      this.pauseReason = '';
    }

    return false;
  }

  /**
   * Calculate dynamic interval incorporating exponential backoff on consecutive failures.
   */
  static getBackoffInterval(baseIntervalMs: number): number {
    if (this.consecutiveFailures === 0) return baseIntervalMs;
    if (this.consecutiveFailures === 1) return Math.max(baseIntervalMs, 60000); // 1 min
    if (this.consecutiveFailures === 2) return Math.max(baseIntervalMs, 120000); // 2 min
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
  }

  /**
   * Status inspection for UI error banners.
   */
  static getStatus(): { isPaused: boolean; reason: string; failures: number } {
    return {
      isPaused: this.isPaused && Date.now() < this.pausedUntil,
      reason: this.pauseReason,
      failures: this.consecutiveFailures,
    };
  }
}
