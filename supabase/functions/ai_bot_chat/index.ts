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

interface BotResponse {
  message: string;
  extractedData: ExtractedData;
  quickReplies?: Array<{ label: string; value: string }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { messages, userMessage, existingData } = await req.json();

    if (!userMessage) {
      throw new Error('userMessage is required');
    }

    const googleApiKey = Deno.env.get('GOOGLE_AI_API_KEY');
    if (!googleApiKey) {
      throw new Error('GOOGLE_AI_API_KEY environment variable is not set');
    }

    // Build conversation history
    const conversationHistory: ChatMessage[] = messages || [];
    
    // Build system prompt with JSON schema instruction
    const systemPrompt = `You are a friendly travel planning assistant for Oasis Travel. Your goal is to help users plan their trips by collecting their travel requirements through natural conversation.

Your objectives:
1. Ask questions progressively to collect trip information
2. Be conversational and friendly
3. Only ask for one piece of information at a time
4. Extract structured data from user responses
5. When appropriate, suggest quick reply options (like hotel class, cab type, etc.)

Required information to collect:
- Destinations (at least one)
- Number of nights
- Number of adults

Optional information (collect if mentioned):
- Origin city, travel dates, budget, hotel preferences, cab type, interests, pace, special needs

Current collected data: ${JSON.stringify(existingData || {})}

Determine what information is still missing and ask for it naturally. When you have the minimum required information (destinations, nights, pax_adults), provide a summary and ask if they're ready to get a quote.

IMPORTANT: After your response, include a JSON object with the extracted trip data in this format:
{
  "destinations": ["city1", "city2"],
  "nights": 5,
  "pax_adults": 2,
  "origin_city": "Mumbai",
  "start_date": "2024-06-01",
  "end_date": "2024-06-06",
  "pax_children": 0,
  "pax_seniors": 0,
  "budget_min": 50000,
  "budget_max": 100000,
  "hotel_class": "4*",
  "cab_type": "suv",
  "interests": ["adventure", "heritage"],
  "pace": "normal",
  "special_needs": "wheelchair accessible"
}

Only include fields that are explicitly mentioned by the user. Format your response as:
[Your natural language response here]

<extracted_data>
[JSON object with extracted data]
</extracted_data>`;

    // Build conversation for Gemini (convert to Gemini format)
    const geminiContents: any[] = [];
    
    // Add system instruction as first user message (Gemini doesn't have system role)
    geminiContents.push({
      role: 'user',
      parts: [{ text: systemPrompt }]
    });
    
    // Add assistant response acknowledging system prompt
    geminiContents.push({
      role: 'model',
      parts: [{ text: 'I understand. I\'m ready to help plan your trip!' }]
    });
    
    // Add conversation history
    for (const msg of conversationHistory) {
      if (msg.role === 'user') {
        geminiContents.push({
          role: 'user',
          parts: [{ text: msg.content }]
        });
      } else if (msg.role === 'assistant') {
        geminiContents.push({
          role: 'model',
          parts: [{ text: msg.content }]
        });
      }
    }
    
    // Add current user message
    geminiContents.push({
      role: 'user',
      parts: [{ text: userMessage }]
    });

    // Call Google Gemini API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${googleApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: geminiContents,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorData = await geminiResponse.json().catch(() => ({}));
      console.error('Gemini API error:', errorData);
      throw new Error(`Google AI API error: ${errorData.error?.message || errorData.message || JSON.stringify(errorData) || 'Unknown error'}`);
    }

    const geminiData = await geminiResponse.json();
    console.log('Gemini API response:', JSON.stringify(geminiData, null, 2));
    
    // Check for safety ratings blocking the response
    if (geminiData.candidates?.[0]?.finishReason === 'SAFETY') {
      throw new Error('Response was blocked by safety filters');
    }
    
    if (!geminiData.candidates || geminiData.candidates.length === 0) {
      throw new Error('No response candidates from Gemini API');
    }
    
    const responseText = geminiData.candidates[0]?.content?.parts?.[0]?.text || 'I understand. Let me help you with that.';
    
    if (!responseText || responseText.trim().length === 0) {
      throw new Error('Empty response from Gemini API');
    }

    // Extract data from response
    let extractedData: ExtractedData = existingData || {};
    let botMessage = responseText;

    // Try to extract JSON from <extracted_data> tags or parse JSON from response
    const extractedDataMatch = responseText.match(/<extracted_data>([\s\S]*?)<\/extracted_data>/);
    if (extractedDataMatch) {
      try {
        const parsedData = JSON.parse(extractedDataMatch[1]);
        // Merge with existing data (only update fields that are provided)
        Object.keys(parsedData).forEach((key) => {
          if (parsedData[key] !== undefined && parsedData[key] !== null) {
            extractedData[key] = parsedData[key];
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
          // Check if it looks like trip data
          if (parsedData.destinations || parsedData.nights || parsedData.pax_adults) {
            Object.keys(parsedData).forEach((key) => {
              if (parsedData[key] !== undefined && parsedData[key] !== null) {
                extractedData[key] = parsedData[key];
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

    // Determine quick replies based on context
    const quickReplies = generateQuickReplies(botMessage, extractedData);

    const response: BotResponse = {
      message: botMessage,
      extractedData,
      quickReplies: quickReplies.length > 0 ? quickReplies : undefined,
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('AI Bot Chat Error:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    const errorMessage = error?.message || 'An error occurred while processing your message';
    const userMessage = errorMessage.includes('GOOGLE_AI_API_KEY')
      ? 'The chat service is not configured. Please contact support.'
      : errorMessage.includes('SAFETY')
      ? 'Your message was blocked by content filters. Please try rephrasing.'
      : 'Sorry, I encountered an issue. Please try again or use the quick reply buttons.';
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        message: userMessage,
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Generate quick reply options based on bot message and context
 */
function generateQuickReplies(message: string, data: ExtractedData): Array<{ label: string; value: string }> {
  const quickReplies: Array<{ label: string; value: string }> = [];
  const lowerMessage = message.toLowerCase();

  // Hotel class quick replies
  if ((lowerMessage.includes('hotel') || lowerMessage.includes('accommodation') || lowerMessage.includes('stay')) && !data.hotel_class) {
    quickReplies.push(
      { label: '3*', value: '3*' },
      { label: '4*', value: '4*' },
      { label: '5*', value: '5*' },
      { label: 'Luxury', value: 'luxury' }
    );
  }

  // Cab type quick replies
  if ((lowerMessage.includes('cab') || lowerMessage.includes('vehicle') || lowerMessage.includes('car')) && !data.cab_type) {
    quickReplies.push(
      { label: 'Sedan', value: 'sedan' },
      { label: 'SUV', value: 'suv' },
      { label: 'Tempo', value: 'tempo' }
    );
  }

  // Pace quick replies
  if ((lowerMessage.includes('pace') || lowerMessage.includes('schedule') || lowerMessage.includes('busy')) && !data.pace) {
    quickReplies.push(
      { label: 'Relaxed', value: 'relaxed' },
      { label: 'Normal', value: 'normal' },
      { label: 'Packed', value: 'packed' }
    );
  }

  // Nights quick replies (if asking about duration)
  if ((lowerMessage.includes('night') || lowerMessage.includes('day') || lowerMessage.includes('duration')) && !data.nights) {
    quickReplies.push(
      { label: '3 nights', value: '3' },
      { label: '4 nights', value: '4' },
      { label: '5 nights', value: '5' },
      { label: '7 nights', value: '7' }
    );
  }

  // Adults quick replies (if asking about travelers)
  if ((lowerMessage.includes('adult') || lowerMessage.includes('people') || lowerMessage.includes('traveler')) && !data.pax_adults) {
    quickReplies.push(
      { label: '1 adult', value: '1' },
      { label: '2 adults', value: '2' },
      { label: '3 adults', value: '3' },
      { label: '4 adults', value: '4' }
    );
  }

  return quickReplies;
}
