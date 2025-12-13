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

/**
 * Edge Function: Chat with AI bot
 * 
 * @param conversationHistory - Array of previous messages in the conversation
 * @param userMessage - The user's current message
 * @param existingData - Previously extracted trip data (optional)
 * @returns Promise that resolves with bot response, extracted data, and optional quick replies
 */
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

export interface BotChatResponse {
  message: string;
  extractedData: ExtractedTripData;
  quickReplies?: Array<{ label: string; value: string }>;
  error?: string;
}

export const chatWithBot = async (
  conversationHistory: ChatMessage[],
  userMessage: string,
  existingData?: ExtractedTripData
): Promise<BotChatResponse> => {
  const supabase = getSupabase();
  
  const { data, error } = await supabase.functions.invoke('ai_bot_chat', {
    body: {
      messages: conversationHistory,
      userMessage,
      existingData,
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

