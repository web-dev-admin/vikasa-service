'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: (...args: unknown[]) => void;
  }
}

/**
 * Safely dispatches the Meta Pixel CompleteRegistration conversion event.
 * Follows strict compliance rules:
 * - Fires only after successful server persistence of technician registration
 * - Zero extra personal data passed in payload
 * - Safe type guard so site never throws or logs errors if an ad blocker blocks fbq
 */
export function trackMetaCompleteRegistration() {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    try {
      window.fbq('track', 'CompleteRegistration');
    } catch {
      // Silently handle ad-blocker suppression without console warnings or breakage
    }
  }
}

/**
 * Safely dispatches the Meta Pixel Lead conversion event.
 * Follows strict compliance rules:
 * - Fires only after successful server validation and persistence of customer lead/inquiry
 * - Zero extra personal data passed manually in payload
 * - Safe type guard so site never throws or logs errors if an ad blocker blocks fbq
 * - Deduplication via referenceId (e.g. tracking token or request number) to prevent double firing
 */
export function trackMetaLead(referenceId?: string | number) {
  if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
    if (referenceId) {
      try {
        const key = `meta_lead_tracked_${referenceId}`;
        if (sessionStorage.getItem(key)) {
          return;
        }
        sessionStorage.setItem(key, 'true');
      } catch {
        // Handle private browsing or disabled storage safely
      }
    }
    try {
      window.fbq('track', 'Lead');
    } catch {
      // Silently handle ad-blocker suppression without console warnings or breakage
    }
  }
}

/**
 * Client route transition tracker for Next.js App Router.
 * The initial PageView is fired by the base code in <head>.
 * This hook tracks subsequent client-side SPA navigations.
 */
export function MetaPixelRouteTracker() {
  const pathname = usePathname();
  const initialLoadRef = useRef(true);

  useEffect(() => {
    // Skip the very first run because base code in <head> already fired initial PageView
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }

    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      try {
        window.fbq('track', 'PageView');
      } catch {
        // Silently handle ad-blocker suppression
      }
    }
  }, [pathname]);

  return null;
}
