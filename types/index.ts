export type UserRole = 'customer' | 'worker' | 'admin' | 'super_admin';

export type WorkerStatus = 'pending_verification' | 'verified' | 'rejected' | 'suspended' | 'inactive';

export type WorkerAvailability = 'available' | 'busy' | 'offline' | 'temporarily_unavailable';

export type RequestStatus =
  | 'NEW'
  | 'CUSTOMER_TO_CALL'
  | 'CUSTOMER_CONFIRMED'
  | 'MATCHING'
  | 'WORKER_CONTACTING'
  | 'WORKER_ACCEPTED'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CUSTOMER_CANCELLED'
  | 'NO_WORKER_AVAILABLE'
  | 'CANCELLED';

export type UrgencyLevel = 'low' | 'medium' | 'high' | 'emergency';

export type ContactResult = 'accepted' | 'rejected' | 'no_answer' | 'busy' | 'call_later';

export type LeadSource = 'META' | 'ORGANIC' | 'DIRECT' | 'REFERRAL' | 'OTHER';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  phone: string;
  email?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface ServiceItem {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface ServiceAlias {
  id: string;
  service_id: string;
  alias: string;
}

export interface Worker {
  id: string;
  full_name: string;
  phone: string;
  email?: string;
  avatar_url?: string;
  experience_years: number;
  skills: string[];
  bio?: string;
  verification_status: WorkerStatus;
  verified_at?: string;
  verified_by?: string;
  verification_notes?: string;
  availability: WorkerAvailability;
  
  // Location
  base_location_name: string;
  latitude: number;
  longitude: number;
  service_radius_km: number;
  service_area_names: string[];
  
  id_document_url?: string;
  service_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  user_id?: string;
  full_name: string;
  phone: string;
  email?: string;
  created_at: string;
}

export interface ServiceRequest {
  id: string;
  request_number: number;
  customer_id: string;
  customer_name: string;
  customer_phone: string; // Visible only to admin, hidden in customer/worker views
  customer_email?: string;
  
  category_id: string;
  category_name: string;
  service_id: string;
  service_name: string;
  description: string;
  
  formatted_address: string;
  latitude: number;
  longitude: number;
  location_accuracy?: number;
  
  urgency: UrgencyLevel;
  preferred_date?: string;
  preferred_time_slot?: string;
  photo_urls?: string[];
  
  status: RequestStatus;
  customer_confirmed: boolean;
  customer_confirmed_at?: string;
  
  // Marketing Attribution
  source: LeadSource;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  landing_page?: string;
  referrer?: string;
  
  admin_notes?: string;
  assigned_worker_id?: string;
  assigned_worker_name?: string;
  
  tracking_token: string; // Secure non-enumerable UUID for customer tracking
  
  created_at: string;
  updated_at: string;
}

export interface WorkerContactAttempt {
  id: string;
  request_id: string;
  worker_id: string;
  worker_name: string;
  worker_phone: string;
  operator_id: string;
  operator_name: string;
  attempt_number: number;
  result: ContactResult;
  notes?: string;
  created_at: string;
}

export interface Assignment {
  id: string;
  request_id: string;
  worker_id: string;
  worker_name: string;
  assigned_by: string;
  assigned_by_name: string;
  assigned_at: string;
  completed_at?: string;
  cancelled_at?: string;
  status: 'active' | 'completed' | 'cancelled';
  notes?: string;
}

export interface MatchedWorker {
  worker_id: string;
  full_name: string;
  phone: string; // Visible to admin only
  avatar_url?: string;
  experience_years: number;
  verification_status: WorkerStatus;
  availability: WorkerAvailability;
  distance_km: number;
  is_exact_service: boolean;
  service_radius_km: number;
  base_location_name: string;
  match_category: 'Nearby (0-3 km)' | 'Near (3-7 km)' | 'Far (7-15+ km)';
  skills: string[];
  has_been_contacted: boolean;
  last_contact_result?: ContactResult;
  latitude: number;
  longitude: number;
}

export interface PublicTrackingData {
  request_number: number;
  service_name: string;
  category_name: string;
  status: RequestStatus;
  preferred_date?: string;
  preferred_time_slot?: string;
  general_area: string;
  created_at: string;
  assigned_worker_first_name?: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_name?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}
