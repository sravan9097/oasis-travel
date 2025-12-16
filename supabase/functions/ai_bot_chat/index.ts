import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ExtractedData {
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

interface InteractiveButton {
  id: string;
  title: string;
  description?: string;
}

interface InteractiveList {
  type: 'list';
  header: string;
  body: string;
  buttonText: string;
  sections: Array<{
    title: string;
    rows: InteractiveButton[];
  }>;
}

interface PackageCard {
  id: string;
  title: string;
  destination: string;
  nights: number;
  price: number;
  image?: string;
  inclusions: string[];
  hotelClass?: string;
}

interface BotResponse {
  message: string;
  extractedData: ExtractedData;
  quickReplies?: Array<{ label: string; value: string }>;
  interactiveList?: InteractiveList;
  packageCards?: PackageCard[];
  messageType?: 'text' | 'list' | 'cards';
}

interface DestinationPackage {
  id: string;
  destination: string;
  title: string;
  description: string;
  nights: number;
  base_price: number;
  hotel_class: string;
  inclusions: string[];
  highlights: string[];
  images: string[];
  tags: string[];
}

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;
const LLM_REQUEST_TIMEOUT = 300000; // 5 minutes timeout for LLM requests

/**
 * Delay helper for retry logic
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retry wrapper with exponential backoff
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES,
  delayMs: number = INITIAL_RETRY_DELAY
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    console.log(`Retrying after ${delayMs}ms, ${retries} retries left...`);
    await delay(delayMs);
    return withRetry(fn, retries - 1, delayMs * 2);
  }
}

/**
 * Query available packages from database
 */
async function queryPackages(
  supabase: any,
  destination?: string,
  nights?: number,
  hotelClass?: string,
  maxPrice?: number
): Promise<DestinationPackage[]> {
  try {
    let query = supabase
      .from('destination_packages')
      .select('*')
      .eq('active', true);
    
    if (destination) {
      query = query.ilike('destination', `%${destination}%`);
    }
    
    if (nights) {
      // Allow some flexibility: +/- 1 night
      query = query.gte('nights', nights - 1).lte('nights', nights + 1);
    }
    
    if (hotelClass) {
      query = query.eq('hotel_class', hotelClass);
    }
    
    if (maxPrice) {
      query = query.lte('base_price', maxPrice);
    }
    
    const { data, error } = await query
      .order('popularity_score', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('Error querying packages:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in queryPackages:', error);
    return [];
  }
}

/**
 * Convert database packages to package cards
 */
function packagesToCards(packages: DestinationPackage[]): PackageCard[] {
  // Default images for destinations
  const defaultImages: Record<string, string> = {
    goa: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=400',
    udaipur: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=400',
    manali: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=400',
    kerala: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=400',
    jaipur: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=400',
  };

  return packages.map(pkg => ({
    id: pkg.id,
    title: pkg.title,
    destination: pkg.destination,
    nights: pkg.nights,
    price: pkg.base_price,
    image: pkg.images?.[0] || defaultImages[pkg.destination.toLowerCase()] || 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=400',
    inclusions: pkg.inclusions?.slice(0, 5) || [],
    hotelClass: pkg.hotel_class,
  }));
}

/**
 * Check if user wants to see packages/quotes
 */
function shouldShowPackages(userMessage: string, existingData: ExtractedData): boolean {
  const lowerMessage = userMessage.toLowerCase();
  const wantsPackages = 
    lowerMessage.includes('package') ||
    lowerMessage.includes('quote') ||
    lowerMessage.includes('price') ||
    lowerMessage.includes('cost') ||
    lowerMessage.includes('option') ||
    lowerMessage.includes('suggest') ||
    lowerMessage.includes('recommend') ||
    lowerMessage.includes('show me') ||
    lowerMessage.includes('what do you have');
  
  // Need at least destination and nights to show packages
  const hasMinimumData = 
    existingData.destinations && existingData.destinations.length > 0 &&
    existingData.nights && existingData.nights > 0;
  
  return wantsPackages && hasMinimumData;
}

/**
 * Check if all required data is collected
 */
function hasAllRequiredData(data: ExtractedData): boolean {
  return !!(
    data.destinations && data.destinations.length > 0 &&
    data.nights && data.nights > 0 &&
    data.pax_adults && data.pax_adults > 0
  );
}

/**
 * Fallback conversation flow when AI is unavailable
 */
function getFallbackResponse(userMessage: string, existingData: ExtractedData, packages: DestinationPackage[] = []): BotResponse {
  const lowerMessage = userMessage.toLowerCase();
  
  // Determine what information is missing
  const hasDestination = existingData.destinations && existingData.destinations.length > 0;
  const hasNights = existingData.nights && existingData.nights > 0;
  const hasAdults = existingData.pax_adults && existingData.pax_adults > 0;
  
  // Try to extract simple data from user message
  const extractedData = { ...existingData };
  
  // Extract numbers for nights/adults
  const numbers = userMessage.match(/\d+/g);
  if (numbers && numbers.length > 0) {
    const num = parseInt(numbers[0]);
    if (!hasNights && (lowerMessage.includes('night') || lowerMessage.includes('day'))) {
      extractedData.nights = num;
    } else if (!hasAdults && (lowerMessage.includes('adult') || lowerMessage.includes('people') || lowerMessage.includes('person'))) {
      extractedData.pax_adults = num;
    }
  }
  
  // Extract common destinations
  const destinations = ['goa', 'udaipur', 'jaipur', 'manali', 'shimla', 'kerala', 'mumbai', 'delhi', 'agra', 'varanasi', 'rishikesh', 'darjeeling', 'ooty', 'munnar'];
  for (const dest of destinations) {
    if (lowerMessage.includes(dest)) {
      extractedData.destinations = [dest.charAt(0).toUpperCase() + dest.slice(1)];
      break;
    }
  }
  
  // If we have packages and user wants to see them
  if (packages.length > 0 && shouldShowPackages(userMessage, extractedData)) {
    return {
      message: `Great! Here are some packages for ${extractedData.destinations?.[0] || 'your destination'}. Swipe to explore options:`,
      extractedData,
      packageCards: packagesToCards(packages),
      messageType: 'cards',
    };
  }
  
  // Generate appropriate response based on what's missing
  if (!extractedData.destinations || extractedData.destinations.length === 0) {
    return {
      message: "I'd love to help you plan your trip! Which destination would you like to visit?",
      extractedData,
      quickReplies: [
        { label: '🏖️ Goa', value: 'Goa' },
        { label: '🏰 Udaipur', value: 'Udaipur' },
        { label: '🏔️ Manali', value: 'Manali' },
        { label: '🌴 Kerala', value: 'Kerala' },
      ],
      messageType: 'text',
    };
  }
  
  if (!extractedData.nights) {
    return {
      message: `Great choice! ${extractedData.destinations[0]} is wonderful. How many nights would you like to stay?`,
      extractedData,
      quickReplies: [
        { label: '3 nights', value: '3' },
        { label: '4 nights', value: '4' },
        { label: '5 nights', value: '5' },
        { label: '7 nights', value: '7' },
      ],
      messageType: 'text',
    };
  }
  
  if (!extractedData.pax_adults) {
    return {
      message: `Perfect! ${extractedData.nights} nights sounds good. How many adults will be traveling?`,
      extractedData,
      quickReplies: [
        { label: '1 adult', value: '1' },
        { label: '2 adults', value: '2' },
        { label: '3 adults', value: '3' },
        { label: '4+ adults', value: '4' },
      ],
      messageType: 'text',
    };
  }
  
  // All required info collected - show packages if available
  if (packages.length > 0) {
    return {
      message: `Excellent! Here's what I found for your ${extractedData.nights}-night trip to ${extractedData.destinations?.join(', ')} for ${extractedData.pax_adults} adults:`,
      extractedData,
      packageCards: packagesToCards(packages),
      messageType: 'cards',
    };
  }
  
  // All required info collected but no packages
  return {
    message: `Excellent! Here's your trip summary:\n\n📍 Destination: ${extractedData.destinations?.join(', ')}\n🌙 Duration: ${extractedData.nights} nights\n👥 Travelers: ${extractedData.pax_adults} adults\n\nWould you like me to get you a quote?`,
    extractedData,
    quickReplies: [
      { label: '✅ Get Quote', value: 'get_quote' },
      { label: '✏️ Change Details', value: 'change' },
    ],
    messageType: 'text',
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Health check endpoint
  const url = new URL(req.url);
  if (url.pathname.endsWith('/health')) {
    const anythingLlmApiKey = Deno.env.get('ANYTHINGLLM_API_KEY');
    const anythingLlmEndpoint = Deno.env.get('ANYTHINGLLM_ENDPOINT') || 'http://host.docker.internal:11434';
    const isLocalOllama = anythingLlmEndpoint?.includes('127.0.0.1') || anythingLlmEndpoint?.includes('localhost') || anythingLlmEndpoint?.includes('host.docker.internal');
    
    return new Response(
      JSON.stringify({ 
        status: 'ok', 
        aiConfigured: !!anythingLlmApiKey || isLocalOllama,
        endpoint: anythingLlmEndpoint,
        usingLocalOllama: isLocalOllama,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Initialize Supabase client
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { messages, userMessage, existingData } = await req.json();

    if (!userMessage) {
      throw new Error('userMessage is required');
    }

    const anythingLlmApiKey = Deno.env.get('ANYTHINGLLM_API_KEY');
    const anythingLlmEndpoint = Deno.env.get('ANYTHINGLLM_ENDPOINT') || 'http://host.docker.internal:11434';
    const anythingLlmWorkspace = Deno.env.get('ANYTHINGLLM_WORKSPACE') || 'default';
    
    // #region agent log
    console.log('[DEBUG A] API key check:', JSON.stringify({hasApiKey:!!anythingLlmApiKey,apiKeyLength:anythingLlmApiKey?.length || 0,apiKeyPrefix:anythingLlmApiKey?.substring(0,10) || 'none', endpoint: anythingLlmEndpoint}));
    
    // TEMPORARY: Return debug info in response for testing
    if (userMessage === '__DEBUG_TEST__') {
      return new Response(
        JSON.stringify({
          debug: true,
          hasApiKey: !!anythingLlmApiKey,
          apiKeyLength: anythingLlmApiKey?.length || 0,
          apiKeyPrefix: anythingLlmApiKey?.substring(0,15) || 'none',
          endpoint: anythingLlmEndpoint,
          workspace: anythingLlmWorkspace,
          env: Object.keys(Deno.env.toObject()),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    // #endregion
    
    // Query packages based on existing data
    let packages: DestinationPackage[] = [];
    if (existingData?.destinations?.[0]) {
      packages = await queryPackages(
        supabase,
        existingData.destinations[0],
        existingData.nights,
        existingData.hotel_class,
        existingData.budget_max
      );
    }
    
    // If no API key, use fallback mode (unless using local Ollama which doesn't need auth)
    const isLocalOllama = anythingLlmEndpoint?.includes('127.0.0.1') || anythingLlmEndpoint?.includes('localhost') || anythingLlmEndpoint?.includes('host.docker.internal');
    
    if (!anythingLlmApiKey && !isLocalOllama) {
      console.log('No ANYTHINGLLM_API_KEY set and not using local Ollama, using fallback mode');
      // #region agent log
      console.log('[DEBUG E] Entering fallback mode - no API key and not local');
      // #endregion
      const fallbackResponse = getFallbackResponse(userMessage, existingData || {}, packages);
      return new Response(
        JSON.stringify(fallbackResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build conversation history
    const conversationHistory: ChatMessage[] = messages || [];
    
    // Build RAG context with available packages
    let ragContext = '';
    if (packages.length > 0) {
      ragContext = `\n\nAVAILABLE PACKAGES FOR ${existingData?.destinations?.[0]?.toUpperCase() || 'THIS DESTINATION'}:\n`;
      packages.forEach((pkg, idx) => {
        ragContext += `${idx + 1}. ${pkg.title} - ₹${pkg.base_price}/person\n`;
        ragContext += `   Hotel: ${pkg.hotel_class}, Duration: ${pkg.nights} nights\n`;
        ragContext += `   Inclusions: ${pkg.inclusions?.slice(0, 3).join(', ')}\n`;
        ragContext += `   Highlights: ${pkg.highlights?.slice(0, 2).join(', ')}\n\n`;
      });
    }
    
    // Build system prompt with JSON schema instruction
    const systemPrompt = `You are a helpful travel assistant. Ask ONE question at a time to collect trip information.

RULES:
1. Ask ONLY ONE question per response
2. Keep responses SHORT (1-2 sentences maximum)
3. Be friendly but brief
4. Do NOT generate code, tables, or long examples

Required info to collect:
- Destination (which city?)
- Number of nights
- Number of adults

Current data: ${JSON.stringify(existingData || {})}

After your response, add extracted data in this format:
<extracted_data>
{"destinations": ["CityName"], "nights": 5, "pax_adults": 2}
</extracted_data>

Example responses:
- "Great! Which city would you like to visit?"
- "Perfect! How many nights will you stay?"
- "Awesome! How many adults are traveling?"

Keep it simple and short!`;

    // Build messages for LLM (OpenAI-compatible format)
    const llmMessages: any[] = [];
    
    // Add system message
    llmMessages.push({
      role: 'system',
      content: systemPrompt
    });
    
    // Add conversation history
    for (const msg of conversationHistory) {
      if (msg.role === 'user' || msg.role === 'assistant') {
        llmMessages.push({
          role: msg.role,
          content: msg.content
        });
      }
    }
    
    // Add current user message
    llmMessages.push({
      role: 'user',
      content: userMessage
    });

    // #region agent log
    console.log('[DEBUG B] Before LLM API call:', JSON.stringify({messagesCount:llmMessages.length,userMessage:userMessage.substring(0,50),endpoint:anythingLlmEndpoint}));
    // #endregion
    
    // Call LLM API with retry logic (Ollama API format)
    const llmData = await withRetry(async () => {
      // Create an AbortController with extended timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), LLM_REQUEST_TIMEOUT);
      
      try {
        const llmResponse = await fetch(
          `${anythingLlmEndpoint}/api/chat`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          body: JSON.stringify({
            model: 'llama2:7b', // Better quality than tinyllama
            messages: llmMessages,
            stream: false,
            options: {
              temperature: 0.7,
              top_p: 0.95,
              num_predict: 150, // Reduced from 1024 for faster responses
            }
          }),
            signal: controller.signal,
          }
        );
        clearTimeout(timeoutId);
        return llmResponse;
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    }, MAX_RETRIES, INITIAL_RETRY_DELAY).then(async (llmResponse) => {

      // #region agent log
      console.log('[DEBUG B,C] LLM API response status:', JSON.stringify({status:llmResponse.status,ok:llmResponse.ok,statusText:llmResponse.statusText}));
      // #endregion

      if (!llmResponse.ok) {
        const errorData = await llmResponse.json().catch(() => ({}));
        console.error('LLM API error:', errorData);
        
        // #region agent log
        console.log('[DEBUG B,C] LLM API error response:', JSON.stringify({status:llmResponse.status,errorData:errorData}));
        // #endregion
        
        // Don't retry on authentication errors
        if (llmResponse.status === 401 || llmResponse.status === 403) {
          throw new Error(`LLM API authentication error: ${errorData.error?.message || 'Invalid API key'}`);
        }
        
        throw new Error(`LLM API error: ${errorData.error?.message || errorData.message || JSON.stringify(errorData) || 'Unknown error'}`);
      }

      return await llmResponse.json();
    });
    
    console.log('LLM API response:', JSON.stringify(llmData, null, 2));
    
    // #region agent log
    console.log('[DEBUG D] LLM API success response:', JSON.stringify({hasMessage:!!llmData.message,hasChoices:!!llmData.choices,responseType:typeof llmData}));
    // #endregion
    
    // Extract response text (support multiple response formats)
    let responseText = '';
    if (llmData.message) {
      // Ollama format
      responseText = llmData.message.content || llmData.message;
    } else if (llmData.choices && llmData.choices.length > 0) {
      // OpenAI format
      responseText = llmData.choices[0]?.message?.content || llmData.choices[0]?.text || '';
    } else if (llmData.response) {
      // Alternative format
      responseText = llmData.response;
    } else if (typeof llmData === 'string') {
      responseText = llmData;
    }
    
    if (!responseText || responseText.trim().length === 0) {
      // #region agent log
      console.log('[DEBUG D] Empty response text:', responseText);
      // #endregion
      throw new Error('Empty response from LLM API');
    }

    // Extract data from response
    let extractedData: ExtractedData = existingData || {};
    let botMessage = responseText;
    let showPackages = false;

    // Try to extract JSON from <extracted_data> tags or parse JSON from response
    const extractedDataMatch = responseText.match(/<extracted_data>([\s\S]*?)<\/extracted_data>/);
    if (extractedDataMatch) {
      try {
        const parsedData = JSON.parse(extractedDataMatch[1]);
        showPackages = parsedData.show_packages === true;
        delete parsedData.show_packages;
        
        // Merge with existing data (only update fields that are provided)
        Object.keys(parsedData).forEach((key) => {
          if (parsedData[key] !== undefined && parsedData[key] !== null) {
            (extractedData as any)[key] = parsedData[key];
          }
        });
        // Remove the extracted_data section from the message
        botMessage = responseText.replace(/<extracted_data>[\s\S]*?<\/extracted_data>/, '').trim();
      } catch (e) {
        console.error('Failed to parse extracted data:', e);
      }
    } else {
      // Try to find JSON at the end of the response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsedData = JSON.parse(jsonMatch[0]);
          showPackages = parsedData.show_packages === true;
          delete parsedData.show_packages;
          
          // Check if it looks like trip data
          if (parsedData.destinations || parsedData.nights || parsedData.pax_adults) {
            Object.keys(parsedData).forEach((key) => {
              if (parsedData[key] !== undefined && parsedData[key] !== null) {
                (extractedData as any)[key] = parsedData[key];
              }
            });
            // Remove JSON from message
            botMessage = responseText.replace(/\{[\s\S]*\}/, '').trim();
          }
        } catch (e) {
          // Not valid JSON, continue with full message
        }
      }
    }

    // If botMessage is empty after extraction, use a default
    if (!botMessage || botMessage.length === 0) {
      botMessage = 'I understand. Let me help you with that.';
    }

    // Query packages again with updated data if destination changed
    if (extractedData.destinations?.[0] && (!packages.length || existingData?.destinations?.[0] !== extractedData.destinations[0])) {
      packages = await queryPackages(
        supabase,
        extractedData.destinations[0],
        extractedData.nights,
        extractedData.hotel_class,
        extractedData.budget_max
      );
    }

    // Determine if we should show packages
    const shouldShow = showPackages || 
      shouldShowPackages(userMessage, extractedData) ||
      (hasAllRequiredData(extractedData) && packages.length > 0);

    // Determine quick replies based on context
    const quickReplies = generateQuickReplies(botMessage, extractedData);

    const response: BotResponse = {
      message: botMessage,
      extractedData,
      quickReplies: quickReplies.length > 0 ? quickReplies : undefined,
      packageCards: shouldShow && packages.length > 0 ? packagesToCards(packages) : undefined,
      messageType: shouldShow && packages.length > 0 ? 'cards' : 'text',
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('AI Bot Chat Error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    // #region agent log
    console.log('[DEBUG E] Caught error - entering fallback:', JSON.stringify({errorMessage:error?.message,errorName:error?.name,errorStack:error?.stack?.substring(0,200)}));
    // #endregion
    
    const errorMessage = error?.message || 'An error occurred while processing your message';
    
    // Try to extract existing data from the request for fallback
    let fallbackData: ExtractedData = {};
    let packages: DestinationPackage[] = [];
    let fallbackUserMessage = '';
    try {
      const body = await req.clone().json();
      fallbackData = body.existingData || {};
      fallbackUserMessage = body.userMessage || '';
      
      // Try to get packages for fallback
      if (fallbackData.destinations?.[0]) {
        packages = await queryPackages(
          supabase,
          fallbackData.destinations[0],
          fallbackData.nights,
          fallbackData.hotel_class
        );
      }
    } catch {}
    
    // TEMPORARY: Return error details for debugging
    if (userMessage === '__DEBUG_ERROR__') {
      return new Response(
        JSON.stringify({
          debug: true,
          error: errorMessage,
          errorName: error?.name,
          errorStack: error?.stack,
          errorDetails: JSON.stringify(error, Object.getOwnPropertyNames(error))
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Use fallback response instead of error
    if (!errorMessage.includes('SAFETY')) {
      console.log('Using fallback mode due to error');
      // #region agent log
      console.log('[DEBUG E] Using fallback mode due to error:', errorMessage);
      // #endregion
      const fallbackResponse = getFallbackResponse(fallbackUserMessage, fallbackData, packages);
      fallbackResponse.message = "I'm having a bit of trouble connecting. Let me help you with some quick options instead!\n\n" + fallbackResponse.message;
      
      return new Response(
        JSON.stringify(fallbackResponse),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Only return error for safety filter issues
    const userFriendlyMessage = 'Your message was blocked by content filters. Please try rephrasing.';
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        message: userFriendlyMessage,
        extractedData: fallbackData,
        quickReplies: [
          { label: 'Start Over', value: 'hello' },
          { label: 'Get Help', value: 'help' },
        ],
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Generate quick reply options based on bot message and context
 */
function generateQuickReplies(message: string, data: ExtractedData): Array<{ label: string; value: string }> {
  const quickReplies: Array<{ label: string; value: string }> = [];
  const lowerMessage = message.toLowerCase();

  // If all required data is collected, offer to show packages
  if (hasAllRequiredData(data)) {
    if (lowerMessage.includes('summary') || lowerMessage.includes('confirm')) {
      quickReplies.push(
        { label: '✅ Show Packages', value: 'show me packages' },
        { label: '✏️ Change Details', value: 'change' }
      );
      return quickReplies;
    }
  }

  // Hotel class quick replies
  if ((lowerMessage.includes('hotel') || lowerMessage.includes('accommodation') || lowerMessage.includes('stay')) && !data.hotel_class) {
    quickReplies.push(
      { label: '⭐⭐⭐ 3-Star', value: '3*' },
      { label: '⭐⭐⭐⭐ 4-Star', value: '4*' },
      { label: '⭐⭐⭐⭐⭐ 5-Star', value: '5*' },
      { label: '👑 Luxury', value: 'luxury' }
    );
  }

  // Cab type quick replies
  if ((lowerMessage.includes('cab') || lowerMessage.includes('vehicle') || lowerMessage.includes('car') || lowerMessage.includes('transport')) && !data.cab_type) {
    quickReplies.push(
      { label: '🚗 Sedan', value: 'sedan' },
      { label: '🚙 SUV', value: 'suv' },
      { label: '🚐 Tempo Traveller', value: 'tempo' }
    );
  }

  // Pace quick replies
  if ((lowerMessage.includes('pace') || lowerMessage.includes('schedule') || lowerMessage.includes('busy') || lowerMessage.includes('itinerary')) && !data.pace) {
    quickReplies.push(
      { label: '🧘 Relaxed', value: 'relaxed' },
      { label: '⚖️ Normal', value: 'normal' },
      { label: '🏃 Packed', value: 'packed' }
    );
  }

  // Nights quick replies (if asking about duration)
  if ((lowerMessage.includes('night') || lowerMessage.includes('day') || lowerMessage.includes('duration') || lowerMessage.includes('long')) && !data.nights) {
    quickReplies.push(
      { label: '3 nights', value: '3 nights' },
      { label: '4 nights', value: '4 nights' },
      { label: '5 nights', value: '5 nights' },
      { label: '7 nights', value: '7 nights' }
    );
  }

  // Adults quick replies (if asking about travelers)
  if ((lowerMessage.includes('adult') || lowerMessage.includes('people') || lowerMessage.includes('traveler') || lowerMessage.includes('many')) && !data.pax_adults) {
    quickReplies.push(
      { label: '👤 1 adult', value: '1 adult' },
      { label: '👥 2 adults', value: '2 adults' },
      { label: '👨‍👩‍👦 3 adults', value: '3 adults' },
      { label: '👨‍👩‍👧‍👦 4+ adults', value: '4 adults' }
    );
  }

  // Destination quick replies (if asking about destination)
  if ((lowerMessage.includes('destination') || lowerMessage.includes('where') || lowerMessage.includes('place') || lowerMessage.includes('visit')) && (!data.destinations || data.destinations.length === 0)) {
    quickReplies.push(
      { label: '🏖️ Goa', value: 'Goa' },
      { label: '🏰 Udaipur', value: 'Udaipur' },
      { label: '🏔️ Manali', value: 'Manali' },
      { label: '🌴 Kerala', value: 'Kerala' }
    );
  }

  return quickReplies;
}
