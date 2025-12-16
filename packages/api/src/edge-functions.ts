import { getSupabase } from './client';

/**
 * Edge Function: Generate PDF for quote
 * 
 * @param quoteId - The quote ID to generate PDF for
 * @returns Promise that resolves when PDF is generated
 */
export const generateQuotePDF = async (quoteId: string): Promise<void> => {
  const supabase = getSupabase();
  
  const { error } = await supabase.functions.invoke('pdf_generate_quote', {
    body: { quote_id: quoteId },
  });

  if (error) throw error;
};

/**
 * Edge Function: Trigger scheduler post runner (usually called by cron)
 * 
 * @returns Promise that resolves when scheduler runs
 */
export const triggerSchedulerPostRunner = async (): Promise<void> => {
  const supabase = getSupabase();
  
  const { error } = await supabase.functions.invoke('scheduler_post_runner', {
    body: {},
  });

  if (error) throw error;
};

/**
 * Edge Function: Trigger SLA monitor (usually called by cron)
 * 
 * @returns Promise that resolves when SLA monitor runs
 */
export const triggerSLAMonitor = async (): Promise<void> => {
  const supabase = getSupabase();
  
  const { error } = await supabase.functions.invoke('sla_monitor', {
    body: {},
  });

  if (error) throw error;
};

/**
 * Edge Function: Trigger recap generator (usually called by cron)
 * 
 * @returns Promise that resolves when recap generator runs
 */
export const triggerRecapGenerator = async (): Promise<void> => {
  const supabase = getSupabase();
  
  const { error } = await supabase.functions.invoke('recap_generator', {
    body: {},
  });

  if (error) throw error;
};

// ============================================
// AI BOT CHAT TYPES AND FUNCTIONS
// ============================================

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ExtractedTripData {
  destinations?: string[];
  nights?: number;
  pax_adults?: number;
  origin_city?: string;
  start_date?: string;
  end_date?: string;
  pax_children?: number;
  pax_seniors?: number;
  budget_min?: number;
  budget_max?: number;
  hotel_class?: '3*' | '4*' | '5*' | 'luxury';
  cab_type?: 'sedan' | 'suv' | 'tempo';
  interests?: string[];
  pace?: 'relaxed' | 'normal' | 'packed';
  special_needs?: string;
}

export interface QuickReply {
  label: string;
  value: string;
}

export interface InteractiveListRow {
  id: string;
  title: string;
  description?: string;
}

export interface InteractiveListSection {
  title: string;
  rows: InteractiveListRow[];
}

export interface InteractiveList {
  type: 'list';
  header: string;
  body: string;
  buttonText: string;
  sections: InteractiveListSection[];
}

export interface PackageCard {
  id: string;
  title: string;
  destination: string;
  nights: number;
  price: number;
  image?: string;
  inclusions: string[];
  hotelClass?: string;
}

export interface BotChatResponse {
  message: string;
  extractedData: ExtractedTripData;
  quickReplies?: QuickReply[];
  interactiveList?: InteractiveList;
  packageCards?: PackageCard[];
  messageType?: 'text' | 'list' | 'cards';
  error?: string;
}

/**
 * Edge Function: Chat with AI bot
 * 
 * @param conversationHistory - Array of previous messages in the conversation
 * @param userMessage - The user's current message
 * @param existingData - Previously extracted trip data (optional)
 * @returns Promise that resolves with bot response, extracted data, and optional quick replies/cards
 */
export const chatWithBot = async (
  conversationHistory: ChatMessage[],
  userMessage: string,
  existingData?: ExtractedTripData
): Promise<BotChatResponse> => {
  const supabase = getSupabase();
  
  // Extended timeout for LLM responses (2 minutes)
  const { data, error } = await supabase.functions.invoke('ai_bot_chat', {
    body: {
      messages: conversationHistory,
      userMessage,
      existingData,
    },
    headers: {
      'x-request-timeout': '120000', // 2 minutes in milliseconds
    },
  });

  if (error) {
    // If error is thrown by Supabase client, wrap it
    throw new Error(error.message || 'Failed to connect to chat service');
  }

  // Check if response data contains an error field (from edge function error response)
  if (data && typeof data === 'object' && 'error' in data) {
    const errorResponse = data as { error: string; message?: string };
    throw new Error(errorResponse.error || errorResponse.message || 'Chat service error');
  }

  return data as BotChatResponse;
};

// ============================================
// QUOTE SUGGESTION TYPES AND FUNCTIONS
// ============================================

export interface TripRequirements {
  lead_id: string;
  destinations: string[];
  nights: number;
  pax_adults: number;
  pax_children?: number;
  pax_seniors?: number;
  start_date?: string;
  end_date?: string;
  hotel_class?: string;
  cab_type?: string;
  budget_min?: number;
  budget_max?: number;
  interests?: string[];
  special_needs?: string;
}

export interface QuoteItem {
  day_no: number;
  item_type: 'hotel' | 'cab' | 'activity' | 'misc';
  vendor_id?: string;
  description: string;
  qty: number;
  unit_price: number;
  meta?: Record<string, any>;
}

export interface QuoteSuggestion {
  id?: string;
  package_id?: string;
  package_title?: string;
  items: QuoteItem[];
  subtotal: number;
  taxes: number;
  total: number;
  per_person: number;
  confidence: number;
  inclusions: string[];
  exclusions: string[];
  validity_days: number;
}

export interface GenerateQuoteResponse {
  suggestions: QuoteSuggestion[];
  lead_id: string;
  requirements: TripRequirements;
}

/**
 * Edge Function: Generate quote suggestions based on trip requirements
 * 
 * @param requirements - Trip requirements including destination, nights, pax, etc.
 * @returns Promise that resolves with quote suggestions
 */
export const generateQuoteSuggestion = async (
  requirements: TripRequirements
): Promise<GenerateQuoteResponse> => {
  const supabase = getSupabase();
  
  const { data, error } = await supabase.functions.invoke('generate_quote_suggestion', {
    body: requirements,
  });

  if (error) {
    throw new Error(error.message || 'Failed to generate quote suggestions');
  }

  if (data && typeof data === 'object' && 'error' in data) {
    throw new Error((data as any).error || 'Quote generation error');
  }

  return data as GenerateQuoteResponse;
};

// ============================================
// VENDOR PRODUCTS TYPES AND FUNCTIONS
// ============================================

export interface Product {
  id?: string;
  vendor_id: string;
  name: string;
  category: 'room' | 'package' | 'activity' | 'transfer' | 'meal';
  description?: string;
  base_price: number;
  currency?: string;
  images?: string[];
  availability_json?: Record<string, any>;
  meta?: Record<string, any>;
  destination?: string;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ProductsListResponse {
  products: Product[];
}

export interface ProductResponse {
  product: Product;
}

export interface BulkUploadItem {
  name: string;
  category: string;
  description?: string;
  base_price: number;
  destination?: string;
  meta?: Record<string, any>;
}

export interface BulkUploadResponse {
  message: string;
  products: Product[];
}

/**
 * Edge Function: List products for vendor
 * 
 * @param options - Filter options
 * @returns Promise that resolves with list of products
 */
export const listVendorProducts = async (options?: {
  vendor_id?: string;
  category?: string;
  destination?: string;
  active?: boolean;
}): Promise<ProductsListResponse> => {
  const supabase = getSupabase();
  
  const params = new URLSearchParams();
  if (options?.vendor_id) params.append('vendor_id', options.vendor_id);
  if (options?.category) params.append('category', options.category);
  if (options?.destination) params.append('destination', options.destination);
  if (options?.active !== undefined) params.append('active', String(options.active));
  
  const { data, error } = await supabase.functions.invoke(`vendor_products?${params.toString()}`, {
    method: 'GET',
  });

  if (error) {
    throw new Error(error.message || 'Failed to list products');
  }

  return data as ProductsListResponse;
};

/**
 * Edge Function: Create a new product
 * 
 * @param product - Product data to create
 * @returns Promise that resolves with created product
 */
export const createProduct = async (product: Product): Promise<ProductResponse> => {
  const supabase = getSupabase();
  
  const { data, error } = await supabase.functions.invoke('vendor_products', {
    method: 'POST',
    body: product,
  });

  if (error) {
    throw new Error(error.message || 'Failed to create product');
  }

  if (data && typeof data === 'object' && 'error' in data) {
    throw new Error((data as any).error || 'Product creation error');
  }

  return data as ProductResponse;
};

/**
 * Edge Function: Bulk upload products
 * 
 * @param vendorId - Vendor ID to add products for
 * @param items - Array of product data to upload
 * @returns Promise that resolves with created products
 */
export const bulkUploadProducts = async (
  vendorId: string,
  items: BulkUploadItem[]
): Promise<BulkUploadResponse> => {
  const supabase = getSupabase();
  
  const { data, error } = await supabase.functions.invoke('vendor_products?action=bulk', {
    method: 'POST',
    body: { vendor_id: vendorId, items },
  });

  if (error) {
    throw new Error(error.message || 'Failed to bulk upload products');
  }

  if (data && typeof data === 'object' && 'error' in data) {
    throw new Error((data as any).error || 'Bulk upload error');
  }

  return data as BulkUploadResponse;
};

/**
 * Edge Function: Update a product
 * 
 * @param productId - ID of the product to update
 * @param updates - Partial product data to update
 * @returns Promise that resolves with updated product
 */
export const updateProduct = async (
  productId: string,
  updates: Partial<Product>
): Promise<ProductResponse> => {
  const supabase = getSupabase();
  
  const { data, error } = await supabase.functions.invoke(`vendor_products?id=${productId}`, {
    method: 'PUT',
    body: updates,
  });

  if (error) {
    throw new Error(error.message || 'Failed to update product');
  }

  if (data && typeof data === 'object' && 'error' in data) {
    throw new Error((data as any).error || 'Product update error');
  }

  return data as ProductResponse;
};

/**
 * Edge Function: Delete (deactivate) a product
 * 
 * @param productId - ID of the product to delete
 * @returns Promise that resolves when product is deactivated
 */
export const deleteProduct = async (productId: string): Promise<void> => {
  const supabase = getSupabase();
  
  const { data, error } = await supabase.functions.invoke(`vendor_products?id=${productId}`, {
    method: 'DELETE',
  });

  if (error) {
    throw new Error(error.message || 'Failed to delete product');
  }

  if (data && typeof data === 'object' && 'error' in data) {
    throw new Error((data as any).error || 'Product deletion error');
  }
};

// ============================================
// DESTINATION PACKAGES (Database Queries)
// ============================================

export interface DestinationPackage {
  id: string;
  destination: string;
  title: string;
  description?: string;
  nights: number;
  base_price: number;
  currency: string;
  hotel_class?: string;
  cab_type?: string;
  inclusions: string[];
  exclusions: string[];
  highlights: string[];
  itinerary_json?: any[];
  images: string[];
  tags: string[];
  popularity_score: number;
  active: boolean;
}

/**
 * Search destination packages using RPC function
 * 
 * @param options - Search filters
 * @returns Promise that resolves with matching packages
 */
export const searchPackages = async (options?: {
  destination?: string;
  min_nights?: number;
  max_nights?: number;
  hotel_class?: string;
  max_price?: number;
  tags?: string[];
  limit?: number;
}): Promise<DestinationPackage[]> => {
  const supabase = getSupabase();
  
  const { data, error } = await supabase.rpc('search_packages', {
    p_destination: options?.destination || null,
    p_min_nights: options?.min_nights || null,
    p_max_nights: options?.max_nights || null,
    p_hotel_class: options?.hotel_class || null,
    p_max_price: options?.max_price || null,
    p_tags: options?.tags || null,
    p_limit: options?.limit || 10,
  });

  if (error) {
    throw new Error(error.message || 'Failed to search packages');
  }

  return data as DestinationPackage[];
};

/**
 * Get package details with components
 * 
 * @param packageId - Package ID to get details for
 * @returns Promise that resolves with package details
 */
export const getPackageDetails = async (packageId: string): Promise<any> => {
  const supabase = getSupabase();
  
  const { data, error } = await supabase.rpc('get_package_details', {
    p_package_id: packageId,
  });

  if (error) {
    throw new Error(error.message || 'Failed to get package details');
  }

  return data;
};

/**
 * Calculate package price for specific requirements
 * 
 * @param packageId - Package ID
 * @param startDate - Travel start date
 * @param paxAdults - Number of adults
 * @param paxChildren - Number of children (optional)
 * @returns Promise that resolves with price calculation
 */
export const calculatePackagePrice = async (
  packageId: string,
  startDate: string,
  paxAdults: number,
  paxChildren?: number
): Promise<{
  package_id: string;
  base_total: number;
  taxes: number;
  grand_total: number;
  per_person: number;
  currency: string;
  pax_adults: number;
  pax_children: number;
  nights: number;
  start_date: string;
}> => {
  const supabase = getSupabase();
  
  const { data, error } = await supabase.rpc('calculate_package_price', {
    p_package_id: packageId,
    p_start_date: startDate,
    p_pax_adults: paxAdults,
    p_pax_children: paxChildren || 0,
  });

  if (error) {
    throw new Error(error.message || 'Failed to calculate package price');
  }

  return data;
};

// ============================================
// DRAFT QUOTES (Database Queries)
// ============================================

export interface DraftQuote {
  id: string;
  lead_id: string;
  package_id?: string;
  suggested_items: QuoteItem[];
  total_amount: number;
  currency: string;
  confidence_score: number;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  notes?: string;
  generated_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  expires_at: string;
}

/**
 * Get pending draft quotes for a lead
 * 
 * @param leadId - Lead ID to get drafts for
 * @returns Promise that resolves with draft quotes
 */
export const getDraftQuotes = async (leadId: string): Promise<DraftQuote[]> => {
  const supabase = getSupabase();
  
  const { data, error } = await supabase
    .from('draft_quotes')
    .select('*')
    .eq('lead_id', leadId)
    .eq('status', 'pending')
    .order('confidence_score', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Failed to get draft quotes');
  }

  return data as DraftQuote[];
};

/**
 * Approve a draft quote and create actual quote
 * 
 * @param draftId - Draft quote ID to approve
 * @param adjustments - Optional adjustments to the items
 * @returns Promise that resolves with created quote ID
 */
export const approveDraftQuote = async (
  draftId: string,
  adjustments?: QuoteItem[]
): Promise<string> => {
  const supabase = getSupabase();
  
  const { data, error } = await supabase.rpc('approve_draft_quote', {
    p_draft_id: draftId,
    p_adjustments: adjustments ? JSON.stringify(adjustments) : null,
  });

  if (error) {
    throw new Error(error.message || 'Failed to approve draft quote');
  }

  return data as string;
};

/**
 * Reject a draft quote
 * 
 * @param draftId - Draft quote ID to reject
 * @returns Promise that resolves when rejected
 */
export const rejectDraftQuote = async (draftId: string): Promise<void> => {
  const supabase = getSupabase();
  
  const { error } = await supabase
    .from('draft_quotes')
    .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
    .eq('id', draftId);

  if (error) {
    throw new Error(error.message || 'Failed to reject draft quote');
  }
};
