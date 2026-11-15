/**
 * Safe Phone and WhatsApp Utilities for VIKASA Intermediary Operations
 * Formats Indian phone numbers strictly according to E.164 and wa.me requirements.
 * Ensures zero sensitive information leakage.
 */

/**
 * Sanitizes and normalizes an Indian phone number to exactly 10 digits for local UI inputs.
 * Strips formatting (spaces, hyphens, parentheses, plus signs).
 * Handles pasted strings with "+91", "91", or leading "0" without truncating the actual number.
 * Preserves progressive manual typing (e.g. "9", "98", "986"...).
 */
export function sanitizeIndianMobile10(input: string): string {
  if (!input) return '';
  let digits = input.replace(/\D/g, '');

  // If user pasted a number with international country code +91 or 91 (length > 10)
  if (digits.startsWith('91') && digits.length > 10) {
    const candidate = digits.slice(2);
    if (/^[6-9]/.test(candidate)) {
      digits = candidate;
    }
  }

  // If user pasted a number with trunk prefix 0 (length > 10)
  if (digits.startsWith('0') && digits.length > 10) {
    const candidate = digits.slice(1);
    if (/^[6-9]/.test(candidate)) {
      digits = candidate;
    }
  }

  // Safety fallback for exact 11 or 12 digit pasted strings
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  } else if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  }

  // Cap at 10 digits for standard Indian mobile
  return digits.slice(0, 10);
}

/**
 * Normalizes an Indian phone number to 12-digit format with country code (91XXXXXXXXXX)
 */
export function normalizeIndianPhone(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');

  if (digits.length === 10 && /^[6-9]/.test(digits)) {
    return `91${digits}`;
  }
  if (digits.length === 11 && digits.startsWith('0')) {
    return `91${digits.slice(1)}`;
  }
  if (digits.length === 12 && digits.startsWith('91')) {
    return digits;
  }
  return digits;
}

export function isValidIndianPhone(phone: string): boolean {
  if (!phone) return false;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return /^[6-9]\d{9}$/.test(digits);
  if (digits.length === 11 && digits.startsWith('0')) return /^[6-9]\d{9}$/.test(digits.slice(1));
  if (digits.length === 12 && digits.startsWith('91')) return /^[6-9]\d{9}$/.test(digits.slice(2));
  return false;
}

export function normalizePhoneNumber(phone: string): string {
  const norm = normalizeIndianPhone(phone);
  if (norm.length === 12 && norm.startsWith('91')) {
    return `+91 ${norm.slice(2, 7)} ${norm.slice(7)}`;
  }
  return phone;
}

/**
 * Generates a safe tel: link for phone dialers
 */
export function getTelUrl(phone: string): string {
  const norm = normalizeIndianPhone(phone);
  return norm ? `tel:+${norm}` : '#';
}

/**
 * Generates a safe WhatsApp wa.me link with encoded operational text
 */
export function getWhatsAppUrl(phone: string, message: string): string {
  const norm = normalizeIndianPhone(phone);
  if (!norm) return '#';
  return `https://wa.me/${norm}?text=${encodeURIComponent(message)}`;
}

export interface WhatsAppMessageOptions {
  service?: string;
  serviceName?: string;
  name?: string;
  customerName?: string;
  location?: string;
  district?: string;
  address?: string;
  details?: string;
  problemDescription?: string;
  lang?: 'en' | 'ta';
  targetPhone?: string;
}

/**
 * Standardized VIKASA Home Services WhatsApp URL Generator
 * Generates clean bilingual pre-filled home-service enquiry messages
 * with dynamic service injection and proper URL encoding.
 */
export function getHomeServiceWhatsAppUrl(options: WhatsAppMessageOptions = {}): string {
  const service = options.service || options.serviceName || '';
  const name = options.name || options.customerName || '';
  const location = options.location || [options.address, options.district].filter(Boolean).join(', ') || options.district || '';
  const details = options.details || options.problemDescription || '';
  const lang = options.lang || 'en';
  const targetPhone = options.targetPhone || '9865652420';

  let serviceDisplay = service.trim();
  if (serviceDisplay) {
    const sLower = serviceDisplay.toLowerCase();
    if (!sLower.includes('enquiry') && !serviceDisplay.includes('சேவை')) {
      if (sLower.includes('electric')) serviceDisplay = lang === 'ta' ? 'மின்சார வேலை (Electrical)' : 'Electrical service enquiry';
      else if (sLower.includes('plumb')) serviceDisplay = lang === 'ta' ? 'குழாய் பழுது (Plumbing)' : 'Plumbing service enquiry';
      else if (sLower.includes('carpent') || sLower.includes('wood')) serviceDisplay = lang === 'ta' ? 'மர வேலை (Carpentry)' : 'Carpentry service enquiry';
      else if (sLower.includes('paint')) serviceDisplay = lang === 'ta' ? 'பெயிண்டிங் (Painting)' : 'Painting service enquiry';
      else if (sLower.includes('interior') || sLower.includes('kitchen')) serviceDisplay = lang === 'ta' ? 'உள் அலங்காரம் (Interior Design)' : 'Interior design enquiry';
      else if (sLower.includes('ac') || sLower.includes('appliance')) serviceDisplay = lang === 'ta' ? 'ஏசி & உபகரணங்கள் (AC Service)' : 'AC & Appliance service enquiry';
      else if (sLower.includes('clean')) serviceDisplay = lang === 'ta' ? 'சுத்தம் செய்தல் (Cleaning)' : 'Cleaning service enquiry';
      else serviceDisplay = lang === 'ta' ? `${serviceDisplay} சேவை` : `${serviceDisplay} service enquiry`;
    }
  }

  let text = '';
  if (lang === 'ta') {
    text = `வணக்கம் Vikasa Services!\n\nஎனக்கு வீட்டிற்கான ஒரு சேவை தேவைப்படுகிறது.\n\nபெயர்: ${name || 'வாடிக்கையாளர்'}\nதேவையான சேவை: ${serviceDisplay || 'பொதுவான வீட்டு சேவை'}\nஇடம்: ${location || 'தமிழ்நாடு'}\nசேவை பற்றிய விவரங்கள்: ${details || 'நேரடி அழைப்பில் விவரிக்கப்படும்'}\n\nதயவுசெய்து என்னைத் தொடர்புகொண்டு உதவவும்.\n\nநன்றி!`;
  } else {
    text = `Hello Vikasa Services!\n\nI would like to enquire about a home service.\n\nName: ${name || 'Customer'}\nRequired Service: ${serviceDisplay || 'General Home Service'}\nLocation: ${location || 'Tamil Nadu'}\nService Details: ${details || 'Will explain on call'}\n\nPlease contact me and help me with my home service requirement.\n\nThank you!`;
  }

  return getWhatsAppUrl(targetPhone, text);
}

/**
 * Pre-formatted operational message for customer verification
 * NOTE: Contains ONLY safe public metadata (request number, service).
 * NEVER includes worker phone numbers or private internal notes.
 */
export function generateCustomerWhatsAppMessage(
  customerName: string,
  requestNumber: number,
  serviceName: string
): string {
  const firstName = customerName ? customerName.split(' ')[0] : 'Customer';
  return `Vanakkam ${firstName}, this is VIKASA service coordination regarding your request #${requestNumber} for ${serviceName}. Our operator is ready to verify your requirement and dispatch a nearby professional.`;
}

/**
 * Pre-formatted operational message for technician dispatch
 * NOTE: Contains ONLY trade, approximate area, and distance.
 * NEVER exposes customer phone number or private customer details!
 */
export function generateWorkerDispatchWhatsAppMessage(
  workerName: string,
  serviceName: string,
  generalArea: string,
  distanceKm: number
): string {
  const firstName = workerName ? workerName.split(' ')[0] : 'Professional';
  return `Vanakkam ${firstName}, VIKASA has a service job nearby in ${generalArea} (~${distanceKm} km) for ${serviceName}. Are you available right now?`;
}

/**
 * Generates an exact Google Maps navigation URL
 * Uses precise GPS coordinates if available, otherwise formats a verified address search query.
 */
export function getGoogleMapsUrl(
  latitude?: number,
  longitude?: number,
  address?: string,
  district?: string
): string {
  if (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    !isNaN(latitude) &&
    !isNaN(longitude) &&
    latitude !== 0 &&
    longitude !== 0
  ) {
    return `https://maps.google.com/?q=${latitude.toFixed(6)},${longitude.toFixed(6)}`;
  }
  const parts = [address, district, 'Tamil Nadu'].filter(Boolean);
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(parts.join(', ') || 'Tamil Nadu, India')}`;
}

export interface ShareableJobLocationPayload {
  requestNumber: number | string;
  customerName: string;
  customerPhone?: string;
  serviceName: string;
  district?: string;
  formattedAddress: string;
  latitude?: number;
  longitude?: number;
  preferredDate?: string;
  preferredTimeSlot?: string;
  description?: string;
  customServiceNote?: string;
  technicianName?: string;
}

/**
 * Generates a complete, professional, shareable WhatsApp dispatch message
 * with the exact location and direct Google Maps GPS navigation link.
 */
export function generateShareableJobLocationWhatsAppMessage(
  payload: ShareableJobLocationPayload
): string {
  const mapsUrl = getGoogleMapsUrl(
    payload.latitude,
    payload.longitude,
    payload.formattedAddress,
    payload.district
  );

  const cleanPhone = payload.customerPhone
    ? payload.customerPhone.replace(/\D/g, '').slice(-10)
    : '';

  const lines: string[] = [
    `🛠️ *VIKASA SERVICES – JOB DISPATCH ORDER*`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `📋 *Booking ID:* #${payload.requestNumber}`,
    `🔧 *Required Service:* ${payload.serviceName}`,
    payload.technicianName ? `👷 *Assigned Technician:* ${payload.technicianName}` : '',
    `👤 *Customer Name:* ${payload.customerName}`,
    cleanPhone ? `📞 *Customer Phone:* +91 ${cleanPhone}` : '',
    `📅 *Scheduled Date:* ${payload.preferredDate || 'Today / Immediate'}`,
    payload.preferredTimeSlot ? `⏰ *Time Slot:* ${payload.preferredTimeSlot}` : '',
    ``,
    `📍 *EXACT LOCATION / ADDRESS:*`,
    `${payload.formattedAddress || payload.district || 'Tamil Nadu'}`,
    ``,
    `🗺️ *GOOGLE MAPS NAVIGATION LINK:*`,
    `${mapsUrl}`,
  ];

  if (payload.customServiceNote) {
    lines.push(
      ``,
      `⭐ *Custom Requirements:*`,
      `"${payload.customServiceNote}"`
    );
  }

  if (payload.description) {
    lines.push(
      ``,
      `📝 *Problem Scope / Notes:*`,
      `"${payload.description}"`
    );
  }

  lines.push(
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `*VIKASA Services & Interiors*`,
    `_Connecting Verified Professionals with Homes_`
  );

  return lines.filter((l) => l !== '').join('\n');
}

/**
 * Generates a WhatsApp share URL.
 * If phone is provided, opens direct chat with that number.
 * If phone is omitted, opens WhatsApp's universal share dialog allowing the user to pick any chat/group!
 */
export function getUniversalWhatsAppShareUrl(message: string, phone?: string): string {
  if (phone) {
    const norm = normalizeIndianPhone(phone);
    if (norm) {
      return `https://wa.me/${norm}?text=${encodeURIComponent(message)}`;
    }
  }
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
}

