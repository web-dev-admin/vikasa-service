import { LeadSource } from '@/types';

export interface AttributionData {
  source: LeadSource;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  landing_page?: string;
  referrer?: string;
}

const STORAGE_KEY = 'vikasa_lead_attribution';

export function captureAttribution(): AttributionData {
  if (typeof window === 'undefined') {
    return { source: 'DIRECT' };
  }

  // If already stored from first landing, return it
  try {
    const existing = sessionStorage.getItem(STORAGE_KEY);
    if (existing) {
      return JSON.parse(existing);
    }
  } catch {
    // sessionStorage disabled or unavailable
  }

  const searchParams = new URLSearchParams(window.location.search);
  const utm_source = searchParams.get('utm_source') || undefined;
  const utm_medium = searchParams.get('utm_medium') || undefined;
  const utm_campaign = searchParams.get('utm_campaign') || undefined;
  const utm_content = searchParams.get('utm_content') || undefined;
  const utm_term = searchParams.get('utm_term') || undefined;
  const referrer = document.referrer || undefined;
  const landing_page = window.location.pathname;

  let source: LeadSource = 'DIRECT';

  if (utm_source?.toLowerCase().includes('facebook') || 
      utm_source?.toLowerCase().includes('instagram') || 
      utm_source?.toLowerCase().includes('meta') ||
      referrer?.includes('facebook.com') ||
      referrer?.includes('instagram.com')) {
    source = 'META';
  } else if (utm_source) {
    source = 'OTHER';
  } else if (referrer && !referrer.includes(window.location.hostname)) {
    source = referrer.includes('google') ? 'ORGANIC' : 'REFERRAL';
  }

  const attribution: AttributionData = {
    source,
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    utm_term,
    landing_page,
    referrer,
  };

  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
  } catch {
    // ignore
  }

  return attribution;
}

/**
 * Dispatches a standard Meta Pixel conversion event
 */
export function trackMetaLeadConversion(requestId: string, serviceName: string) {
  if (typeof window === 'undefined') return;

  // Window fbq trigger if script injected
  const win = window as unknown as { fbq?: (...args: unknown[]) => void };
  if (typeof win.fbq === 'function') {
    win.fbq('track', 'Lead', {
      content_name: serviceName,
      content_category: 'Service Request',
      request_id: requestId,
      currency: 'INR',
    });
  }

  // Console trace for operator visibility
  console.log(`[Attribution & Meta Tracking] Event 'Lead' triggered for request #${requestId} (${serviceName})`);
}
