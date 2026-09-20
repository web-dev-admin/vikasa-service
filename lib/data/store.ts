import {
  Worker,
  Customer,
  ServiceRequest,
  WorkerContactAttempt,
  Assignment,
  AuditLog,
  RequestStatus,
  ContactResult,
  PublicTrackingData,
} from '@/types';
import { INITIAL_CATEGORIES, INITIAL_SERVICES } from '@/lib/taxonomy/catalog';

// Base coordinates: Salem, Tamil Nadu, India (11.6643° N, 78.1460° E)
export const SALEM_CENTER = {
  lat: 11.6643,
  lon: 78.146,
  name: 'Salem City Center, Tamil Nadu',
};

// Seed 12 Realistic Service Workers in Salem & Nearby
export const SEED_WORKERS: Worker[] = [
  {
    id: 'w-kumar',
    full_name: 'Kumarasamy R.',
    phone: '+91 98427 11029',
    email: 'kumar.plumbing@example.com',
    experience_years: 7,
    skills: ['Concealed Leakage Repair', 'PVC Piping', 'Bathroom Fittings', 'Flush Tank Fixes'],
    bio: 'Experienced master plumber specialized in high-pressure bathroom and concealed pipe repairs.',
    verification_status: 'verified',
    verified_at: '2026-01-10T10:00:00Z',
    verified_by: 'admin-1',
    availability: 'available',
    base_location_name: 'Suramangalam, Salem',
    latitude: 11.6710,
    longitude: 78.1250, // ~1.2 km from Fairlands
    service_radius_km: 15,
    service_area_names: ['Suramangalam', 'Fairlands', 'Meyyanur', 'Salem Junction'],
    service_ids: ['srv-pipe-leakage', 'srv-tap-repair', 'srv-toilet-repair', 'srv-water-tank'],
    created_at: '2026-01-05T08:00:00Z',
    updated_at: '2026-01-05T08:00:00Z',
  },
  {
    id: 'w-mani',
    full_name: 'Manikandan S.',
    phone: '+91 97890 44211',
    email: 'mani.plumbing@example.com',
    experience_years: 5,
    skills: ['Angle Cock Repair', 'Drain Blockage Clear', 'Overhead Tank Connection'],
    bio: 'Quick response emergency plumber with all rotary drain clear tools.',
    verification_status: 'verified',
    verified_at: '2026-01-12T14:30:00Z',
    verified_by: 'admin-1',
    availability: 'available',
    base_location_name: 'Fairlands, Salem',
    latitude: 11.6685,
    longitude: 78.1410, // ~2.1 km
    service_radius_km: 12,
    service_area_names: ['Fairlands', 'Hasthampatti', 'Alagapuram', 'Meyyanur'],
    service_ids: ['srv-pipe-leakage', 'srv-tap-repair', 'srv-water-tank'],
    created_at: '2026-01-08T09:00:00Z',
    updated_at: '2026-01-08T09:00:00Z',
  },
  {
    id: 'w-ravi',
    full_name: 'Ravi Chandran',
    phone: '+91 94432 88102',
    email: 'ravi.plumber.salem@example.com',
    experience_years: 11,
    skills: ['Commercial Plumbing', 'Drainage Line Laying', 'Motor Pump Repair'],
    bio: 'Senior plumbing technician with over a decade of residential and commercial experience.',
    verification_status: 'verified',
    verified_at: '2026-01-02T11:00:00Z',
    verified_by: 'admin-1',
    availability: 'available',
    base_location_name: 'Hasthampatti, Salem',
    latitude: 11.6780,
    longitude: 78.1610, // ~3.6 km
    service_radius_km: 20,
    service_area_names: ['Hasthampatti', 'Gorimedu', 'Kannankurichi', 'Yercaud Foot'],
    service_ids: ['srv-pipe-leakage', 'srv-water-tank', 'srv-toilet-repair'],
    created_at: '2026-01-01T10:00:00Z',
    updated_at: '2026-01-01T10:00:00Z',
  },
  {
    id: 'w-selvam-elec',
    full_name: 'Selvamurugan K.',
    phone: '+91 98941 55670',
    email: 'selvam.electrician@example.com',
    experience_years: 8,
    skills: ['MCB Tripping', '3-Phase Wiring', 'Inverter Installation', 'LED Panel Setup'],
    bio: 'Licensed B-grade electrical contractor. Fast fault-finding specialist.',
    verification_status: 'verified',
    verified_at: '2026-01-03T16:00:00Z',
    verified_by: 'admin-1',
    availability: 'available',
    base_location_name: 'Meyyanur, Salem',
    latitude: 11.6620,
    longitude: 78.1320,
    service_radius_km: 18,
    service_area_names: ['Meyyanur', 'New Bus Stand', 'Kandhampatti', 'Fairlands'],
    service_ids: ['srv-switchboard-repair', 'srv-fan-installation', 'srv-wiring-lighting'],
    created_at: '2026-01-02T09:30:00Z',
    updated_at: '2026-01-02T09:30:00Z',
  },
  {
    id: 'w-prakash-elec',
    full_name: 'Prakash Velu',
    phone: '+91 96291 33455',
    experience_years: 4,
    skills: ['Ceiling Fan Repair', 'Switchboard Assembly', 'Geyser Electrical Connection'],
    bio: 'Prompt and detail-oriented electrician for quick domestic troubleshooting.',
    verification_status: 'verified',
    verified_at: '2026-01-15T11:00:00Z',
    verified_by: 'admin-1',
    availability: 'available',
    base_location_name: 'Ammapet, Salem',
    latitude: 11.6540,
    longitude: 78.1750,
    service_radius_km: 15,
    service_area_names: ['Ammapet', 'Ponnammapet', 'Udayapatty', 'Pattai'],
    service_ids: ['srv-fan-installation', 'srv-switchboard-repair'],
    created_at: '2026-01-10T12:00:00Z',
    updated_at: '2026-01-10T12:00:00Z',
  },
  {
    id: 'w-murugan-carp',
    full_name: 'Murugesan A.',
    phone: '+91 94862 77019',
    experience_years: 12,
    skills: ['Teakwood Door Fixing', 'Godrej Lock Fitting', 'Modular Kitchen Hinge Repair'],
    bio: 'Master carpenter with 12 years experience in door alignments, sliding wardrobes, and lock sets.',
    verification_status: 'verified',
    verified_at: '2026-01-04T10:00:00Z',
    verified_by: 'admin-1',
    availability: 'available',
    base_location_name: 'Shevapet, Salem',
    latitude: 11.6510,
    longitude: 78.1390,
    service_radius_km: 20,
    service_area_names: ['Shevapet', 'Gugai', 'Bazaar', 'Dadagapatty'],
    service_ids: ['srv-door-lock-repair', 'srv-furniture-repair', 'srv-woodwork-general'],
    created_at: '2026-01-02T08:00:00Z',
    updated_at: '2026-01-02T08:00:00Z',
  },
  {
    id: 'w-vijay-ac',
    full_name: 'Vijay Anand',
    phone: '+91 97500 22341',
    experience_years: 6,
    skills: ['Inverter AC Servicing', 'Gas Charging R32/R410A', 'Compressor Replacement'],
    bio: 'Certified HVAC technician equipped with pressure gauges and jet wash pump.',
    verification_status: 'verified',
    verified_at: '2026-01-06T15:00:00Z',
    verified_by: 'admin-1',
    availability: 'available',
    base_location_name: 'Alagapuram, Salem',
    latitude: 11.6810,
    longitude: 78.1430,
    service_radius_km: 25,
    service_area_names: ['Alagapuram', 'Fairlands', 'Hasthampatti', 'Reddiyur'],
    service_ids: ['srv-ac-service', 'srv-washing-machine'],
    created_at: '2026-01-04T11:00:00Z',
    updated_at: '2026-01-04T11:00:00Z',
  },
  {
    id: 'w-dinesh-pend',
    full_name: 'Dinesh Kumar T.',
    phone: '+91 98433 99881',
    experience_years: 3,
    skills: ['Plumbing', 'Bathroom Fitting'],
    bio: 'Newly registered technician awaiting credential check.',
    verification_status: 'pending_verification', // Testing filter rule
    availability: 'offline',
    base_location_name: 'Omalur, Salem District',
    latitude: 11.7450,
    longitude: 78.0420,
    service_radius_km: 15,
    service_area_names: ['Omalur', 'Kamalapuram'],
    service_ids: ['srv-tap-repair', 'srv-pipe-leakage'],
    created_at: '2026-02-01T10:00:00Z',
    updated_at: '2026-02-01T10:00:00Z',
  },
  {
    id: 'w-karthik-busy',
    full_name: 'Karthikeyan B.',
    phone: '+91 99441 66520',
    experience_years: 9,
    skills: ['Sanitary Ware Installation', 'Concealed Piping'],
    bio: 'Senior plumber currently assigned on another site.',
    verification_status: 'verified',
    verified_at: '2026-01-05T10:00:00Z',
    verified_by: 'admin-1',
    availability: 'busy', // Testing availability rule
    base_location_name: 'Gugai, Salem',
    latitude: 11.6430,
    longitude: 78.1520,
    service_radius_km: 15,
    service_area_names: ['Gugai', 'Line Medu', 'Ammapet'],
    service_ids: ['srv-pipe-leakage', 'srv-tap-repair'],
    created_at: '2026-01-03T11:00:00Z',
    updated_at: '2026-01-03T11:00:00Z',
  },
];

// Seed Customers
export const SEED_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    full_name: 'Raj Kumar',
    phone: '+91 98401 22334',
    email: 'rajkumar.salem@gmail.com',
    created_at: '2026-02-18T09:00:00Z',
  },
  {
    id: 'cust-2',
    full_name: 'Meena Sundaram',
    phone: '+91 97892 11456',
    email: 'meena.s@yahoo.com',
    created_at: '2026-02-18T09:30:00Z',
  },
  {
    id: 'cust-3',
    full_name: 'Venkatesh S.',
    phone: '+91 94433 77881',
    created_at: '2026-02-18T10:00:00Z',
  },
  {
    id: 'cust-4',
    full_name: 'Dr. Anitha Mohan',
    phone: '+91 98421 99012',
    email: 'anitha.clinic@gmail.com',
    created_at: '2026-02-18T10:30:00Z',
  },
  {
    id: 'cust-5',
    full_name: 'Kavitha Radhakrishnan',
    phone: '+91 96290 88712',
    created_at: '2026-02-18T11:00:00Z',
  },
];

// Seed 20+ Realistic Service Requests across all states
export const SEED_REQUESTS: ServiceRequest[] = [
  {
    id: 'req-1042',
    request_number: 1042,
    customer_id: 'cust-1',
    customer_name: 'Raj Kumar',
    customer_phone: '+91 98401 22334',
    customer_email: 'rajkumar.salem@gmail.com',
    category_id: 'cat-plumbing',
    category_name: 'Plumbing',
    service_id: 'srv-pipe-leakage',
    service_name: 'Pipe Leakage & Drainage Repair',
    description: 'Heavy water dripping continuously from concealed bathroom pipeline above false ceiling. Urgent assistance needed.',
    formatted_address: 'Plot 42, 5th Cross, Brindavan Road, Fairlands, Salem - 636016',
    latitude: 11.6720,
    longitude: 78.1380,
    location_accuracy: 12.5,
    urgency: 'high',
    preferred_date: '2026-02-18',
    preferred_time_slot: '5:00 PM - 7:00 PM',
    status: 'NEW',
    customer_confirmed: false,
    source: 'META',
    utm_source: 'facebook',
    utm_medium: 'paid_cpc',
    utm_campaign: 'salem_emergency_plumbing_feb',
    utm_content: 'ad_leakage_video',
    landing_page: '/request?utm_source=facebook&utm_campaign=salem_emergency_plumbing_feb',
    admin_notes: 'Customer submitted via FB Ad. High priority leakage.',
    tracking_token: 'e7b1a234-8c90-4d56-a123-456789abc101',
    created_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(), // 12 mins ago
    updated_at: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
  },
  {
    id: 'req-1043',
    request_number: 1043,
    customer_id: 'cust-2',
    customer_name: 'Meena Sundaram',
    customer_phone: '+91 97892 11456',
    category_id: 'cat-electrical',
    category_name: 'Electrical',
    service_id: 'srv-switchboard-repair',
    service_name: 'Switchboard & MCB Repair',
    description: 'Main kitchen switchboard sparks when refrigerator is plugged in. MCB keeps tripping.',
    formatted_address: 'No 18, Meyyanur Main Road, Near Reliance Market, Salem - 636004',
    latitude: 11.6630,
    longitude: 78.1330,
    location_accuracy: 15.0,
    urgency: 'high',
    preferred_date: '2026-02-18',
    preferred_time_slot: 'Immediately / ASAP',
    status: 'CUSTOMER_TO_CALL',
    customer_confirmed: false,
    source: 'META',
    utm_source: 'instagram',
    utm_medium: 'reel_ad',
    utm_campaign: 'electrical_safety_salem',
    landing_page: '/request?utm_source=instagram',
    admin_notes: 'Urgent sparks hazard. Call customer immediately to verify safety.',
    tracking_token: 'e7b1a234-8c90-4d56-a123-456789abc102',
    created_at: new Date(Date.now() - 28 * 60 * 1000).toISOString(), // 28 mins ago
    updated_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
  },
  {
    id: 'req-1041',
    request_number: 1041,
    customer_id: 'cust-3',
    customer_name: 'Venkatesh S.',
    customer_phone: '+91 94433 77881',
    category_id: 'cat-plumbing',
    category_name: 'Plumbing',
    service_id: 'srv-pipe-leakage',
    service_name: 'Pipe Leakage & Drainage Repair',
    description: 'Kitchen sink outlet PVC pipe broken at the junction collar. Needs replacement.',
    formatted_address: 'Door 14/B, Saradha College Road, Hasthampatti, Salem - 636007',
    latitude: 11.6760,
    longitude: 78.1560,
    urgency: 'medium',
    preferred_date: '2026-02-18',
    preferred_time_slot: '6:00 PM - 8:00 PM',
    status: 'CUSTOMER_CONFIRMED',
    customer_confirmed: true,
    customer_confirmed_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    source: 'DIRECT',
    admin_notes: 'Spoke with customer. Customer confirmed requirement and home availability at 6 PM.',
    tracking_token: 'e7b1a234-8c90-4d56-a123-456789abc103',
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'req-1040',
    request_number: 1040,
    customer_id: 'cust-4',
    customer_name: 'Dr. Anitha Mohan',
    customer_phone: '+91 98421 99012',
    category_id: 'cat-carpentry',
    category_name: 'Carpentry',
    service_id: 'srv-door-lock-repair',
    service_name: 'Door Repair & Lock Fitting',
    description: 'Clinic entrance teakwood door latch jammed from inside. Needs emergency lock replacement.',
    formatted_address: 'Mohan Clinic, Cherry Road, Near Gandhi Stadium, Salem - 636001',
    latitude: 11.6580,
    longitude: 78.1510,
    urgency: 'emergency',
    preferred_date: '2026-02-18',
    preferred_time_slot: 'Immediate',
    status: 'WORKER_CONTACTING',
    customer_confirmed: true,
    customer_confirmed_at: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    source: 'REFERRAL',
    admin_notes: 'Clinic locked. Emergency response needed.',
    tracking_token: 'e7b1a234-8c90-4d56-a123-456789abc104',
    created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
  },
  {
    id: 'req-1039',
    request_number: 1039,
    customer_id: 'cust-5',
    customer_name: 'Kavitha Radhakrishnan',
    customer_phone: '+91 96290 88712',
    category_id: 'cat-ac-appliances',
    category_name: 'AC & Appliances',
    service_id: 'srv-ac-service',
    service_name: 'AC Filter Service & Gas Check',
    description: 'Master bedroom 1.5 ton Daikin AC water dripping on wall and cooling low.',
    formatted_address: '108 Greenways Road, Fairlands, Salem - 636016',
    latitude: 11.6705,
    longitude: 78.1402,
    urgency: 'medium',
    preferred_date: '2026-02-19',
    preferred_time_slot: '10:00 AM - 1:00 PM',
    status: 'ASSIGNED',
    customer_confirmed: true,
    customer_confirmed_at: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    assigned_worker_id: 'w-vijay-ac',
    assigned_worker_name: 'Vijay Anand',
    source: 'ORGANIC',
    admin_notes: 'Vijay Anand accepted at 11:30 AM. Scheduled for tomorrow morning.',
    tracking_token: 'e7b1a234-8c90-4d56-a123-456789abc105',
    created_at: new Date(Date.now() - 150 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
  },
  {
    id: 'req-1038',
    request_number: 1038,
    customer_id: 'cust-1',
    customer_name: 'Raj Kumar',
    customer_phone: '+91 98401 22334',
    category_id: 'cat-plumbing',
    category_name: 'Plumbing',
    service_id: 'srv-tap-repair',
    service_name: 'Tap Repair & Replacement',
    description: 'Bathroom washbasin hot-and-cold mixer tap replacement.',
    formatted_address: 'Plot 42, 5th Cross, Brindavan Road, Fairlands, Salem - 636016',
    latitude: 11.6720,
    longitude: 78.1380,
    urgency: 'low',
    preferred_date: '2026-02-17',
    preferred_time_slot: '3:00 PM',
    status: 'COMPLETED',
    customer_confirmed: true,
    assigned_worker_id: 'w-mani',
    assigned_worker_name: 'Manikandan S.',
    source: 'DIRECT',
    admin_notes: 'Successfully installed new mixer. Customer satisfied.',
    tracking_token: 'e7b1a234-8c90-4d56-a123-456789abc106',
    created_at: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 20 * 3600 * 1000).toISOString(),
  },
  {
    id: 'req-1037',
    request_number: 1037,
    customer_id: 'cust-2',
    customer_name: 'Meena Sundaram',
    customer_phone: '+91 97892 11456',
    category_id: 'cat-electrical',
    category_name: 'Electrical',
    service_id: 'srv-fan-installation',
    service_name: 'Ceiling Fan Installation & Repair',
    description: '2 new BLDC ceiling fans to be assembled and hung with downrod.',
    formatted_address: 'No 18, Meyyanur Main Road, Salem - 636004',
    latitude: 11.6630,
    longitude: 78.1330,
    urgency: 'low',
    preferred_date: '2026-02-18',
    status: 'IN_PROGRESS',
    customer_confirmed: true,
    assigned_worker_id: 'w-selvam-elec',
    assigned_worker_name: 'Selvamurugan K.',
    source: 'META',
    utm_source: 'facebook',
    utm_campaign: 'bldc_fan_promo',
    admin_notes: 'Selvam on site assembling fans.',
    tracking_token: 'e7b1a234-8c90-4d56-a123-456789abc107',
    created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
];

// Seed Contact History
export const SEED_CONTACT_ATTEMPTS: WorkerContactAttempt[] = [
  {
    id: 'ca-1',
    request_id: 'req-1040',
    worker_id: 'w-murugan-carp',
    worker_name: 'Murugesan A.',
    worker_phone: '+91 94862 77019',
    operator_id: 'admin-1',
    operator_name: 'Vikasa Operator',
    attempt_number: 1,
    result: 'no_answer',
    notes: 'Rang 4 times, no response. Auto-moving to next worker.',
    created_at: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
  },
  {
    id: 'ca-2',
    request_id: 'req-1039',
    worker_id: 'w-vijay-ac',
    worker_name: 'Vijay Anand',
    worker_phone: '+91 97500 22341',
    operator_id: 'admin-1',
    operator_name: 'Vikasa Operator',
    attempt_number: 1,
    result: 'accepted',
    notes: 'Agreed to visit tomorrow at 10 AM. Base price ₹350 + materials.',
    created_at: new Date(Date.now() - 95 * 60 * 1000).toISOString(),
  },
];

// Seed Audit Logs
export const SEED_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'al-101',
    user_id: 'admin-1',
    user_name: 'Vikasa Operator',
    action: 'REQUEST_CONFIRMED',
    entity_type: 'service_request',
    entity_id: 'req-1041',
    metadata: { note: 'Customer requirements confirmed over phone.' },
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'al-102',
    user_id: 'admin-1',
    user_name: 'Vikasa Operator',
    action: 'WORKER_CONTACT_ATTEMPT',
    entity_type: 'worker_contact_attempt',
    entity_id: 'ca-1',
    metadata: { worker: 'Murugesan A.', result: 'no_answer' },
    created_at: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
  },
  {
    id: 'al-103',
    user_id: 'admin-1',
    user_name: 'Vikasa Operator',
    action: 'ASSIGNMENT_CREATED',
    entity_type: 'assignment',
    entity_id: 'req-1039',
    metadata: { worker: 'Vijay Anand', request: 1039 },
    created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
  },
];

// In-Memory Repository with localStorage hydration
class VikasaDataStore {
  private workers: Worker[] = [...SEED_WORKERS];
  private customers: Customer[] = [...SEED_CUSTOMERS];
  private requests: ServiceRequest[] = [...SEED_REQUESTS];
  private contactAttempts: WorkerContactAttempt[] = [...SEED_CONTACT_ATTEMPTS];
  private auditLogs: AuditLog[] = [...SEED_AUDIT_LOGS];
  private initialized = false;

  private init() {
    if (this.initialized) return;
    if (typeof window !== 'undefined') {
      try {
        const savedReqs = localStorage.getItem('vikasa_requests');
        if (savedReqs) {
          const parsed: ServiceRequest[] = JSON.parse(savedReqs);
          // Ensure all requests have valid tracking_token
          this.requests = parsed.map((r, idx) => ({
            ...r,
            tracking_token: r.tracking_token || `e7b1a234-8c90-4d56-a123-456789abc${100 + idx}`,
          }));
        }

        const savedWorkers = localStorage.getItem('vikasa_workers');
        if (savedWorkers) this.workers = JSON.parse(savedWorkers);

        const savedAttempts = localStorage.getItem('vikasa_attempts');
        if (savedAttempts) this.contactAttempts = JSON.parse(savedAttempts);

        const savedLogs = localStorage.getItem('vikasa_logs');
        if (savedLogs) this.auditLogs = JSON.parse(savedLogs);
      } catch (e) {
        console.error('Failed to load local database state:', e);
      }
    }
    this.initialized = true;
  }

  private persist() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('vikasa_requests', JSON.stringify(this.requests));
        localStorage.setItem('vikasa_workers', JSON.stringify(this.workers));
        localStorage.setItem('vikasa_attempts', JSON.stringify(this.contactAttempts));
        localStorage.setItem('vikasa_logs', JSON.stringify(this.auditLogs));
      } catch (e) {
        console.error('Failed to persist database state:', e);
      }
    }
  }

  // --- Requests ---
  getRequests(statusFilter?: RequestStatus): ServiceRequest[] {
    this.init();
    if (statusFilter) {
      return this.requests.filter((r) => r.status === statusFilter);
    }
    return [...this.requests].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  getRequestById(id: string): ServiceRequest | undefined {
    this.init();
    return this.requests.find((r) => r.id === id);
  }

  getRequestByTrackingToken(token: string): ServiceRequest | undefined {
    this.init();
    if (!token) return undefined;
    return this.requests.find((r) => r.tracking_token === token);
  }

  /**
   * Secure public tracking projection.
   * Exposes strictly non-sensitive fields. Zero PII.
   */
  getPublicTrackingStatus(token: string): PublicTrackingData | null {
    this.init();
    if (!token) return null;
    const req = this.requests.find((r) => r.tracking_token === token);
    if (!req) return null;

    return {
      request_number: req.request_number,
      service_name: req.service_name,
      category_name: req.category_name,
      status: req.status,
      preferred_date: req.preferred_date,
      preferred_time_slot: req.preferred_time_slot,
      general_area: req.formatted_address.split(',')[0]?.trim() || 'Salem',
      created_at: req.created_at,
      assigned_worker_first_name: req.assigned_worker_name ? req.assigned_worker_name.split(' ')[0] : undefined,
    };
  }

  createRequest(data: Omit<ServiceRequest, 'id' | 'request_number' | 'tracking_token' | 'created_at' | 'updated_at'>): ServiceRequest {
    this.init();
    const nextNumber = 1000 + this.requests.length + 1;
    const trackingToken = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `e7b1a234-${Date.now().toString(16)}-4d56-a123-${Math.random().toString(16).slice(2, 14)}`;

    const newReq: ServiceRequest = {
      ...data,
      id: `req-${nextNumber}`,
      request_number: nextNumber,
      tracking_token: trackingToken,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.requests.unshift(newReq);
    
    // Log audit
    this.addAuditLog('REQUEST_CREATED', 'service_request', newReq.id, {
      request_number: nextNumber,
      service: newReq.service_name,
      urgency: newReq.urgency,
    });

    this.persist();
    return newReq;
  }

  updateRequestStatus(id: string, status: RequestStatus, note?: string): ServiceRequest | undefined {
    this.init();
    const req = this.requests.find((r) => r.id === id);
    if (!req) return undefined;

    const prevStatus = req.status;
    req.status = status;
    req.updated_at = new Date().toISOString();
    if (note) {
      req.admin_notes = req.admin_notes ? `${req.admin_notes}\n• ${note}` : note;
    }

    this.addAuditLog('STATUS_CHANGE', 'service_request', id, {
      from: prevStatus,
      to: status,
      note,
    });

    this.persist();
    return req;
  }

  confirmCustomerRequirement(id: string, operatorNotes?: string): ServiceRequest | undefined {
    this.init();
    const req = this.requests.find((r) => r.id === id);
    if (!req) return undefined;

    req.customer_confirmed = true;
    req.customer_confirmed_at = new Date().toISOString();
    req.status = 'CUSTOMER_CONFIRMED';
    req.updated_at = new Date().toISOString();
    if (operatorNotes) {
      req.admin_notes = req.admin_notes
        ? `${req.admin_notes}\n[Confirmed] ${operatorNotes}`
        : `[Confirmed] ${operatorNotes}`;
    }

    this.addAuditLog('CUSTOMER_CONFIRMED', 'service_request', id, {
      confirmed_at: req.customer_confirmed_at,
      operatorNotes,
    });

    this.persist();
    return req;
  }

  // --- Workers ---
  getWorkers(): Worker[] {
    this.init();
    return [...this.workers];
  }

  getWorkerById(id: string): Worker | undefined {
    this.init();
    return this.workers.find((w) => w.id === id);
  }

  updateWorkerStatus(
    id: string,
    updates: Partial<Pick<Worker, 'verification_status' | 'availability' | 'verification_notes'>>
  ): Worker | undefined {
    this.init();
    const worker = this.workers.find((w) => w.id === id);
    if (!worker) return undefined;

    Object.assign(worker, updates, { updated_at: new Date().toISOString() });
    this.addAuditLog('WORKER_UPDATED', 'worker', id, updates);
    this.persist();
    return worker;
  }

  registerWorker(data: Omit<Worker, 'id' | 'verification_status' | 'created_at' | 'updated_at'>): Worker {
    this.init();
    const newWorker: Worker = {
      ...data,
      id: `w-${Date.now()}`,
      verification_status: 'pending_verification',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.workers.push(newWorker);
    this.addAuditLog('WORKER_REGISTERED', 'worker', newWorker.id, {
      name: newWorker.full_name,
      base: newWorker.base_location_name,
    });
    this.persist();
    return newWorker;
  }

  // --- Sequential Contact Attempts & Assignment ---
  getContactAttemptsForRequest(requestId: string): WorkerContactAttempt[] {
    this.init();
    return this.contactAttempts
      .filter((a) => a.request_id === requestId)
      .sort((a, b) => a.attempt_number - b.attempt_number);
  }

  recordContactAttempt(
    requestId: string,
    workerId: string,
    result: ContactResult,
    notes?: string
  ): WorkerContactAttempt {
    this.init();
    const worker = this.getWorkerById(workerId);
    const existing = this.getContactAttemptsForRequest(requestId);
    const attemptNumber = existing.length + 1;

    const attempt: WorkerContactAttempt = {
      id: `ca-${Date.now()}`,
      request_id: requestId,
      worker_id: workerId,
      worker_name: worker?.full_name || 'Worker',
      worker_phone: worker?.phone || '',
      operator_id: 'admin-1',
      operator_name: 'VIKASA Operator',
      attempt_number: attemptNumber,
      result,
      notes,
      created_at: new Date().toISOString(),
    };

    this.contactAttempts.push(attempt);

    // Update request status to WORKER_CONTACTING if not already
    const req = this.getRequestById(requestId);
    if (req && req.status !== 'WORKER_ACCEPTED' && req.status !== 'ASSIGNED') {
      req.status = result === 'accepted' ? 'WORKER_ACCEPTED' : 'WORKER_CONTACTING';
      req.updated_at = new Date().toISOString();
    }

    this.addAuditLog('WORKER_CONTACTED', 'worker_contact_attempt', attempt.id, {
      request_id: requestId,
      worker_id: workerId,
      result,
      notes,
    });

    this.persist();
    return attempt;
  }

  assignWorker(requestId: string, workerId: string, notes?: string): Assignment {
    this.init();
    const req = this.getRequestById(requestId);
    const worker = this.getWorkerById(workerId);

    if (!req || !worker) {
      throw new Error('Invalid request or worker for assignment');
    }

    // 1. Update Request
    req.status = 'ASSIGNED';
    req.assigned_worker_id = worker.id;
    req.assigned_worker_name = worker.full_name;
    req.updated_at = new Date().toISOString();

    // 2. Automatically switch Worker availability from AVAILABLE -> BUSY
    worker.availability = 'busy';
    worker.updated_at = new Date().toISOString();

    // 3. Create Assignment Record
    const assignment: Assignment = {
      id: `asgn-${Date.now()}`,
      request_id: requestId,
      worker_id: workerId,
      worker_name: worker.full_name,
      assigned_by: 'admin-1',
      assigned_by_name: 'VIKASA Operator',
      assigned_at: new Date().toISOString(),
      status: 'active',
      notes,
    };

    this.addAuditLog('WORKER_ASSIGNED', 'assignment', assignment.id, {
      request_id: requestId,
      worker_id: workerId,
      worker_name: worker.full_name,
    });

    this.persist();
    return assignment;
  }

  completeJob(requestId: string): void {
    this.init();
    const req = this.getRequestById(requestId);
    if (!req) return;

    req.status = 'COMPLETED';
    req.updated_at = new Date().toISOString();

    // Free the assigned worker back to AVAILABLE
    if (req.assigned_worker_id) {
      const worker = this.getWorkerById(req.assigned_worker_id);
      if (worker) {
        worker.availability = 'available';
        worker.updated_at = new Date().toISOString();
      }
    }

    this.addAuditLog('JOB_COMPLETED', 'service_request', requestId, {
      completed_at: new Date().toISOString(),
    });

    this.persist();
  }

  // --- Audit Logs ---
  getAuditLogs(): AuditLog[] {
    this.init();
    return [...this.auditLogs].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  private addAuditLog(action: string, entity_type: string, entity_id: string, metadata?: Record<string, unknown>) {
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      user_id: 'admin-1',
      user_name: 'VIKASA Operator',
      action,
      entity_type,
      entity_id,
      metadata,
      created_at: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
  }

  // Reset to initial seeds
  resetDemoData() {
    this.requests = [...SEED_REQUESTS];
    this.workers = [...SEED_WORKERS];
    this.customers = [...SEED_CUSTOMERS];
    this.contactAttempts = [...SEED_CONTACT_ATTEMPTS];
    this.auditLogs = [...SEED_AUDIT_LOGS];
    this.persist();
  }
}

export const dataStore = new VikasaDataStore();
