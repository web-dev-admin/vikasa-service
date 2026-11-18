import { useEffect, useRef, useCallback } from 'react';
import { CircuitBreaker } from '@/lib/utils/circuitBreaker';

interface SmartPollingOptions {
  intervalMs?: number;
  enabled?: boolean;
  refreshOnFocus?: boolean;
  throttleMs?: number;
  endpoint?: string;
}

/**
 * Smart visibility-aware polling hook with circuit breaker and exponential backoff.
 *
 * Key guarantees:
 * 1. ZERO background polling when browser tab/window is hidden or minimized.
 * 2. Instant re-fetch the exact millisecond the administrator switches back to the tab.
 * 3. Default active interval of 30s.
 * 4. Circuit Breaker protection: If server returns HTTP 503 (Project Paused), 429, or 401,
 *    polling is HALTED immediately to prevent runaway CDN request loops.
 * 5. Network Offline Awareness: Halts all requests when browser is offline (`!navigator.onLine`)
 *    and resumes automatically when connection returns.
 * 6. Isolated Endpoint Failure Isolation: One failing API does not disable or slow down
 *    unrelated healthy APIs.
 * 7. Active Timer Teardown: Clears timers on circuit break and auto-resumes after cooldown.
 * 8. Throttle guard (default 2000ms) to strictly prevent duplicate bursts when both
 *    'visibilitychange' and 'focus' events fire concurrently.
 * 9. Full timer and event listener cleanup upon component unmount.
 */
export function useSmartPolling(
  callback: () => Promise<void> | void,
  options: SmartPollingOptions = {}
) {
  const {
    intervalMs = 30000,
    enabled = true,
    refreshOnFocus = true,
    throttleMs = 2000,
    endpoint,
  } = options;

  const savedCallback = useRef(callback);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastExecutedRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);

  // Keep latest callback reference
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  const executeTick = useCallback(async (force = false) => {
    if (!isMountedRef.current) return;

    // 1. Check tab visibility (ZERO compute in background)
    if (typeof document !== 'undefined' && document.hidden) {
      return;
    }

    // 2. Check network connectivity (only halt if browser explicitly reports offline)
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return;
    }

    // 3. Check Circuit Breaker (halts if 503 paused, 429 rate limited, etc.)
    if (CircuitBreaker.shouldHalt(endpoint)) {
      return;
    }

    // 4. Throttle duplicate calls: enforce strict minimum gap (1000ms even if forced, else throttleMs)
    const now = Date.now();
    const effectiveThrottle = force ? 1000 : throttleMs;
    if (now - lastExecutedRef.current < effectiveThrottle) {
      return;
    }
    lastExecutedRef.current = now;

    try {
      await savedCallback.current();
    } catch (err) {
      CircuitBreaker.reportError(err, endpoint);
    }
  }, [throttleMs, endpoint]);

  const startTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    const currentInterval = CircuitBreaker.getBackoffInterval(intervalMs, endpoint);
    timerRef.current = setInterval(() => executeTick(false), currentInterval);
  }, [executeTick, intervalMs, endpoint]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    if (!enabled) {
      stopTimer();
      return;
    }

    // 1. Initial trigger if document is visible and circuit is healthy
    if (typeof document !== 'undefined' && !document.hidden && !CircuitBreaker.shouldHalt(endpoint)) {
      executeTick(false);
      startTimer();
    }

    // 2. Tab visibility change handler
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopTimer();
      } else {
        if (refreshOnFocus && !CircuitBreaker.shouldHalt(endpoint)) {
          executeTick(false);
        }
        startTimer();
      }
    };

    // 3. Window focus handler
    const handleFocus = () => {
      if (refreshOnFocus && !document.hidden && !CircuitBreaker.shouldHalt(endpoint)) {
        executeTick(false);
      }
    };

    // 4. Network online / offline recovery handlers
    const handleOnline = () => {
      executeTick(true);
      startTimer();
    };

    const handleOffline = () => {
      stopTimer();
    };

    // 5. Circuit breaker resume listener
    const handleResumePolling = () => {
      CircuitBreaker.resume();
      executeTick(true);
      startTimer();
    };

    // 6. Circuit breaker tripped listener (stops timer immediately and schedules auto-resume)
    const handleCircuitBroken = (e: Event) => {
      stopTimer();
      const customEvent = e as CustomEvent<{ pausedUntil?: number }>;
      const pausedUntil = customEvent.detail?.pausedUntil || Date.now() + 5 * 60 * 1000;
      const delay = Math.max(1000, pausedUntil - Date.now() + 1000);

      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current && typeof document !== 'undefined' && !document.hidden && !CircuitBreaker.shouldHalt(endpoint)) {
          executeTick(true);
          startTimer();
        }
      }, delay);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('vikasa_resume_polling', handleResumePolling);
    window.addEventListener('vikasa_circuit_broken', handleCircuitBroken);

    return () => {
      isMountedRef.current = false;
      stopTimer();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('vikasa_resume_polling', handleResumePolling);
      window.removeEventListener('vikasa_circuit_broken', handleCircuitBroken);
    };
  }, [enabled, intervalMs, refreshOnFocus, endpoint, executeTick, startTimer, stopTimer]);

  return {
    refreshNow: (force = true) => {
      CircuitBreaker.resume();
      return executeTick(force);
    },
  };
}
