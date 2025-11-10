import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { RequestDocMinimalSchema, IncidentCreateSchema } from './contracts';
import type {
  Lead,
  Quote,
  QuoteItem,
  Booking,
  Trip,
  TripPost,
  Incident,
  RequestDoc,
  PO,
  Voucher,
  TripMember,
  Profile,
  Vendor,
  RatePlan,
} from './types';

let supabase: SupabaseClient;

/**
 * Initialize Supabase client
 */
export const initSupabase = (url: string, key: string): SupabaseClient => {
  supabase = createClient(url, key);
  return supabase;
};

/**
 * Get Supabase client instance
 */
export const getSupabase = (): SupabaseClient => {
  if (!supabase) {
    throw new Error('Supabase not initialized. Call initSupabase() first.');
  }
  return supabase;
};

// ======================
// RPC WRAPPERS
// ======================

/**
 * Create lead from guest session
 */
export const rpcCreateLeadFromGuest = async (
  guestSessionId: string,
  minimalRequest: unknown
): Promise<string> => {
  const validated = RequestDocMinimalSchema.parse(minimalRequest);

  const { data, error } = await supabase.rpc('rpc_create_lead_from_guest', {
    p_guest_session_id: guestSessionId,
    p_minimal_request: validated,
  });

  if (error) throw error;
  return data as string; // lead_id
};

/**
 * Merge guest session to authenticated user
 */
export const rpcMergeGuestToUser = async (guestSessionId: string): Promise<void> => {
  const { error } = await supabase.rpc('rpc_merge_guest_to_user', {
    p_guest_session_id: guestSessionId,
  });

  if (error) throw error;
};

/**
 * Send quote (freeze snapshot)
 */
export const rpcSendQuote = async (quoteId: string): Promise<void> => {
  const { error } = await supabase.rpc('rpc_send_quote', {
    p_quote_id: quoteId,
  });

  if (error) throw error;
};

/**
 * Accept quote → create booking
 */
export const rpcAcceptQuote = async (quoteId: string): Promise<string> => {
  const { data, error } = await supabase.rpc('rpc_accept_quote', {
    p_quote_id: quoteId,
  });

  if (error) throw error;
  return data as string; // booking_id
};

/**
 * Raise incident
 */
export const rpcRaiseIncident = async (
  tripId: string,
  severity: 'P0' | 'P1' | 'P2',
  category: string,
  description: string
): Promise<string> => {
  const validated = IncidentCreateSchema.parse({
    trip_id: tripId,
    severity,
    category,
    description,
  });

  const { data, error } = await supabase.rpc('rpc_raise_incident', {
    p_trip_id: validated.trip_id,
    p_severity: validated.severity,
    p_category: validated.category,
    p_description: validated.description,
  });

  if (error) throw error;
  return data as string; // incident_id
};

/**
 * Record trip post action (quick action)
 */
export const rpcRecordPostAction = async (
  postId: string,
  actionId: string,
  payload?: any
): Promise<string> => {
  const { data, error } = await supabase.rpc('rpc_record_post_action', {
    p_post_id: postId,
    p_action_id: actionId,
    p_payload: payload || null,
  });

  if (error) throw error;
  return data as string; // ack_id
};

/**
 * Create quote version from parent
 */
export const rpcCreateQuoteVersion = async (parentQuoteId: string): Promise<string> => {
  const { data, error } = await supabase.rpc('rpc_create_quote_version', {
    p_parent_quote_id: parentQuoteId,
  });

  if (error) throw error;
  return data as string; // new_quote_id
};

/**
 * Update lead stage
 */
export const rpcUpdateLeadStage = async (
  leadId: string,
  newStage: 'NEW' | 'SCOPING' | 'QUOTED' | 'WON' | 'LOST'
): Promise<void> => {
  const { error } = await supabase.rpc('rpc_update_lead_stage', {
    p_lead_id: leadId,
    p_new_stage: newStage,
  });

  if (error) throw error;
};

/**
 * Confirm booking if all vouchers uploaded
 */
export const rpcConfirmBookingIfReady = async (bookingId: string): Promise<boolean> => {
  const { data, error } = await supabase.rpc('rpc_confirm_booking_if_ready', {
    p_booking_id: bookingId,
  });

  if (error) throw error;
  return data as boolean;
};

/**
 * Upload voucher
 */
export const rpcUploadVoucher = async (
  bookingId: string,
  vendorId: string,
  fileUrl: string,
  meta?: any
): Promise<string> => {
  const { data, error } = await supabase.rpc('rpc_upload_voucher', {
    p_booking_id: bookingId,
    p_vendor_id: vendorId,
    p_file_url: fileUrl,
    p_meta: meta || null,
  });

  if (error) throw error;
  return data as string; // voucher_id
};

/**
 * Create trip from booking
 */
export const rpcCreateTripFromBooking = async (bookingId: string): Promise<string> => {
  const { data, error } = await supabase.rpc('rpc_create_trip_from_booking', {
    p_booking_id: bookingId,
  });

  if (error) throw error;
  return data as string; // trip_id
};

/**
 * Submit cancellation request
 */
export const rpcSubmitCancellation = async (
  bookingId: string,
  reason: string
): Promise<string> => {
  const { data, error } = await supabase.rpc('rpc_submit_cancellation', {
    p_booking_id: bookingId,
    p_reason: reason,
  });

  if (error) throw error;
  return data as string; // cancellation_id
};

/**
 * Get signed URL for storage object
 */
export const rpcSignUrl = async (
  bucket: string,
  path: string,
  ttl: number = 300
): Promise<string> => {
  const { data, error } = await supabase.rpc('rpc_sign_url', {
    p_bucket: bucket,
    p_path: path,
    p_ttl_seconds: ttl,
  });

  if (error) throw error;
  return data as string;
};

// ======================
// POSTGREST QUERIES
// ======================

/**
 * Get leads for current user
 */
export const getLeads = async (): Promise<Lead[]> => {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Lead[];
};

/**
 * Get lead by ID
 */
export const getLead = async (leadId: string): Promise<Lead | null> => {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (error) throw error;
  return data as Lead | null;
};

/**
 * Get request doc for a lead
 */
export const getRequestDoc = async (leadId: string): Promise<RequestDoc | null> => {
  const { data, error } = await supabase
    .from('request_docs')
    .select('*')
    .eq('lead_id', leadId)
    .single();

  if (error) throw error;
  return data as RequestDoc | null;
};

/**
 * Get quotes for a lead
 */
export const getQuotes = async (leadId: string): Promise<Quote[]> => {
  const { data, error } = await supabase
    .from('quotes')
    .select('*, quote_items(*)')
    .eq('lead_id', leadId)
    .order('version', { ascending: false });

  if (error) throw error;
  return data as Quote[];
};

/**
 * Get quote by ID
 */
export const getQuote = async (quoteId: string): Promise<Quote | null> => {
  const { data, error } = await supabase
    .from('quotes')
    .select('*, quote_items(*)')
    .eq('id', quoteId)
    .single();

  if (error) throw error;
  return data as Quote | null;
};

/**
 * Get bookings for current user
 */
export const getBookings = async (): Promise<Booking[]> => {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Booking[];
};

/**
 * Get booking by ID
 */
export const getBooking = async (bookingId: string): Promise<Booking | null> => {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (error) throw error;
  return data as Booking | null;
};

/**
 * Get trips for current user
 */
export const getTrips = async (): Promise<Trip[]> => {
  const { data, error } = await supabase
    .from('trips')
    .select('*, trip_members!inner(*)')
    .order('start_date', { ascending: false });

  if (error) throw error;
  return data as Trip[];
};

/**
 * Get trip by ID
 */
export const getTrip = async (tripId: string): Promise<Trip | null> => {
  const { data, error } = await supabase
    .from('trips')
    .select('*, trip_members(*)')
    .eq('id', tripId)
    .single();

  if (error) throw error;
  return data as Trip | null;
};

/**
 * Get trip posts for a trip
 */
export const getTripPosts = async (tripId: string): Promise<TripPost[]> => {
  const { data, error } = await supabase
    .from('trip_posts')
    .select('*')
    .eq('trip_id', tripId)
    .eq('status', 'POSTED')
    .order('posted_at', { ascending: false });

  if (error) throw error;
  return data as TripPost[];
};

/**
 * Get incidents for a trip
 */
export const getIncidents = async (tripId: string): Promise<Incident[]> => {
  const { data, error } = await supabase
    .from('incidents')
    .select('*')
    .eq('trip_id', tripId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Incident[];
};

/**
 * Get POs for a booking
 */
export const getPOs = async (bookingId: string): Promise<PO[]> => {
  const { data, error } = await supabase
    .from('pos')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as PO[];
};

/**
 * Get vouchers for a booking
 */
export const getVouchers = async (bookingId: string): Promise<Voucher[]> => {
  const { data, error } = await supabase
    .from('vouchers')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Voucher[];
};

/**
 * Get trip members for a trip
 */
export const getTripMembers = async (tripId: string): Promise<TripMember[]> => {
  const { data, error } = await supabase
    .from('trip_members')
    .select('*')
    .eq('trip_id', tripId);

  if (error) throw error;
  return data as TripMember[];
};

/**
 * Get signed URL for storage object (convenience wrapper)
 */
export const getSignedUrl = async (
  bucket: string,
  path: string,
  ttl: number = 300
): Promise<string> => {
  return rpcSignUrl(bucket, path, ttl);
};

/**
 * Get POs for a vendor (vendor-specific query)
 */
export const getVendorPOs = async (): Promise<PO[]> => {
  const { data, error } = await supabase
    .from('pos')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as PO[];
};

/**
 * Get PO by ID (vendor-specific query)
 */
export const getPO = async (poId: string): Promise<PO | null> => {
  const { data, error } = await supabase
    .from('pos')
    .select('*')
    .eq('id', poId)
    .single();

  if (error) throw error;
  return data as PO | null;
};

/**
 * Get profile for current user
 */
export const getProfile = async (): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .single();

  if (error) throw error;
  return data as Profile | null;
};

/**
 * Get vendor by ID
 */
export const getVendor = async (vendorId: string): Promise<Vendor | null> => {
  const { data, error } = await supabase
    .from('vendors')
    .select('*')
    .eq('id', vendorId)
    .single();

  if (error) throw error;
  return data as Vendor | null;
};

/**
 * Get rate plans for a vendor
 */
export const getRatePlans = async (vendorId: string): Promise<RatePlan[]> => {
  const { data, error } = await supabase
    .from('rate_plans')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('season_start', { ascending: false });

  if (error) throw error;
  return data as RatePlan[];
};

