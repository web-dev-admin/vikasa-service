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

// Seed Realistic Service Technicians in Salem, Erode, Coimbatore, Namakkal & Nearby
export const SEED_WORKERS: Worker[] = [
  {
    id: 'w-kumar',
    full_name: 'Kumarasamy R.',
    phone: '+91 98427 11029',
    whatsapp: '+91 98427 11029',
    email: 'kumar.plumbing@example.com',
    experience_years: 7,
    skills: ['Pipe Leakage', 'Tap Fitting', 'Bathroom Plumbing', 'Water Tank'],
    bio: 'Experienced master plumber specialized in high-pressure bathroom and concealed pipe repairs.',
    verification_status: 'verified',
    verified_at: '2026-01-10T10:00:00Z',
    verified_by: 'admin-1',
    availability: 'available',
    active_status: 'active',
    district: 'Salem',
    base_location_name: 'Suramangalam, Salem',
    latitude: 11.6710,
    longitude: 78.1250,
    service_radius_km: 20,
    service_area_names: ['Suramangalam', 'Fairlands', 'Meyyanur', 'Salem Junction'],
    service_ids: ['srv-plumbing', 'srv-pipe-leakage', 'srv-tap-repair', 'srv-water-tank', 'srv-toilet-repair'],
    created_at: '2026-01-05T08:00:00Z',
    updated_at: '2026-01-05T08:00:00Z',
  },
  {
    id: 'w-mani',
    full_name: 'Manikandan S.',
    phone: '+91 97890 44211',
    whatsapp: '+91 97890 44211',
    email: 'mani.plumbing@example.com',
    experience_years: 5,
    skills: ['Angle Cock Repair', 'Drain Blockage Clear', 'Overhead Tank Connection'],
    bio: 'Quick response emergency plumber with rotary drain clear tools.',
    verification_status: 'verified',
    verified_at: '2026-01-12T14:30:00Z',
    verified_by: 'admin-1',
    availability: 'available',
    active_status: 'active',
    district: 'Salem',
    base_location_name: 'Fairlands, Salem',
    latitude: 11.6685,
    longitude: 78.1410,
    service_radius_km: 15,
    service_area_names: ['Fairlands', 'Hasthampatti', 'Alagapuram', 'Meyyanur'],
    service_ids: ['srv-plumbing', 'srv-pipe-leakage', 'srv-tap-repair', 'srv-water-tank'],
    created_at: '2026-01-08T09:00:00Z',
    updated_at: '2026-01-08T09:00:00Z',
  },
  {
    id: 'w-ravi-erode',
    full_name: 'Ravi Kumar',
    phone: '+91 94432 88102',
    whatsapp: '+91 94432 88102',
    email: 'ravi.plumber.erode@example.com',
    experience_years: 11,
    skills: ['Plumbing', 'Pipe Repair', 'Drainage Laying', 'Motor Pump'],
    bio: 'Senior plumbing technician with over a decade of residential and commercial plumbing experience.',
    verification_status: 'verified',
    verified_at: '2026-01-02T11:00:00Z',
    verified_by: 'admin-1',
    availability: 'available',
    active_status: 'active',
    district: 'Erode',
    base_location_name: 'Perundurai Road, Erode',
    latitude: 11.3410,
    longitude: 77.7172,
    service_radius_km: 25,
    service_area_names: ['Perundurai Road', 'Brough Road', 'Thindal', 'Surampatti'],
    service_ids: ['srv-plumbing', 'srv-pipe-leakage', 'srv-water-tank', 'srv-toilet-repair'],
    created_at: '2026-01-01T10:00:00Z',
    updated_at: '2026-01-01T10:00:00Z',
  },
  {
    id: 'w-selvam-elec',
    full_name: 'Selvamurugan K.',
    phone: '+91 98941 55670',
    whatsapp: '+91 98941 55670',
    email: 'selvam.electrician@example.com',
    experience_years: 8,
    skills: ['MCB Tripping', '3-Phase Wiring', 'Inverter Installation', 'Switchboard Fixes'],
    bio: 'Licensed B-grade electrical contractor. Fast fault-finding specialist.',
    verification_status: 'verified',
    verified_at: '2026-01-03T16:00:00Z',
    verified_by: 'admin-1',
    availability: 'available',
    active_status: 'active',
    district: 'Salem',
    base_location_name: 'Meyyanur, Salem',
    latitude: 11.6620,
    longitude: 78.1320,
    service_radius_km: 18,
    service_area_names: ['Meyyanur', 'New Bus Stand', 'Kandhampatti', 'Fairlands'],
    service_ids: ['srv-electrical', 'srv-switchboard-repair', 'srv-fan-installation', 'srv-wiring-lighting'],
    created_at: '2026-01-02T09:30:00Z',
    updated_at: '2026-01-02T09:30:00Z',
  },
  {
    id: 'w-prakash-elec',
    full_name: 'Prakash Velu',
    phone: '+91 96291 33455',
    whatsapp: '+91 96291 33455',
    experience_years: 4,
    skills: ['Ceiling Fan Repair', 'Switchboard Assembly', 'Geyser Electrical Connection'],
    bio: 'Prompt and detail-oriented electrician for quick domestic troubleshooting.',
    verification_status: 'verified',
    verified_at: '2026-01-15T11:00:00Z',
    verified_by: 'admin-1',
    availability: 'available',
    active_status: 'active',
    district: 'Salem',
    base_location_name: 'Ammapet, Salem',
    latitude: 11.6540,
    longitude: 78.1750,
    service_radius_km: 15,
    service_area_names: ['Ammapet', 'Ponnammapet', 'Udayapatty', 'Pattai'],
    service_ids: ['srv-electrical', 'srv-fan-installation', 'srv-switchboard-repair'],
    created_at: '2026-01-10T12:00:00Z',
    updated_at: '2026-01-10T12:00:00Z',
  },
  {
    id: 'w-murugan-carp',
    full_name: 'Murugesan A.',
    phone: '+91 94862 77019',
    whatsapp: '+91 94862 77019',
    experience_years: 12,
    skills: ['Teakwood Door Fixing', 'Godrej Lock Fitting', 'Modular Kitchen Hinge Repair', 'Interior Woodwork'],
    bio: 'Master carpenter with 12 years experience in door alignments, sliding wardrobes, and lock sets.',
    verification_status: 'verified',
    verified_at: '2026-01-04T10:00:00Z',
    verified_by: 'admin-1',
    availability: 'available',
    active_status: 'active',
    district: 'Salem',
    base_location_name: 'Shevapet, Salem',
    latitude: 11.6510,
    longitude: 78.1390,
    service_radius_km: 20,
    service_area_names: ['Shevapet', 'Gugai', 'Bazaar', 'Dadagapatty'],
    service_ids: ['srv-carpentry', 'srv-door-lock-repair', 'srv-furniture-repair', 'srv-woodwork-general', 'srv-interior'],
    created_at: '2026-01-02T08:00:00Z',
    updated_at: '2026-01-02T08:00:00Z',
  },
  {
    id: 'w-vijay-ac',
    full_name: 'Vijay Anand',
    phone: '+91 97500 22341',
    whatsapp: '+91 97500 22341',
    experience_years: 6,
    skills: ['Inverter AC Servicing', 'Gas Charging R32/R410A', 'Compressor Replacement', 'Jet Wash'],
    bio: 'Certified HVAC technician equipped with pressure gauges and jet wash pump.',
    verification_status: 'verified',
    verified_at: '2026-01-06T15:00:00Z',
    verified_by: 'admin-1',
    availability: 'available',
    active_status: 'active',
    district: 'Salem',
    base_location_name: 'Alagapuram, Salem',
    latitude: 11.6810,
    longitude: 78.1430,
    service_radius_km: 25,
    service_area_names: ['Alagapuram', 'Fairlands', 'Hasthampatti', 'Reddiyur'],
    service_ids: ['srv-ac', 'srv-ac-service', 'srv-washing-machine'],
    created_at: '2026-01-04T11:00:00Z',
    updated_at: '2026-01-04T11:00:00Z',
  },
  {
    id: 'w-karthik-cleaning',
    full_name: 'Karthik Deepan',
    phone: '+91 98433 99881',
    whatsapp: '+91 98433 99881',
    experience_years: 5,
    skills: ['Deep Bathroom Cleaning', 'Water Tank Jet Cleaning', 'Floor Polishing'],
    bio: 'Professional residential and commercial deep cleaning specialist.',
    verification_status: 'verified',
    verified_at: '2026-01-18T10:00:00Z',
    verified_by: 'admin-1',
    availability: 'available',
    active_status: 'active',
    district: 'Dharmapuri',
    base_location_name: 'Collectorate Area, Dharmapuri',
    latitude: 12.1211,
    longitude: 78.1582,
    service_radius_km: 25,
    service_area_names: ['Dharmapuri Town', 'Pennagaram Road', 'Nallampalli'],
    service_ids: ['srv-cleaning', 'srv-deep-cleaning', 'srv-painting'],
    created_at: '2026-01-15T09:00:00Z',
    updated_at: '2026-01-15T09:00:00Z',
  },
  {
    id: 'w-saravanan-coimbatore',
    full_name: 'Saravanan M.',
    phone: '+91 99441 66520',
    whatsapp: '+91 99441 66520',
    experience_years: 9,
    skills: ['Interior Design Consultation', 'Modular Kitchen', 'False Ceiling', 'Carpentry'],
    bio: 'Interior finishes and architectural woodwork specialist in Western Tamil Nadu.',
    verification_status: 'verified',
    verified_at: '2026-01-05T10:00:00Z',
    verified_by: 'admin-1',
    availability: 'available',
    active_status: 'active',
    district: 'Coimbatore',
    base_location_name: 'Gandhipuram, Coimbatore',
    latitude: 11.0168,
    longitude: 76.9558,
    service_radius_km: 30,
    service_area_names: ['Gandhipuram', 'RS Puram', 'Peelamedu', 'Saravanampatti'],
    service_ids: ['srv-interior', 'srv-carpentry', 'srv-painting'],
    created_at: '2026-01-03T11:00:00Z',
    updated_at: '2026-01-03T11:00:00Z',
  },
];

// Seed Permanent Customers
export const SEED_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    full_name: 'Arun Kumar',
    phone: '+91 98401 22334',
    whatsapp: '+91 98401 22334',
    district: 'Erode',
    address: 'Plot 42, 5th Cross, Perundurai Road, Erode',
    latitude: 11.3410,
    longitude: 77.7172,
    created_at: '2026-02-18T09:00:00Z',
    updated_at: '2026-02-18T09:00:00Z',
  },
  {
    id: 'cust-2',
    full_name: 'Meena Sundaram',
    phone: '+91 97892 11456',
    whatsapp: '+91 97892 11456',
    district: 'Salem',
    address: 'No 18, Meyyanur Main Road, Salem',
    latitude: 11.6630,
    longitude: 78.1330,
    created_at: '2026-02-18T09:30:00Z',
    updated_at: '2026-02-18T09:30:00Z',
  },
  {
    id: 'cust-3',
    full_name: 'Karthik N.',
    phone: '+91 94433 77881',
    whatsapp: '+91 94433 77881',
    district: 'Dharmapuri',
    address: '12 Gandhi Nagar, Near Collectorate, Dharmapuri',
    latitude: 12.1211,
    longitude: 78.1582,
    created_at: '2026-02-18T10:00:00Z',
    updated_at: '2026-02-18T10:00:00Z',
  },
  {
    id: 'cust-4',
    full_name: 'Dr. Anitha Mohan',
    phone: '+91 98421 99012',
    whatsapp: '+91 98421 99012',
    district: 'Salem',
    address: 'Fairlands Main Road, Salem',
    latitude: 11.6720,
    longitude: 78.1380,
    created_at: '2026-02-18T10:30:00Z',
    updated_at: '2026-02-18T10:30:00Z',
  },
  {
    id: 'cust-5',
    full_name: 'Suresh Babu',
    phone: '+91 96290 88712',
    whatsapp: '+91 96290 88712',
    district: 'Coimbatore',
    address: '45 Cross Cut Road, Gandhipuram, Coimbatore',
    latitude: 11.0168,
    longitude: 76.9558,
    created_at: '2026-02-18T11:00:00Z',
    updated_at: '2026-02-18T11:00:00Z',
  },
];

// Seed Service Requests across simplified states:
// 'NEW' | 'CUSTOMER_CONFIRMED' | 'ASSIGNED' | 'COMPLETED'
export const SEED_REQUESTS: ServiceRequest[] = [
  {
    id: 'req-1042',
    request_number: 1042,
    customer_id: 'cust-1',
    customer_name: 'Arun Kumar',
    customer_phone: '+91 98401 22334',
    customer_whatsapp: '+91 98401 22334',
    category_id: 'cat-plumbing',
    category_name: 'Plumbing',
    service_id: 'srv-plumbing',
    service_name: 'Plumbing',
    description: 'Bathroom pipe joint leaking under washbasin, water dripping continuously.',
    formatted_address: 'Plot 42, 5th Cross, Perundurai Road, Erode',
    district: 'Erode',
    latitude: 11.3410,
    longitude: 77.7172,
    preferred_date: '2026-10-06',
    status: 'NEW',
    customer_confirmed: false,
    tracking_token: 'e7b1a234-8c90-4d56-a123-456789abc101',
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'req-1043',
    request_number: 1043,
    customer_id: 'cust-2',
    customer_name: 'Meena Sundaram',
    customer_phone: '+91 97892 11456',
    customer_whatsapp: '+91 97892 11456',
    category_id: 'cat-electrical',
    category_name: 'Electrical',
    service_id: 'srv-electrical',
    service_name: 'Electrical',
    description: 'Kitchen main switchboard sparking when induction stove is plugged in.',
    formatted_address: 'No 18, Meyyanur Main Road, Salem',
    district: 'Salem',
    latitude: 11.6630,
    longitude: 78.1330,
    preferred_date: '2026-10-06',
    status: 'CUSTOMER_CONFIRMED',
    customer_confirmed: true,
    customer_confirmed_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    tracking_token: 'e7b1a234-8c90-4d56-a123-456789abc102',
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: 'req-1044',
    request_number: 1044,
    customer_id: 'cust-3',
    customer_name: 'Karthik N.',
    customer_phone: '+91 94433 77881',
    customer_whatsapp: '+91 94433 77881',
    category_id: 'cat-cleaning-painting',
    category_name: 'Cleaning',
    service_id: 'srv-cleaning',
    service_name: 'Cleaning',
    description: 'Full house deep cleaning required before housewarming.',
    formatted_address: '12 Gandhi Nagar, Near Collectorate, Dharmapuri',
    district: 'Dharmapuri',
    latitude: 12.1211,
    longitude: 78.1582,
    preferred_date: '2026-10-07',
    status: 'ASSIGNED',
    customer_confirmed: true,
    assigned_worker_id: 'w-karthik-cleaning',
    assigned_worker_name: 'Karthik Deepan',
    assigned_worker_phone: '+91 98433 99881',
    tracking_token: 'e7b1a234-8c90-4d56-a123-456789abc103',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'req-1045',
    request_number: 1045,
    customer_id: 'cust-4',
    customer_name: 'Dr. Anitha Mohan',
    customer_phone: '+91 98421 99012',
    customer_whatsapp: '+91 98421 99012',
    category_id: 'cat-ac-appliances',
    category_name: 'AC Service',
    service_id: 'srv-ac',
    service_name: 'AC Service',
    description: 'Split AC not cooling properly in master bedroom, need filter cleaning and gas check.',
    formatted_address: 'Fairlands Main Road, Salem',
    district: 'Salem',
    latitude: 11.6720,
    longitude: 78.1380,
    preferred_date: '2026-10-05',
    status: 'COMPLETED',
    customer_confirmed: true,
    assigned_worker_id: 'w-vijay-ac',
    assigned_worker_name: 'Vijay Anand',
    assigned_worker_phone: '+91 97500 22341',
    tracking_token: 'e7b1a234-8c90-4d56-a123-456789abc104',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
  },
];

export const SEED_CONTACT_ATTEMPTS: WorkerContactAttempt[] = [];
export const SEED_AUDIT_LOGS: AuditLog[] = [];

// In-Memory Repository with localStorage hydration and permanent records
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
          this.requests = parsed.map((r, idx) => ({
            ...r,
            tracking_token: r.tracking_token || `e7b1a234-8c90-4d56-a123-456789abc${100 + idx}`,
          }));
        }

        const savedWorkers = localStorage.getItem('vikasa_workers');
        if (savedWorkers) this.workers = JSON.parse(savedWorkers);

        const savedCustomers = localStorage.getItem('vikasa_customers');
        if (savedCustomers) this.customers = JSON.parse(savedCustomers);

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
        localStorage.setItem('vikasa_customers', JSON.stringify(this.customers));
        localStorage.setItem('vikasa_attempts', JSON.stringify(this.contactAttempts));
        localStorage.setItem('vikasa_logs', JSON.stringify(this.auditLogs));
      } catch (e) {
        console.error('Failed to persist database state:', e);
      }
    }
  }

  // --- Customers (Permanent Records & Deduplication) ---
  upsertCustomer(data: {
    full_name: string;
    phone: string;
    whatsapp?: string;
    district?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  }): Customer {
    this.init();
    const cleanPhone = data.phone.replace(/\D/g, '').slice(-10);

    const existing = this.customers.find((c) => {
      const cClean = c.phone.replace(/\D/g, '').slice(-10);
      return cClean === cleanPhone;
    });

    if (existing) {
      existing.full_name = data.full_name || existing.full_name;
      if (data.whatsapp) existing.whatsapp = data.whatsapp;
      if (data.district) existing.district = data.district;
      if (data.address) existing.address = data.address;
      if (data.latitude) existing.latitude = data.latitude;
      if (data.longitude) existing.longitude = data.longitude;
      existing.updated_at = new Date().toISOString();
      this.persist();
      return existing;
    }

    const newCustomer: Customer = {
      id: `cust-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      full_name: data.full_name.trim(),
      phone: data.phone.trim(),
      whatsapp: data.whatsapp?.trim() || data.phone.trim(),
      district: data.district || 'Salem',
      address: data.address || '',
      latitude: data.latitude || SALEM_CENTER.lat,
      longitude: data.longitude || SALEM_CENTER.lon,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.customers.unshift(newCustomer);
    this.persist();
    return newCustomer;
  }

  getCustomers(filters?: { search?: string; district?: string; service?: string }): Array<Customer & { totalRequests: number; latestService?: string; latestStatus?: RequestStatus }> {
    this.init();
    let result = [...this.customers];

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (c) =>
          c.full_name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          (c.district && c.district.toLowerCase().includes(q))
      );
    }

    if (filters?.district && filters.district !== 'ALL') {
      result = result.filter((c) => c.district?.toLowerCase() === filters.district?.toLowerCase());
    }

    // Attach request metadata
    return result.map((c) => {
      const custReqs = this.requests.filter((r) => r.customer_id === c.id || r.customer_phone.replace(/\D/g, '').slice(-10) === c.phone.replace(/\D/g, '').slice(-10));
      const latest = custReqs[0];
      return {
        ...c,
        totalRequests: custReqs.length,
        latestService: latest?.service_name,
        latestStatus: latest?.status,
      };
    });
  }

  getCustomerById(id: string): { customer: Customer; requests: ServiceRequest[] } | null {
    this.init();
    const customer = this.customers.find((c) => c.id === id);
    if (!customer) return null;

    const cleanPhone = customer.phone.replace(/\D/g, '').slice(-10);
    const requests = this.requests.filter(
      (r) => r.customer_id === customer.id || r.customer_phone.replace(/\D/g, '').slice(-10) === cleanPhone
    );

    return { customer, requests };
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
      general_area: req.formatted_address.split(',')[0]?.trim() || req.district || 'Salem',
      created_at: req.created_at,
      assigned_worker_first_name: req.assigned_worker_name ? req.assigned_worker_name.split(' ')[0] : undefined,
    };
  }

  createRequest(data: Omit<ServiceRequest, 'id' | 'request_number' | 'tracking_token' | 'created_at' | 'updated_at'>): ServiceRequest {
    this.init();
    // 1. Permanently upsert customer
    const permanentCustomer = this.upsertCustomer({
      full_name: data.customer_name,
      phone: data.customer_phone,
      whatsapp: data.customer_whatsapp || data.customer_phone,
      district: data.district || 'Salem',
      address: data.formatted_address,
      latitude: data.latitude,
      longitude: data.longitude,
    });

    const nextNumber = 1000 + this.requests.length + 1;
    const trackingToken =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `e7b1a234-${Date.now().toString(16)}-4d56-a123-${Math.random().toString(16).slice(2, 14)}`;

    const newReq: ServiceRequest = {
      ...data,
      id: `req-${nextNumber}`,
      request_number: nextNumber,
      customer_id: permanentCustomer.id,
      customer_whatsapp: data.customer_whatsapp || data.customer_phone,
      district: data.district || 'Salem',
      tracking_token: trackingToken,
      status: data.status || 'NEW',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.requests.unshift(newReq);

    this.addAuditLog('REQUEST_CREATED', 'service_request', newReq.id, {
      request_number: nextNumber,
      service: newReq.service_name,
      customer: newReq.customer_name,
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

    this.persist();
    return req;
  }

  assignWorker(requestId: string, workerId: string, notes?: string): Assignment {
    this.init();
    const req = this.getRequestById(requestId);
    const worker = this.getWorkerById(workerId);

    if (!req || !worker) {
      throw new Error('Invalid request or technician for assignment');
    }

    req.status = 'ASSIGNED';
    req.assigned_worker_id = worker.id;
    req.assigned_worker_name = worker.full_name;
    req.assigned_worker_phone = worker.phone;
    req.updated_at = new Date().toISOString();

    worker.availability = 'busy';
    worker.updated_at = new Date().toISOString();

    const assignment: Assignment = {
      id: `asgn-${Date.now()}`,
      request_id: requestId,
      worker_id: workerId,
      worker_name: worker.full_name,
      assigned_by: 'admin-1',
      assigned_by_name: 'VIKASA Admin',
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

  cancelRequest(requestId: string, reason?: string): void {
    this.init();
    const req = this.getRequestById(requestId);
    if (!req) return;

    req.status = 'CANCELLED';
    req.updated_at = new Date().toISOString();
    if (reason) {
      req.admin_notes = req.admin_notes ? `${req.admin_notes}\n[Cancelled] ${reason}` : `[Cancelled] ${reason}`;
    }

    if (req.assigned_worker_id) {
      const worker = this.getWorkerById(req.assigned_worker_id);
      if (worker && worker.availability === 'busy') {
        worker.availability = 'available';
      }
    }

    this.persist();
  }

  // --- Technicians / Workers ---
  getWorkers(filters?: {
    search?: string;
    district?: string;
    service?: string;
    availability?: string;
    active_status?: string;
  }): Worker[] {
    this.init();
    let result = [...this.workers];

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (w) =>
          w.full_name.toLowerCase().includes(q) ||
          w.phone.includes(q) ||
          (w.district && w.district.toLowerCase().includes(q)) ||
          w.skills.some((s) => s.toLowerCase().includes(q))
      );
    }

    if (filters?.district && filters.district !== 'ALL') {
      result = result.filter((w) => w.district?.toLowerCase() === filters.district?.toLowerCase());
    }

    if (filters?.service && filters.service !== 'ALL') {
      result = result.filter((w) =>
        w.service_ids.some((s) => s.toLowerCase().includes(filters.service?.toLowerCase() || ''))
      );
    }

    if (filters?.availability && filters.availability !== 'ALL') {
      result = result.filter((w) => w.availability === filters.availability);
    }

    if (filters?.active_status && filters.active_status !== 'ALL') {
      result = result.filter((w) => w.active_status === filters.active_status);
    }

    return result;
  }

  getWorkerById(id: string): Worker | undefined {
    this.init();
    return this.workers.find((w) => w.id === id);
  }

  getRequestsForWorker(workerId: string): ServiceRequest[] {
    this.init();
    return this.requests.filter((r) => r.assigned_worker_id === workerId);
  }

  registerWorker(data: Omit<Worker, 'id' | 'created_at' | 'updated_at'>): Worker {
    this.init();
    const newWorker: Worker = {
      ...data,
      id: `w-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      whatsapp: data.whatsapp || data.phone,
      active_status: data.active_status || 'active',
      district: data.district || 'Salem',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.workers.unshift(newWorker);
    this.persist();
    return newWorker;
  }

  updateWorker(id: string, updates: Partial<Worker>): Worker | undefined {
    this.init();
    const worker = this.workers.find((w) => w.id === id);
    if (!worker) return undefined;

    Object.assign(worker, updates, { updated_at: new Date().toISOString() });
    this.persist();
    return worker;
  }

  updateWorkerAvailability(id: string, availability: 'available' | 'busy' | 'offline' | 'temporarily_unavailable'): Worker | undefined {
    return this.updateWorker(id, { availability });
  }

  // --- Worker Contact Attempts ---
  getContactAttemptsForRequest(requestId: string): WorkerContactAttempt[] {
    this.init();
    return this.contactAttempts.filter((a) => a.request_id === requestId);
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

    const attempt: WorkerContactAttempt = {
      id: `att-${Date.now()}`,
      request_id: requestId,
      worker_id: workerId,
      worker_name: worker?.full_name || 'Technician',
      worker_phone: worker?.phone || '',
      operator_id: 'admin-1',
      operator_name: 'VIKASA Admin',
      attempt_number: existing.length + 1,
      result,
      notes,
      created_at: new Date().toISOString(),
    };

    this.contactAttempts.push(attempt);

    const req = this.getRequestById(requestId);
    if (req && req.status === 'NEW') {
      req.status = 'CUSTOMER_CONFIRMED';
      req.updated_at = new Date().toISOString();
    }

    this.persist();
    return attempt;
  }

  // --- Audit Logs ---
  getAuditLogs(): AuditLog[] {
    this.init();
    return [...this.auditLogs];
  }

  private addAuditLog(action: string, entity_type: string, entity_id: string, metadata?: Record<string, unknown>) {
    const log: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      user_id: 'admin-1',
      user_name: 'VIKASA Admin',
      action,
      entity_type,
      entity_id,
      metadata,
      created_at: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
  }

  resetDemoData() {
    this.requests = [...SEED_REQUESTS];
    this.workers = [...SEED_WORKERS];
    this.customers = [...SEED_CUSTOMERS];
    this.contactAttempts = [];
    this.auditLogs = [];
    this.persist();
  }
}

export const dataStore = new VikasaDataStore();
