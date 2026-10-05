export const VIKASA_CONFIG = {
  name: 'VIKASA',
  tagline: 'Interior & Home Services',
  subtitle: 'Salem & Tamil Nadu',
  phone: '9865652420',
  phoneDisplay: '+91 98656 52420',
  whatsappNumber: '919865652420',
  whatsappUrl: 'https://wa.me/919865652420?text=Hello%20VIKASA%2C%20I%20would%20like%20to%20book%20a%20service%20or%20technician.',
  telUrl: 'tel:+919865652420',
  logoPath: '/logo/vikasa_interior_logo.png',
  serviceAreas: [
    'Fairlands',
    'Suramangalam',
    'Meyyanur',
    'Hasthampatti',
    'Ammapet',
    'Alagapuram',
    'Shevapet',
    'Gugai',
    'Gorimedu',
    'Kandhampatti',
  ],
};

// Predefined standardized Tamil Nadu districts to prevent manual typing variations
export const TAMIL_NADU_DISTRICTS = [
  'Salem',
  'Erode',
  'Coimbatore',
  'Namakkal',
  'Dharmapuri',
  'Tiruppur',
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
] as const;

export type TamilNaduDistrict = (typeof TAMIL_NADU_DISTRICTS)[number];

// Standardized Core Services as requested:
// Plumbing, Cleaning, Interior Design, Electrical, AC Service, Painting, Carpentry, Other
export const STANDARDIZED_SERVICES = [
  { id: 'srv-plumbing', name: 'Plumbing', icon: 'Wrench', slug: 'plumbing', active: true },
  { id: 'srv-cleaning', name: 'Cleaning', icon: 'Sparkles', slug: 'cleaning', active: true },
  { id: 'srv-interior', name: 'Interior Design', icon: 'Sparkles', slug: 'interior-design', active: true },
  { id: 'srv-electrical', name: 'Electrical', icon: 'Zap', slug: 'electrical', active: true },
  { id: 'srv-ac', name: 'AC Service', icon: 'Tv', slug: 'ac-service', active: true },
  { id: 'srv-painting', name: 'Painting', icon: 'Sparkles', slug: 'painting', active: true },
  { id: 'srv-carpentry', name: 'Carpentry', icon: 'Hammer', slug: 'carpentry', active: true },
  { id: 'srv-other', name: 'Other', icon: 'Wrench', slug: 'other', active: true },
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
