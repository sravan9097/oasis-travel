// Database types (generated from Supabase schema)

export interface Profile {
  id: string;
  role: 'customer' | 'operator' | 'vendor' | 'driver' | 'admin';
  display_name: string;
  phone: string | null;
  email: string | null;
  home_city: string | null;
  lang: string;
  created_at: string;
}

export interface Vendor {
  id: string;
  owner_id: string | null;
  type: 'hotel' | 'cab' | 'activity' | 'guide';
  name: string;
  gstin: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  sla_hours: number;
  active: boolean;
  created_at: string;
}

export interface Driver {
  id: string;
  vendor_id: string;
  name: string;
  phone: string | null;
  vehicle_type: string | null;
  vehicle_number: string | null;
  active: boolean;
  created_at: string;
}

export interface Lead {
  id: string;
  customer_id: string | null;
  guest_session_id: string | null;
  source: string | null;
  stage: 'NEW' | 'SCOPING' | 'QUOTED' | 'WON' | 'LOST';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RequestDoc {
  id: string;
  lead_id: string;
  origin_city: string | null;
  destinations: string[];
  start_date: string | null;
  end_date: string | null;
  nights: number | null;
  pax_adults: number;
  pax_children: number;
  pax_seniors: number;
  budget_min: number | null;
  budget_max: number | null;
  hotel_class: string | null;
  cab_type: string | null;
  interests: string[] | null;
  pace: string | null;
  language: string | null;
  special_needs: string | null;
  capture_mode: string | null;
  created_at: string;
}

export interface RatePlan {
  id: string;
  vendor_id: string;
  title: string | null;
  season_start: string | null;
  season_end: string | null;
  weekday_price: number | null;
  weekend_price: number | null;
  surcharge_json: any;
  blackout_dates: string[] | null;
  created_at: string;
}

export interface Quote {
  id: string;
  lead_id: string;
  version: number;
  parent_quote_id: string | null;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'DECLINED' | 'ARCHIVED';
  total_amount: number;
  currency: string;
  inclusions: string | null;
  exclusions: string | null;
  validity_date: string | null;
  pdf_url: string | null;
  snapshot: any;
  created_by: string | null;
  created_at: string;
}

export interface QuoteItem {
  id: string;
  quote_id: string;
  day_no: number | null;
  item_type: 'hotel' | 'cab' | 'activity' | 'misc';
  vendor_id: string | null;
  description: string;
  qty: number;
  unit_price: number;
  meta: any;
}

export interface Booking {
  id: string;
  quote_id: string;
  customer_id: string;
  status: 'PENDING_VENDOR_CONFIRM' | 'CONFIRMED' | 'IN_TRIP' | 'COMPLETED' | 'CANCELLED';
  price_snapshot: any;
  created_at: string;
}

export interface PO {
  id: string;
  booking_id: string;
  vendor_id: string;
  items: any;
  status: 'SENT' | 'ACCEPTED' | 'CONFIRMED' | 'DECLINED';
  due_at: string | null;
  messages: any[];
  created_at: string;
}

export interface Voucher {
  id: string;
  booking_id: string;
  vendor_id: string;
  file_url: string;
  meta: any | null;
  verified: boolean;
  created_at: string;
}

export interface Trip {
  id: string;
  booking_id: string;
  title: string | null;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

export interface TripMember {
  trip_id: string;
  user_id: string;
  role: 'customer' | 'operator' | 'vendor' | 'driver';
  display_name: string;
}

export interface TripPost {
  id: string;
  trip_id: string;
  kind: 'announcement' | 'itinerary' | 'voucher' | 'reminder';
  content: any;
  scheduled_at: string | null;
  posted_at: string | null;
  status: 'SCHEDULED' | 'POSTED' | 'CANCELLED';
  quick_actions: any[];
  created_at?: string;
}

export interface TripPostAck {
  id: string;
  post_id: string;
  user_id: string;
  action_id: string;
  payload: any | null;
  created_at: string;
}

export interface DriverAssignment {
  id: string;
  trip_id: string;
  day_no: number | null;
  driver_id: string | null;
  pickup_time: string | null;
  pickup_location: string | null;
  vehicle_note: string | null;
  created_at: string;
}

export interface Incident {
  id: string;
  trip_id: string;
  created_by: string;
  severity: 'P0' | 'P1' | 'P2';
  category: string | null;
  description: string;
  status: 'OPEN' | 'ACK' | 'RESOLVED' | 'CANCELLED';
  created_at: string;
}

export interface Cancellation {
  id: string;
  booking_id: string;
  requested_by: string;
  reason: string | null;
  policy_snapshot: any | null;
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'FINALIZED';
  created_at: string;
}

export interface AdminSetting {
  key: string;
  value: any;
  updated_at: string;
}

export interface AuditLog {
  id: number;
  actor: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  before: any | null;
  after: any | null;
  created_at: string;
}

