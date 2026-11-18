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
  WebsiteContent,
  AdminNotification,
  AdminDeviceToken,
  ServiceItem,
  ServiceCategory,
} from '@/types';
import { INITIAL_CATEGORIES, INITIAL_SERVICES } from '@/lib/taxonomy/catalog';
import { STANDARDIZED_SERVICES } from '@/lib/constants';
import { DEFAULT_WEBSITE_CONTENT } from '@/lib/data/website_content';

// Primary Headquarters: Erode, Tamil Nadu, India (11.3410° N, 77.7172° E)
export const ERODE_CENTER = {
  lat: 11.3410,
  lon: 77.7172,
  name: 'Erode, Tamil Nadu, India',
};

// Aliased for backwards compatibility
export const SALEM_CENTER = ERODE_CENTER;

// Clean Baseline: Zero Seed Technicians, Zero Customers, Zero Dummy Bookings
export const SEED_WORKERS: Worker[] = [];
export const SEED_CUSTOMERS: Customer[] = [];
export const SEED_REQUESTS: ServiceRequest[] = [];

export const SEED_CONTACT_ATTEMPTS: WorkerContactAttempt[] = [];
export const SEED_AUDIT_LOGS: AuditLog[] = [];

// In-Memory Repository with localStorage hydration and permanent records
class VikasaDataStore {
  private workers: Worker[] = [];
  private customers: Customer[] = [];
  private requests: ServiceRequest[] = [];
  private contactAttempts: WorkerContactAttempt[] = [];
  private auditLogs: AuditLog[] = [];
  private notifications: AdminNotification[] = [];
  private customServices: ServiceItem[] = [];
  private customCategories: ServiceCategory[] = [];
  private deletedRequestIds = new Set<string>();
  private deletedWorkerIds = new Set<string>();
  private deletedCustomerIds = new Set<string>();
  private websiteContent: WebsiteContent = { ...DEFAULT_WEBSITE_CONTENT };
  private initialized = false;

  private init() {
    if (this.initialized) return;
    if (typeof window !== 'undefined') {
      try {
        const PURGE_KEY = 'vikasa_purged_dummy_data_v2';
        if (!localStorage.getItem(PURGE_KEY)) {
          localStorage.removeItem('vikasa_requests');
          localStorage.removeItem('vikasa_workers');
          localStorage.removeItem('vikasa_customers');
          localStorage.removeItem('vikasa_attempts');
          localStorage.removeItem('vikasa_logs');
          localStorage.setItem(PURGE_KEY, 'true');
        }

        const savedDeletedReqs = localStorage.getItem('vikasa_deleted_request_ids');
        if (savedDeletedReqs) {
          try {
            const arr = JSON.parse(savedDeletedReqs);
            if (Array.isArray(arr)) this.deletedRequestIds = new Set(arr);
          } catch {}
        }

        const savedDeletedWorkers = localStorage.getItem('vikasa_deleted_worker_ids');
        if (savedDeletedWorkers) {
          try {
            const arr = JSON.parse(savedDeletedWorkers);
            if (Array.isArray(arr)) this.deletedWorkerIds = new Set(arr);
          } catch {}
        }

        const savedDeletedCusts = localStorage.getItem('vikasa_deleted_customer_ids');
        if (savedDeletedCusts) {
          try {
            const arr = JSON.parse(savedDeletedCusts);
            if (Array.isArray(arr)) this.deletedCustomerIds = new Set(arr);
          } catch {}
        }

        const savedReqs = localStorage.getItem('vikasa_requests');
        if (savedReqs) {
          const parsed: ServiceRequest[] = JSON.parse(savedReqs);
          const reqMap = new Map<string, ServiceRequest>();
          for (const r of parsed) {
            if (
              r &&
              r.id &&
              !this.deletedRequestIds.has(r.id) &&
              !(r.tracking_token && this.deletedRequestIds.has(r.tracking_token)) &&
              !(r.request_number && this.deletedRequestIds.has(String(r.request_number))) &&
              !reqMap.has(r.id)
            ) {
              reqMap.set(r.id, r);
            }
          }
          this.requests = Array.from(reqMap.values()).map((r, idx) => ({
            ...r,
            tracking_token: r.tracking_token || `e7b1a234-8c90-4d56-a123-456789abc${100 + idx}`,
          }));
        } else {
          this.requests = [];
        }

        const savedWorkers = localStorage.getItem('vikasa_workers');
        if (savedWorkers) {
          const parsed: Worker[] = JSON.parse(savedWorkers);
          const phoneMap = new Map<string, Worker>();
          for (const w of parsed) {
            if (!w || !w.id) continue;
            const cleanP = w.phone ? w.phone.replace(/\D/g, '').slice(-10) : '';
            if (
              this.deletedWorkerIds.has(w.id) ||
              (cleanP && this.deletedWorkerIds.has(cleanP)) ||
              (w.phone && this.deletedWorkerIds.has(w.phone)) ||
              (w.application_token && this.deletedWorkerIds.has(w.application_token))
            ) {
              continue;
            }
            const key = cleanP || w.id;
            if (key && !phoneMap.has(key)) {
              phoneMap.set(key, w);
            }
          }
          this.workers = Array.from(phoneMap.values());
        } else {
          this.workers = [];
        }

        const savedCustomers = localStorage.getItem('vikasa_customers');
        if (savedCustomers) {
          const parsed: Customer[] = JSON.parse(savedCustomers);
          const phoneMap = new Map<string, Customer>();
          for (const c of parsed) {
            if (!c || !c.id) continue;
            const cleanP = c.phone ? c.phone.replace(/\D/g, '').slice(-10) : '';
            if (
              this.deletedCustomerIds.has(c.id) ||
              (cleanP && this.deletedCustomerIds.has(cleanP)) ||
              (c.phone && this.deletedCustomerIds.has(c.phone))
            ) {
              continue;
            }
            const key = cleanP || c.id;
            if (key && !phoneMap.has(key)) {
              phoneMap.set(key, c);
            }
          }
          this.customers = Array.from(phoneMap.values());
        } else {
          this.customers = [];
        }

        const savedAttempts = localStorage.getItem('vikasa_attempts');
        if (savedAttempts) this.contactAttempts = JSON.parse(savedAttempts);

        const savedLogs = localStorage.getItem('vikasa_logs');
        if (savedLogs) this.auditLogs = JSON.parse(savedLogs);

        const savedNotifs = localStorage.getItem('vikasa_notifications');
        if (savedNotifs) this.notifications = JSON.parse(savedNotifs);

        const savedServices = localStorage.getItem('vikasa_custom_services');
        if (savedServices) {
          try {
            this.customServices = JSON.parse(savedServices);
          } catch {}
        }

        const savedCategories = localStorage.getItem('vikasa_custom_categories');
        if (savedCategories) {
          try {
            this.customCategories = JSON.parse(savedCategories);
          } catch {}
        }

        const savedContent = localStorage.getItem('vikasa_website_content');
        if (savedContent) {
          try {
            this.websiteContent = { ...DEFAULT_WEBSITE_CONTENT, ...JSON.parse(savedContent) };
          } catch {
            this.websiteContent = { ...DEFAULT_WEBSITE_CONTENT };
          }
        }
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
        localStorage.setItem('vikasa_notifications', JSON.stringify(this.notifications));
        localStorage.setItem('vikasa_custom_services', JSON.stringify(this.customServices));
        localStorage.setItem('vikasa_custom_categories', JSON.stringify(this.customCategories));
        localStorage.setItem('vikasa_deleted_request_ids', JSON.stringify(Array.from(this.deletedRequestIds)));
        localStorage.setItem('vikasa_deleted_worker_ids', JSON.stringify(Array.from(this.deletedWorkerIds)));
        localStorage.setItem('vikasa_deleted_customer_ids', JSON.stringify(Array.from(this.deletedCustomerIds)));
        localStorage.setItem('vikasa_website_content', JSON.stringify(this.websiteContent));
      } catch (e) {
        console.error('Failed to persist database state:', e);
      }
    }
  }

  setRequests(requests: ServiceRequest[]) {
    this.init();
    this.requests = [...requests]
      .filter(
        (r) =>
          r &&
          r.id &&
          !this.deletedRequestIds.has(r.id) &&
          !(r.tracking_token && this.deletedRequestIds.has(r.tracking_token)) &&
          !(r.request_number && this.deletedRequestIds.has(String(r.request_number)))
      )
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    for (const req of this.requests) {
      if (req.customer_name && req.customer_phone) {
        this.upsertCustomer({
          full_name: req.customer_name,
          phone: req.customer_phone,
          whatsapp: req.customer_whatsapp || req.customer_phone,
          district: req.district || 'Erode',
          address: req.formatted_address,
          latitude: req.latitude,
          longitude: req.longitude,
        });
      }
    }
    this.persist();
  }

  mergeRequests(incoming: ServiceRequest[]): ServiceRequest[] {
    this.init();
    const existingMap = new Map<string, ServiceRequest>();
    for (const r of this.requests) {
      if (
        r &&
        r.id &&
        !this.deletedRequestIds.has(r.id) &&
        !(r.tracking_token && this.deletedRequestIds.has(r.tracking_token)) &&
        !(r.request_number && this.deletedRequestIds.has(String(r.request_number)))
      ) {
        existingMap.set(r.id, r);
      }
    }
    for (const inc of incoming) {
      if (
        inc &&
        inc.id &&
        !this.deletedRequestIds.has(inc.id) &&
        !(inc.tracking_token && this.deletedRequestIds.has(inc.tracking_token)) &&
        !(inc.request_number && this.deletedRequestIds.has(String(inc.request_number)))
      ) {
        const prev = existingMap.get(inc.id);
        existingMap.set(inc.id, { ...prev, ...inc });

        // Auto-register customer profile for every request
        if (inc.customer_name && inc.customer_phone) {
          this.upsertCustomer({
            full_name: inc.customer_name,
            phone: inc.customer_phone,
            whatsapp: inc.customer_whatsapp || inc.customer_phone,
            district: inc.district || 'Erode',
            address: inc.formatted_address,
            latitude: inc.latitude,
            longitude: inc.longitude,
          });
        }
      }
    }
    this.requests = Array.from(existingMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    this.persist();
    return this.requests;
  }

  setWorkers(workers: Worker[]) {
    this.init();
    this.workers = workers.filter((w) => {
      if (!w || !w.id) return false;
      const cleanP = w.phone ? w.phone.replace(/\D/g, '').slice(-10) : '';
      return (
        !this.deletedWorkerIds.has(w.id) &&
        (!cleanP || !this.deletedWorkerIds.has(cleanP)) &&
        (!w.phone || !this.deletedWorkerIds.has(w.phone)) &&
        (!w.application_token || !this.deletedWorkerIds.has(w.application_token))
      );
    });
    this.persist();
  }

  mergeWorkers(incoming: Worker[]): Worker[] {
    this.init();
    const phoneMap = new Map<string, Worker>();

    // Index existing workers by clean phone (or id fallback)
    for (const w of this.workers) {
      if (!w) continue;
      const cleanP = w.phone ? w.phone.replace(/\D/g, '').slice(-10) : '';
      if (this.deletedWorkerIds.has(w.id) || (cleanP && this.deletedWorkerIds.has(cleanP)) || (w.phone && this.deletedWorkerIds.has(w.phone))) {
        continue;
      }
      const key = cleanP || w.id;
      if (key) phoneMap.set(key, w);
    }

    // Merge incoming workers by clean phone
    for (const inc of incoming) {
      if (!inc) continue;
      const cleanP = inc.phone ? inc.phone.replace(/\D/g, '').slice(-10) : '';
      if (this.deletedWorkerIds.has(inc.id) || (cleanP && this.deletedWorkerIds.has(cleanP)) || (inc.phone && this.deletedWorkerIds.has(inc.phone))) {
        continue;
      }
      const key = cleanP || inc.id;
      if (key) {
        const prev = phoneMap.get(key);
        phoneMap.set(key, { ...prev, ...inc, id: prev?.id || inc.id });
      }
    }

    this.workers = Array.from(phoneMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    this.persist();
    return this.workers;
  }

  setCustomers(customers: Customer[]) {
    this.init();
    const phoneMap = new Map<string, Customer>();
    for (const c of customers) {
      if (!c) continue;
      const cleanP = c.phone ? c.phone.replace(/\D/g, '').slice(-10) : '';
      const key = cleanP || c.id;
      if (key && !phoneMap.has(key)) {
        phoneMap.set(key, c);
      }
    }
    this.customers = Array.from(phoneMap.values());
    this.persist();
  }

  mergeCustomers(incoming: Customer[]): Customer[] {
    this.init();
    const phoneMap = new Map<string, Customer>();

    // 1. Index existing customers by clean phone
    for (const c of this.customers) {
      if (!c) continue;
      const cleanP = c.phone ? c.phone.replace(/\D/g, '').slice(-10) : '';
      const key = cleanP || c.id;
      if (key) phoneMap.set(key, c);
    }

    // 2. Merge incoming customers by clean phone
    for (const inc of incoming) {
      if (!inc) continue;
      const cleanP = inc.phone ? inc.phone.replace(/\D/g, '').slice(-10) : '';
      const key = cleanP || inc.id;
      if (key) {
        const prev = phoneMap.get(key);
        phoneMap.set(key, {
          id: prev?.id || inc.id,
          full_name: inc.full_name || prev?.full_name || 'Customer',
          phone: inc.phone || prev?.phone || '',
          whatsapp: inc.whatsapp || prev?.whatsapp || inc.phone || '',
          district: inc.district || prev?.district || 'Erode',
          address: inc.address || prev?.address || '',
          latitude: inc.latitude || prev?.latitude || ERODE_CENTER.lat,
          longitude: inc.longitude || prev?.longitude || ERODE_CENTER.lon,
          created_at: prev?.created_at || inc.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }

    this.customers = Array.from(phoneMap.values());
    this.persist();
    return this.customers;
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
      const cClean = c.phone ? c.phone.replace(/\D/g, '').slice(-10) : '';
      return cClean === cleanPhone;
    });

    if (existing) {
      existing.full_name = data.full_name || existing.full_name;
      existing.phone = cleanPhone || existing.phone;
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
      id: cleanPhone ? `cust-${cleanPhone}` : `cust-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      full_name: data.full_name.trim(),
      phone: cleanPhone || data.phone.trim(),
      whatsapp: data.whatsapp ? (data.whatsapp.replace(/\D/g, '').slice(-10) || data.whatsapp.trim()) : (cleanPhone || data.phone.trim()),
      district: data.district || 'Erode',
      address: data.address || '',
      latitude: data.latitude || ERODE_CENTER.lat,
      longitude: data.longitude || ERODE_CENTER.lon,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.customers.unshift(newCustomer);
    this.persist();
    return newCustomer;
  }

  getCustomers(filters?: { search?: string; district?: string; service?: string }): Array<Customer & { totalRequests: number; latestService?: string; latestStatus?: RequestStatus }> {
    this.init();

    // 1. Strict deduplication pass over existing customers by clean phone
    const uniqueMap = new Map<string, Customer>();
    for (const c of this.customers) {
      if (!c || !c.id) continue;
      const cleanP = c.phone ? c.phone.replace(/\D/g, '').slice(-10) : '';
      if (
        this.deletedCustomerIds.has(c.id) ||
        (cleanP && this.deletedCustomerIds.has(cleanP)) ||
        (c.phone && this.deletedCustomerIds.has(c.phone))
      ) {
        continue;
      }
      const key = cleanP || c.id;
      if (key && !uniqueMap.has(key)) {
        uniqueMap.set(key, c);
      }
    }

    // 2. Synthesize missing customer profiles from requests
    let changed = uniqueMap.size !== this.customers.length;
    for (const req of this.requests) {
      if (!req.customer_phone) continue;
      const cleanP = req.customer_phone.replace(/\D/g, '').slice(-10);
      if (
        cleanP &&
        !uniqueMap.has(cleanP) &&
        !this.deletedCustomerIds.has(cleanP) &&
        (!req.customer_id || !this.deletedCustomerIds.has(req.customer_id)) &&
        !this.deletedCustomerIds.has(req.customer_phone)
      ) {
        uniqueMap.set(cleanP, {
          id: req.customer_id || `cust-${cleanP}`,
          full_name: req.customer_name || 'Customer',
          phone: req.customer_phone,
          whatsapp: req.customer_whatsapp || req.customer_phone,
          district: req.district || 'Erode',
          address: req.formatted_address || '',
          latitude: req.latitude || ERODE_CENTER.lat,
          longitude: req.longitude || ERODE_CENTER.lon,
          created_at: req.created_at || new Date().toISOString(),
          updated_at: req.updated_at || new Date().toISOString(),
        });
        changed = true;
      }
    }

    if (changed) {
      this.customers = Array.from(uniqueMap.values());
      // In-memory update only during read queries to prevent re-entrant event loops
    }

    let result = Array.from(uniqueMap.values());

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
    const cleanId = id.replace(/\D/g, '').slice(-10);
    if (this.deletedCustomerIds.has(id) || (cleanId && this.deletedCustomerIds.has(cleanId))) {
      return null;
    }

    const customer =
      this.customers.find((c) => {
        const cClean = c.phone ? c.phone.replace(/\D/g, '').slice(-10) : '';
        return c.id === id || (Boolean(cleanId) && cClean === cleanId);
      }) ||
      this.getCustomers().find((c) => {
        const cClean = c.phone ? c.phone.replace(/\D/g, '').slice(-10) : '';
        return c.id === id || (Boolean(cleanId) && cClean === cleanId);
      });

    if (!customer) return null;

    const cleanPhone = customer.phone.replace(/\D/g, '').slice(-10);
    const requests = this.requests.filter(
      (r) => r.customer_id === customer.id || r.customer_phone.replace(/\D/g, '').slice(-10) === cleanPhone
    );

    return { customer, requests };
  }

  deleteCustomer(id: string): boolean {
    this.init();
    const cleanId = id.replace(/\D/g, '').slice(-10);
    const initialLen = this.customers.length;
    this.deletedCustomerIds.add(id);
    if (cleanId) this.deletedCustomerIds.add(cleanId);

    const targetCustomer = this.customers.find((c) => {
      const cClean = c.phone ? c.phone.replace(/\D/g, '').slice(-10) : '';
      return c.id === id || (Boolean(cleanId) && cClean === cleanId);
    });
    if (targetCustomer?.phone) {
      this.deletedCustomerIds.add(targetCustomer.phone);
    }

    this.customers = this.customers.filter((c) => {
      const cClean = c.phone ? c.phone.replace(/\D/g, '').slice(-10) : '';
      return c.id !== id && (!cleanId || cClean !== cleanId) && !this.deletedCustomerIds.has(c.id);
    });
    // Also remove requests associated with this customer
    this.requests = this.requests.filter((r) => {
      const rClean = r.customer_phone ? r.customer_phone.replace(/\D/g, '').slice(-10) : '';
      return r.customer_id !== id && (!cleanId || rClean !== cleanId);
    });
    this.persist();
    return this.customers.length !== initialLen;
  }

  deleteRequest(id: string): boolean {
    this.init();
    const initialLen = this.requests.length;
    const target = this.requests.find(
      (r) => r.id === id || r.tracking_token === id || String(r.request_number) === id
    );
    if (target) {
      this.deletedRequestIds.add(target.id);
      if (target.tracking_token) this.deletedRequestIds.add(target.tracking_token);
      if (target.request_number) this.deletedRequestIds.add(String(target.request_number));
    }
    this.deletedRequestIds.add(id);

    this.requests = this.requests.filter(
      (r) =>
        r.id !== id &&
        r.tracking_token !== id &&
        String(r.request_number) !== id &&
        !this.deletedRequestIds.has(r.id) &&
        !(r.tracking_token && this.deletedRequestIds.has(r.tracking_token)) &&
        !(r.request_number && this.deletedRequestIds.has(String(r.request_number)))
    );
    this.contactAttempts = this.contactAttempts.filter((a) => a.request_id !== id);
    const changed = this.requests.length !== initialLen;
    this.persist();
    return changed;
  }

  // --- Requests ---
  getRequests(statusFilter?: RequestStatus): ServiceRequest[] {
    this.init();
    const valid = this.requests.filter(
      (r) =>
        !this.deletedRequestIds.has(r.id) &&
        !(r.tracking_token && this.deletedRequestIds.has(r.tracking_token)) &&
        !(r.request_number && this.deletedRequestIds.has(String(r.request_number)))
    );
    if (statusFilter) {
      return valid.filter((r) => r.status === statusFilter);
    }
    return [...valid].sort(
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
    const cleanToken = token.trim();
    const cleanLower = cleanToken.toLowerCase();

    // IDOR Prevention: Only accept the confidential random UUID tracking token
    // Sequential request numbers (e.g. "1001") and internal IDs ("req-1001") are strictly rejected
    if (/^\d+$/.test(cleanToken) || cleanLower.startsWith('req-') || cleanToken.length < 16) {
      return null;
    }

    const req = this.requests.find((r) => {
      if (r.tracking_token && r.tracking_token.toLowerCase() === cleanLower) return true;
      return false;
    });

    if (!req) return null;

    return {
      request_number: req.request_number,
      service_name: req.service_name,
      category_name: req.category_name,
      status: req.status,
      preferred_date: req.preferred_date,
      preferred_time_slot: req.preferred_time_slot,
      district: req.district || 'Erode',
      general_area: req.formatted_address ? req.formatted_address.split(',')[0]?.trim() : (req.district || 'Erode'),
      created_at: req.created_at,
      assigned_worker_first_name: req.assigned_worker_name ? req.assigned_worker_name.split(' ')[0] : undefined,
    };
  }

  createRequest(
    data: Omit<ServiceRequest, 'id' | 'request_number' | 'tracking_token' | 'created_at' | 'updated_at' | 'customer_id'> & {
      customer_id?: string;
    }
  ): ServiceRequest {
    this.init();
    // 1. Permanently upsert customer
    const permanentCustomer = this.upsertCustomer({
      full_name: data.customer_name,
      phone: data.customer_phone,
      whatsapp: data.customer_whatsapp || data.customer_phone,
      district: data.district || 'Erode',
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
      customer_phone: permanentCustomer.phone,
      customer_whatsapp: permanentCustomer.whatsapp || permanentCustomer.phone,
      district: data.district || 'Erode',
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

    if (!req) {
      throw new Error('Service request not found');
    }
    if (!worker) {
      throw new Error('Technician not found');
    }

    if (req.status === 'ASSIGNED' || req.assigned_worker_id) {
      throw new Error(`Request #${req.request_number} already has an assigned technician (${req.assigned_worker_name || req.assigned_worker_id})`);
    }

    if (worker.verification_status !== 'verified') {
      worker.verification_status = 'verified';
      worker.updated_at = new Date().toISOString();
      this.addAuditLog('WORKER_VERIFIED_ON_ASSIGN', 'worker', worker.id, {
        assigned_by: 'admin-1',
        notes: 'Auto-verified by administrator on assignment dispatch',
      });
    }

    if (worker.availability === 'busy') {
      throw new Error(`Technician ${worker.full_name} is currently busy with another active job`);
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

  completeJob(requestId: string, notes?: string): void {
    this.init();
    const req = this.getRequestById(requestId);
    if (!req) return;

    const now = new Date().toISOString();
    req.status = 'COMPLETED';
    req.completed_at = now;
    req.updated_at = now;
    if (notes) {
      req.admin_notes = req.admin_notes ? `${req.admin_notes}\n[Completed] ${notes}` : `[Completed] ${notes}`;
    }

    if (req.assigned_worker_id) {
      const worker = this.getWorkerById(req.assigned_worker_id);
      if (worker) {
        worker.availability = 'available';
        worker.updated_at = new Date().toISOString();
      }
    }

    this.addAuditLog('JOB_COMPLETED', 'service_request', requestId, {
      completed_at: now,
    });

    this.persist();
  }

  cancelRequest(
    requestId: string,
    reason?: string,
    status: 'CANCELLED' | 'CUSTOMER_CANCELLED' = 'CUSTOMER_CANCELLED'
  ): void {
    this.init();
    const req = this.getRequestById(requestId);
    if (!req) return;

    req.status = status;
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
    let result = this.workers.filter((w) => {
      if (!w || !w.id) return false;
      const cleanP = w.phone ? w.phone.replace(/\D/g, '').slice(-10) : '';
      return (
        !this.deletedWorkerIds.has(w.id) &&
        (!cleanP || !this.deletedWorkerIds.has(cleanP)) &&
        (!w.phone || !this.deletedWorkerIds.has(w.phone)) &&
        (!w.application_token || !this.deletedWorkerIds.has(w.application_token))
      );
    });

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
    if (!id || this.deletedWorkerIds.has(id)) return undefined;
    return this.workers.find((w) => {
      const cleanP = w.phone ? w.phone.replace(/\D/g, '').slice(-10) : '';
      if (
        this.deletedWorkerIds.has(w.id) ||
        (cleanP && this.deletedWorkerIds.has(cleanP)) ||
        (w.phone && this.deletedWorkerIds.has(w.phone)) ||
        (w.application_token && this.deletedWorkerIds.has(w.application_token))
      ) {
        return false;
      }
      return (
        w.id === id ||
        w.application_token === id ||
        (Boolean(cleanP) && cleanP === id.replace(/\D/g, '').slice(-10))
      );
    });
  }

  getRequestsForWorker(workerId: string): ServiceRequest[] {
    this.init();
    return this.requests.filter((r) => r.assigned_worker_id === workerId);
  }

  registerWorker(data: Omit<Worker, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Worker {
    this.init();
    const newWorker: Worker = {
      ...data,
      id: data.id || `w-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      application_token: data.application_token || `app-tok-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      whatsapp: data.whatsapp || data.phone,
      active_status: data.active_status || 'active',
      district: data.district || 'Erode',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.workers.unshift(newWorker);
    this.persist();
    return newWorker;
  }

  validateWorkerCall(id: string, notes?: string): Worker | undefined {
    this.init();
    const worker = this.workers.find((w) => w.id === id);
    if (!worker) return undefined;
    worker.call_validated = true;
    worker.call_validated_at = new Date().toISOString();
    if (notes) worker.call_notes = notes;
    worker.updated_at = new Date().toISOString();
    this.addAuditLog('WORKER_CALL_VALIDATED', 'worker', id, { notes });
    this.persist();
    return worker;
  }

  verifyWorker(id: string, verifiedBy = 'admin-1', notes?: string): Worker | undefined {
    this.init();
    const worker = this.workers.find((w) => w.id === id);
    if (!worker) return undefined;
    worker.call_validated = true;
    worker.verification_status = 'verified';
    worker.verified_at = new Date().toISOString();
    worker.verified_by = verifiedBy;
    if (notes) worker.verification_notes = notes;
    worker.updated_at = new Date().toISOString();
    this.addAuditLog('WORKER_VERIFIED', 'worker', id, { verifiedBy, notes });
    this.persist();
    return worker;
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

  deleteWorker(id: string): boolean {
    this.init();
    const target = this.workers.find((w) => w.id === id);
    if (target) {
      this.deletedWorkerIds.add(target.id);
      if (target.phone) this.deletedWorkerIds.add(target.phone);
      const cleanP = target.phone ? target.phone.replace(/\D/g, '').slice(-10) : '';
      if (cleanP) this.deletedWorkerIds.add(cleanP);
      if (target.application_token) this.deletedWorkerIds.add(target.application_token);
    }
    this.deletedWorkerIds.add(id);

    const index = this.workers.findIndex((w) => w.id === id);
    if (index !== -1) {
      this.workers.splice(index, 1);
      // Unassign worker from any active requests
      for (const r of this.requests) {
        if (r.assigned_worker_id === id) {
          r.assigned_worker_id = undefined;
          r.assigned_worker_name = undefined;
          r.assigned_worker_phone = undefined;
          if (r.status === 'ASSIGNED' || r.status === 'WORKER_ACCEPTED') {
            r.status = 'CUSTOMER_CONFIRMED';
          }
        }
      }
      this.persist();
      return true;
    }
    this.persist();
    return false;
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

  // --- Website Content (CMS) ---
  getWebsiteContent(): WebsiteContent {
    this.init();
    return { ...this.websiteContent };
  }

  updateWebsiteContent(partial: Partial<WebsiteContent>): WebsiteContent {
    this.init();
    this.websiteContent = {
      ...this.websiteContent,
      ...partial,
      hero: { ...this.websiteContent.hero, ...(partial.hero || {}) },
      contact: { ...this.websiteContent.contact, ...(partial.contact || {}) },
      about: { ...this.websiteContent.about, ...(partial.about || {}) },
    };
    this.addAuditLog('UPDATE_WEBSITE_CONTENT', 'website_content', 'global');
    this.persist();
    return { ...this.websiteContent };
  }

  // --- Notifications Center ---
  getNotifications(): AdminNotification[] {
    this.init();
    return [...this.notifications].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  mergeNotifications(incoming: AdminNotification[]): AdminNotification[] {
    this.init();
    const existingMap = new Map<string, AdminNotification>();
    for (const n of this.notifications) {
      if (n && n.id) {
        existingMap.set(n.id, n);
      }
    }
    for (const inc of incoming) {
      if (!inc || !inc.id) continue;
      const existing = existingMap.get(inc.id);
      if (existing) {
        existing.is_read = inc.is_read ?? existing.is_read;
        existing.title = inc.title || existing.title;
        existing.message = inc.message || existing.message;
      } else {
        existingMap.set(inc.id, {
          id: inc.id,
          type: inc.type,
          title: inc.title,
          message: inc.message,
          related_id: inc.related_id,
          related_type: inc.related_type,
          is_read: Boolean(inc.is_read),
          created_at: inc.created_at || new Date().toISOString(),
        });
      }
    }
    this.notifications = Array.from(existingMap.values())
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 100);
    this.persist();
    return this.notifications;
  }

  addNotification(notif: Omit<AdminNotification, 'id' | 'created_at' | 'is_read'> & { id?: string }): AdminNotification {
    this.init();
    const deterministicId = notif.id || (
      notif.related_id
        ? `notif-${notif.type}-${notif.related_id}`
        : `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    );

    // Deduplication check: if notification for this ID or (type, related_id) already exists, update & return without duplicates
    const existing = this.notifications.find(
      (n) => n.id === deterministicId || (notif.related_id && n.type === notif.type && n.related_id === notif.related_id)
    );
    if (existing) {
      existing.title = notif.title || existing.title;
      existing.message = notif.message || existing.message;
      return existing;
    }

    const newNotif: AdminNotification = {
      id: deterministicId,
      ...notif,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    this.notifications.unshift(newNotif);
    // Keep max 100 notifications in memory
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }
    this.persist();
    return newNotif;
  }

  markNotificationAsRead(id: string): boolean {
    this.init();
    const target = this.notifications.find((n) => n.id === id);
    if (target) {
      target.is_read = true;
      this.persist();
      return true;
    }
    return false;
  }

  markAllNotificationsAsRead() {
    this.init();
    for (const n of this.notifications) {
      n.is_read = true;
    }
    this.persist();
  }

  deleteNotification(id: string): boolean {
    this.init();
    const prevLen = this.notifications.length;
    this.notifications = this.notifications.filter((n) => n.id !== id);
    if (this.notifications.length !== prevLen) {
      this.persist();
      return true;
    }
    return false;
  }

  // --- FCM Device Tokens (Deprecated & Removed) ---
  getDeviceTokens(): AdminDeviceToken[] {
    return [];
  }

  registerDeviceToken(tokenData: Omit<AdminDeviceToken, 'id' | 'created_at' | 'updated_at'>): AdminDeviceToken {
    return {
      id: `tok-deprecated`,
      ...tokenData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  removeDeviceToken(_fcmToken: string): boolean {
    return true;
  }

  resetDemoData() {
    this.requests = [...SEED_REQUESTS];
    this.workers = [...SEED_WORKERS];
    this.customers = [...SEED_CUSTOMERS];
    this.contactAttempts = [];
    this.auditLogs = [];
    this.persist();
  }

  clearAllOperationalData() {
    this.requests = [];
    this.workers = [];
    this.customers = [];
    this.contactAttempts = [];
    this.auditLogs = [];
    this.notifications = [];
    this.persist();
  }

  // --- Dynamic Service Management ---
  getAllServices(): (ServiceItem & { price_estimate?: string })[] {
    this.init();

    // Standard base services
    const standardDescriptions: Record<string, string> = {
      'Interior Design': 'Modular kitchens, false ceiling, wardrobes, woodwork & 3D planning',
      'Carpentry & Plywood Work': 'Door locks, hinges, wood furniture repairs, custom fittings',
      'Painting & Wall Finish': 'Interior touch-up, wall crack repair, full house repaint & putty',
      'Electrical & Lighting': 'Switchboards, MCB, ceiling fans, lighting, wiring & safety checks',
      'Plumbing': 'Taps, pipe leaks, flush tanks, water tank fittings & motor repair',
      'AC & Appliances': 'AC jet cleaning, gas charging, cooling faults & domestic appliance repair',
      'Cleaning': 'Bathroom deep clean, water tank cleaning & comprehensive sanitization',
      'Other Services': 'Custom specialized home requirements and on-demand repairs',
    };

    const standard: (ServiceItem & { price_estimate?: string })[] = STANDARDIZED_SERVICES.map((s, idx) => ({
      id: s.id,
      category_id: s.slug || 'cat-general',
      name: s.name,
      slug: s.slug,
      description: standardDescriptions[s.name] || `${s.name} doorstep service`,
      price_estimate: s.id === 'srv-interior' ? 'Free Consultation' : 'From ₹199',
      is_active: s.active !== false,
      sort_order: idx + 1,
      created_at: '2026-01-01T00:00:00.000Z',
    }));

    // Merge custom services (custom services take priority or append)
    const customMap = new Map<string, ServiceItem & { price_estimate?: string }>();
    for (const cs of this.customServices) {
      customMap.set(cs.id, cs);
      customMap.set(cs.name.toLowerCase(), cs);
    }

    const merged: (ServiceItem & { price_estimate?: string })[] = [];
    for (const std of standard) {
      if (customMap.has(std.id)) {
        merged.push(customMap.get(std.id)!);
      } else if (customMap.has(std.name.toLowerCase())) {
        merged.push(customMap.get(std.name.toLowerCase())!);
      } else {
        merged.push(std);
      }
    }

    for (const cs of this.customServices) {
      if (!merged.some((m) => m.id === cs.id || m.name.toLowerCase() === cs.name.toLowerCase())) {
        merged.push(cs);
      }
    }

    return merged;
  }

  addCustomService(serviceData: {
    id?: string;
    name: string;
    category_id?: string;
    description?: string;
    price_estimate?: string;
    is_active?: boolean;
    sort_order?: number;
  }): ServiceItem & { price_estimate?: string } {
    this.init();
    const cleanName = serviceData.name.trim();
    const cleanSlug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newService: ServiceItem & { price_estimate?: string } = {
      id: serviceData.id || `srv-${cleanSlug}-${Date.now().toString().slice(-4)}`,
      category_id: serviceData.category_id || 'cat-other',
      name: cleanName,
      slug: cleanSlug,
      description: serviceData.description?.trim() || `${cleanName} professional doorstep service`,
      price_estimate: serviceData.price_estimate?.trim() || 'Custom Quote',
      is_active: serviceData.is_active !== false,
      sort_order: serviceData.sort_order || this.customServices.length + 10,
      created_at: new Date().toISOString(),
    };

    // Remove existing if replacing by ID or name
    this.customServices = this.customServices.filter(
      (s) => s.id !== newService.id && s.name.toLowerCase() !== newService.name.toLowerCase()
    );
    this.customServices.push(newService);
    this.persist();

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vikasa_services_updated', { detail: newService }));
    }

    return newService;
  }

  deleteCustomService(id: string): boolean {
    this.init();
    const prevLen = this.customServices.length;
    this.customServices = this.customServices.filter((s) => s.id !== id);
    const changed = this.customServices.length !== prevLen;
    if (changed) {
      this.persist();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('vikasa_services_updated'));
      }
    }
    return changed;
  }

  // --- Dynamic Category Management ---
  getAllCategories(): ServiceCategory[] {
    this.init();
    const catMap = new Map<string, ServiceCategory>();
    // 1. Baseline categories
    for (const c of INITIAL_CATEGORIES) {
      catMap.set(c.id, c);
    }
    // 2. Custom categories (override or append)
    for (const cc of this.customCategories) {
      catMap.set(cc.id, cc);
    }
    return Array.from(catMap.values()).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }

  addCustomCategory(catData: {
    id?: string;
    name: string;
    slug?: string;
    icon?: string;
    description?: string;
    is_active?: boolean;
    sort_order?: number;
  }): ServiceCategory {
    this.init();
    const cleanName = catData.name.trim();
    const cleanSlug = (catData.slug || cleanName).toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const newCat: ServiceCategory = {
      id: catData.id || `cat-${cleanSlug}`,
      name: cleanName,
      slug: cleanSlug,
      icon: catData.icon || 'Layers',
      description: catData.description?.trim() || `${cleanName} home services`,
      is_active: catData.is_active !== false,
      sort_order: catData.sort_order || this.getAllCategories().length + 1,
      created_at: new Date().toISOString(),
    };

    // Remove existing if replacing by ID or name
    this.customCategories = this.customCategories.filter(
      (c) => c.id !== newCat.id && c.name.toLowerCase() !== newCat.name.toLowerCase()
    );
    this.customCategories.push(newCat);
    this.persist();

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vikasa_categories_updated', { detail: newCat }));
    }

    return newCat;
  }

  deleteCustomCategory(id: string): boolean {
    this.init();
    const prevLen = this.customCategories.length;
    this.customCategories = this.customCategories.filter((c) => c.id !== id);
    const changed = this.customCategories.length !== prevLen;
    if (changed) {
      this.persist();
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('vikasa_categories_updated'));
      }
    }
    return changed;
  }
}

export const dataStore = new VikasaDataStore();
