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

        const savedReqs = localStorage.getItem('vikasa_requests');
        if (savedReqs) {
          const parsed: ServiceRequest[] = JSON.parse(savedReqs);
          this.requests = parsed.map((r, idx) => ({
            ...r,
            tracking_token: r.tracking_token || `e7b1a234-8c90-4d56-a123-456789abc${100 + idx}`,
          }));
        } else {
          this.requests = [];
        }

        const savedWorkers = localStorage.getItem('vikasa_workers');
        if (savedWorkers) {
          this.workers = JSON.parse(savedWorkers);
        } else {
          this.workers = [];
        }

        const savedCustomers = localStorage.getItem('vikasa_customers');
        if (savedCustomers) {
          this.customers = JSON.parse(savedCustomers);
        } else {
          this.customers = [];
        }

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
        window.dispatchEvent(new Event('vikasa_data_updated'));
      } catch (e) {
        console.error('Failed to persist database state:', e);
      }
    }
  }

  setRequests(requests: ServiceRequest[]) {
    this.init();
    this.requests = [...requests].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    this.persist();
  }

  mergeRequests(incoming: ServiceRequest[]): ServiceRequest[] {
    this.init();
    const existingMap = new Map<string, ServiceRequest>();
    for (const r of this.requests) {
      if (r && r.id) existingMap.set(r.id, r);
    }
    for (const inc of incoming) {
      if (inc && inc.id) {
        const prev = existingMap.get(inc.id);
        existingMap.set(inc.id, { ...prev, ...inc });
      }
    }
    this.requests = Array.from(existingMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    this.persist();
    return this.requests;
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
      general_area: req.formatted_address ? req.formatted_address.split(',')[0]?.trim() : (req.district || 'Salem'),
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
      throw new Error(`Technician ${worker.full_name} is not verified for dispatch`);
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

  registerWorker(data: Omit<Worker, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Worker {
    this.init();
    const newWorker: Worker = {
      ...data,
      id: data.id || `w-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
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

  verifyWorker(id: string, verifiedBy = 'admin-1', notes?: string): Worker | undefined {
    this.init();
    const worker = this.workers.find((w) => w.id === id);
    if (!worker) return undefined;
    worker.verification_status = 'verified';
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
    const index = this.workers.findIndex((w) => w.id === id);
    if (index !== -1) {
      this.workers.splice(index, 1);
      this.persist();
      return true;
    }
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
    this.persist();
  }
}

export const dataStore = new VikasaDataStore();
