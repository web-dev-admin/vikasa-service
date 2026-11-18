import { useEffect, useRef, useCallback } from 'react';

interface SmartPollingOptions {
  intervalMs?: number;
  enabled?: boolean;
  refreshOnFocus?: boolean;
  throttleMs?: number;
}

/**
 * Smart visibility-aware polling hook to prevent excessive Vercel function invocations.
 *
 * Key guarantees:
 * 1. ZERO background polling when browser tab/window is hidden or minimized.
 * 2. Instant re-fetch the exact millisecond the administrator switches back to the tab.
 * 3. Default active interval of 30s (prevents 4-second hammering while keeping live data fresh).
 * 4. Throttle guard (default 2000ms) to strictly prevent duplicate bursts when both
 *    'visibilitychange' and 'focus' events fire concurrently upon window focus.
 * 5. Full timer and event listener cleanup upon component unmount.
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
  } = options;

  const savedCallback = useRef(callback);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const lastExecutedRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);

  // Keep latest callback reference
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  const executeTick = useCallback((force = false) => {
    if (!isMountedRef.current) return;
    if (typeof document !== 'undefined' && document.hidden) {
      // Tab is in the background: do NOT execute or consume serverless compute
      return;
    }
    const now = Date.now();
    // Throttle duplicate calls within throttleMs (e.g. concurrent visibilitychange + focus events)
    if (!force && now - lastExecutedRef.current < throttleMs) {
      return;
    }
    lastExecutedRef.current = now;
    savedCallback.current();
  }, [throttleMs]);

  const startTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    timerRef.current = setInterval(() => executeTick(false), intervalMs);
  }, [executeTick, intervalMs]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    if (!enabled) {
      stopTimer();
      return;
    }

    // 1. Initial trigger if document is visible
    if (typeof document !== 'undefined' && !document.hidden) {
      executeTick(false);
      startTimer();
    }

    // 2. Tab visibility change handler
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Paused in background — save compute
        stopTimer();
      } else {
        // Resumed in foreground — refresh immediately and restart interval
        if (refreshOnFocus) {
          executeTick(false);
        }
        startTimer();
      }
    };

    // 3. Window focus handler
    const handleFocus = () => {
      if (refreshOnFocus && !document.hidden) {
        executeTick(false);
      }
    };

    // 4. Data mutation listener (triggered after any local POST/PATCH/DELETE)
    const handleDataUpdated = () => {
      executeTick(true);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('vikasa_data_updated', handleDataUpdated);

    return () => {
      isMountedRef.current = false;
      stopTimer();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('vikasa_data_updated', handleDataUpdated);
    };
  }, [enabled, intervalMs, refreshOnFocus, executeTick, startTimer, stopTimer]);

  return {
    refreshNow: (force = true) => executeTick(force),
  };
}
