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
