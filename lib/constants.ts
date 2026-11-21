export const VIKASA_CONFIG = {
  name: 'Vikasa Interiors',
  shortName: 'VIKASA',
  tagline: 'Interior Design & Plywood Craftsmanship',
  subtitle: 'Erode & Surrounding Areas, Tamil Nadu',
  city: 'Erode',
  state: 'Tamil Nadu',
  postalCode: '638001',
  country: 'IN',
  address: {
    street: 'Perundurai Road',
    city: 'Erode',
    state: 'Tamil Nadu',
    postalCode: '638001',
    country: 'IN',
  },
  coordinates: {
    lat: 11.3410,
    lon: 77.7172,
  },
  phone: '9865652420',
  phoneDisplay: '+91 98656 52420',
  whatsappNumber: '919865652420',
  whatsappUrl: 'https://wa.me/919865652420?text=Hello%20Vikasa%20Services!%0A%0AI%20would%20like%20to%20enquire%20about%20a%20home%20service.%0A%0AName:%20%0ARequired%20Service:%20%0ALocation:%20%0AService%20Details:%20%0A%0APlease%20contact%20me%20and%20help%20me%20with%20my%20service%20requirement.%0A%0AThank%20you!',
  telUrl: 'tel:+919865652420',
  logoPath: '/logo/vikasa_interior_logo.png',
  domain: 'vikasaservices.in',
  websiteUrl: 'https://vikasaservices.in',
  serviceAreas: [
    'Erode City',
    'Perundurai',
    'Bhavani',
    'Gobichettipalayam',
    'Chithode',
    'Modakkurichi',
    'Thindal',
    'Veerappanchatram',
    'Surampatti',
    'Solar',
    'Komarapalayam',
    'Outstation Projects',
  ],
};

// Official Meta (Facebook) Pixel ID for advertising & conversion analytics
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || '1273210955258944';

// Predefined standardized Tamil Nadu districts to prevent manual typing variations
export const TAMIL_NADU_DISTRICTS = [
  'Erode',
  'Salem',
  'Coimbatore',
  'Tiruppur',
  'Namakkal',
  'Dharmapuri',
  'Karur',
  'Krishnagiri',
  'Dindigul',
  'Madurai',
  'Tiruchirappalli (Trichy)',
  'Chennai',
  'Chengalpattu',
  'Kanchipuram',
  'Vellore',
  'Tiruvannamalai',
  'Cuddalore',
  'Villupuram',
  'Kallakurichi',
  'Thanjavur',
  'Nagapattinam',
  'Tiruvarur',
  'Pudukkottai',
  'Sivaganga',
  'Ramanathapuram',
  'Virudhunagar',
  'Theni',
  'Tenkasi',
  'Tirunelveli',
  'Thoothukudi',
  'Kanniyakumari',
  'Nilgiris',
  'Perambalur',
  'Ariyalur',
  'Ranipet',
  'Tirupathur',
  'Mayiladuthurai',
  'Tiruvallur',
] as const;

export type TamilNaduDistrict = (typeof TAMIL_NADU_DISTRICTS)[number];

// Approximate centroid coordinates for all 38 Tamil Nadu districts for accurate fallback pinning
export const TAMIL_NADU_DISTRICT_COORDINATES: Record<string, { lat: number; lon: number }> = {
  'Erode': { lat: 11.3410, lon: 77.7172 },
  'Salem': { lat: 11.6643, lon: 78.1460 },
  'Coimbatore': { lat: 11.0168, lon: 76.9558 },
  'Tiruppur': { lat: 11.1085, lon: 77.3411 },
  'Namakkal': { lat: 11.2189, lon: 78.1674 },
  'Dharmapuri': { lat: 12.1211, lon: 78.1582 },
  'Karur': { lat: 10.9601, lon: 78.0766 },
  'Krishnagiri': { lat: 12.5186, lon: 78.2137 },
  'Dindigul': { lat: 10.3673, lon: 77.9803 },
  'Madurai': { lat: 9.9252, lon: 78.1198 },
  'Tiruchirappalli (Trichy)': { lat: 10.7905, lon: 78.7047 },
  'Chennai': { lat: 13.0827, lon: 80.2707 },
  'Chengalpattu': { lat: 12.6841, lon: 79.9836 },
  'Kanchipuram': { lat: 12.8342, lon: 79.7036 },
  'Vellore': { lat: 12.9165, lon: 79.1325 },
  'Tiruvannamalai': { lat: 12.2253, lon: 79.0747 },
  'Cuddalore': { lat: 11.7480, lon: 79.7714 },
  'Villupuram': { lat: 11.9401, lon: 79.4861 },
  'Kallakurichi': { lat: 11.7384, lon: 78.9639 },
  'Thanjavur': { lat: 10.7870, lon: 79.1378 },
  'Nagapattinam': { lat: 10.7672, lon: 79.8449 },
  'Tiruvarur': { lat: 10.7661, lon: 79.6344 },
  'Pudukkottai': { lat: 10.3797, lon: 78.8208 },
  'Sivaganga': { lat: 9.8433, lon: 78.4809 },
  'Ramanathapuram': { lat: 9.3639, lon: 78.8395 },
  'Virudhunagar': { lat: 9.5680, lon: 77.9624 },
  'Theni': { lat: 10.0104, lon: 77.4768 },
  'Tenkasi': { lat: 8.9594, lon: 77.3150 },
  'Tirunelveli': { lat: 8.7139, lon: 77.7567 },
  'Thoothukudi': { lat: 8.7642, lon: 78.1348 },
  'Kanniyakumari': { lat: 8.0883, lon: 77.5385 },
  'Nilgiris': { lat: 11.4102, lon: 76.6950 },
  'Perambalur': { lat: 11.2342, lon: 78.8821 },
  'Ariyalur': { lat: 11.1401, lon: 79.0786 },
  'Ranipet': { lat: 12.9274, lon: 79.3330 },
  'Tirupathur': { lat: 12.4925, lon: 78.5678 },
  'Mayiladuthurai': { lat: 11.1075, lon: 79.6524 },
  'Tiruvallur': { lat: 13.1432, lon: 79.9082 },
};

export function getDistrictCoordinates(districtName?: string): { lat: number; lon: number } {
  if (!districtName) return { lat: 11.3410, lon: 77.7172 };
  const clean = districtName.trim();
  const direct = TAMIL_NADU_DISTRICT_COORDINATES[clean];
  if (direct) return direct;
  
  const lower = clean.toLowerCase();
  for (const [d, coords] of Object.entries(TAMIL_NADU_DISTRICT_COORDINATES)) {
    const dLower = d.toLowerCase();
    const dClean = dLower.replace(/\s*\(.*\)/, '').trim();
    if (
      dLower === lower ||
      dLower.includes(lower) ||
      lower.includes(dClean) ||
      (dClean.length > 3 && dClean.includes(lower))
    ) {
      return coords;
    }
  }
  return { lat: 11.3410, lon: 77.7172 };
}

// Standardized Core Services as requested:
// Plumbing, Cleaning, Interior Design, Electrical, AC Service, Painting, Carpentry, Other
export const STANDARDIZED_SERVICES = [
  { id: 'srv-interior', name: 'Interior Design', icon: 'Sparkles', slug: 'interior-design', active: true },
  { id: 'srv-carpentry', name: 'Carpentry & Plywood Work', icon: 'Hammer', slug: 'carpentry', active: true },
  { id: 'srv-painting', name: 'Painting & Wall Finish', icon: 'Sparkles', slug: 'painting', active: true },
  { id: 'srv-electrical', name: 'Electrical & Lighting', icon: 'Zap', slug: 'electrical', active: true },
  { id: 'srv-plumbing', name: 'Plumbing', icon: 'Wrench', slug: 'plumbing', active: true },
  { id: 'srv-ac', name: 'AC & Appliances', icon: 'Tv', slug: 'ac-service', active: true },
  { id: 'srv-cleaning', name: 'Cleaning', icon: 'Sparkles', slug: 'cleaning', active: true },
  { id: 'srv-other', name: 'Other Services', icon: 'Wrench', slug: 'other', active: true },
];

// Simplified Human-Friendly Request Statuses
// Avoids jargon like "Dispatched", "Pipeline", "SLA", "Escalated", "Priority Level"
export const REQUEST_STATUS_LABELS: Record<string, string> = {
  NEW: 'New Request',
  CUSTOMER_TO_CALL: 'New Request',
  CUSTOMER_CONFIRMED: 'Confirmed',
  MATCHING: 'Confirmed',
  WORKER_CONTACTING: 'Confirmed',
  WORKER_ACCEPTED: 'Confirmed',
  ASSIGNED: 'Technician Assigned',
  IN_PROGRESS: 'Technician Assigned',
  COMPLETED: 'Work Completed',
  CUSTOMER_CANCELLED: 'Cancelled',
  CANCELLED: 'Cancelled',
  NO_WORKER_AVAILABLE: 'Cancelled',
};

// Simple badges
export function getStatusBadgeInfo(status: string): { label: string; className: string } {
  switch (status) {
    case 'NEW':
    case 'CUSTOMER_TO_CALL':
      return {
        label: 'New Request',
        className: 'bg-blue-50 text-blue-700 border-blue-200',
      };
    case 'CUSTOMER_CONFIRMED':
    case 'MATCHING':
    case 'WORKER_CONTACTING':
    case 'WORKER_ACCEPTED':
      return {
        label: 'Confirmed',
        className: 'bg-amber-50 text-amber-700 border-amber-200',
      };
    case 'ASSIGNED':
    case 'IN_PROGRESS':
      return {
        label: 'Technician Assigned',
        className: 'bg-emerald-600 text-white border-emerald-600',
      };
    case 'COMPLETED':
      return {
        label: 'Work Completed',
        className: 'bg-slate-100 text-slate-700 border-slate-300',
      };
    case 'CANCELLED':
    case 'CUSTOMER_CANCELLED':
    case 'NO_WORKER_AVAILABLE':
      return {
        label: 'Cancelled',
        className: 'bg-red-50 text-red-700 border-red-200',
      };
    default:
      return {
        label: status,
        className: 'bg-slate-50 text-slate-700 border-slate-200',
      };
  }
}
