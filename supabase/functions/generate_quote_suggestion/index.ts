import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TripRequirements {
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

interface QuoteItem {
  day_no: number;
  item_type: 'hotel' | 'cab' | 'activity' | 'misc';
  vendor_id?: string;
  description: string;
  qty: number;
  unit_price: number;
  meta?: Record<string, any>;
}

interface QuoteSuggestion {
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

interface GenerateResponse {
  suggestions: QuoteSuggestion[];
  lead_id: string;
  requirements: TripRequirements;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const requirements: TripRequirements = await req.json();

    // Validate required fields
    if (!requirements.lead_id) {
      throw new Error('lead_id is required');
    }
    if (!requirements.destinations || requirements.destinations.length === 0) {
      throw new Error('At least one destination is required');
    }
    if (!requirements.nights || requirements.nights <= 0) {
      throw new Error('Valid number of nights is required');
    }
    if (!requirements.pax_adults || requirements.pax_adults <= 0) {
      throw new Error('Valid number of adults is required');
    }

    const suggestions: QuoteSuggestion[] = [];
    const totalPax = requirements.pax_adults + (requirements.pax_children || 0) + (requirements.pax_seniors || 0);

    // Query matching packages
    let packagesQuery = supabase
      .from('destination_packages')
      .select('*')
      .eq('active', true)
      .ilike('destination', `%${requirements.destinations[0]}%`);

    // Filter by nights (allow +/- 1 night flexibility)
    packagesQuery = packagesQuery
      .gte('nights', requirements.nights - 1)
      .lte('nights', requirements.nights + 1);

    // Filter by hotel class if specified
    if (requirements.hotel_class) {
      packagesQuery = packagesQuery.eq('hotel_class', requirements.hotel_class);
    }

    // Filter by budget if specified
    if (requirements.budget_max) {
      packagesQuery = packagesQuery.lte('base_price', requirements.budget_max);
    }

    const { data: packages, error: packagesError } = await packagesQuery
      .order('popularity_score', { ascending: false })
      .limit(3);

    if (packagesError) {
      console.error('Error fetching packages:', packagesError);
    }

    // Generate suggestions from packages
    if (packages && packages.length > 0) {
      for (const pkg of packages) {
        const suggestion = await generateSuggestionFromPackage(
          supabase,
          pkg,
          requirements,
          totalPax
        );
        suggestions.push(suggestion);
      }
    }

    // If no packages found, generate a custom suggestion
    if (suggestions.length === 0) {
      const customSuggestion = await generateCustomSuggestion(
        supabase,
        requirements,
        totalPax
      );
      suggestions.push(customSuggestion);
    }

    // Sort suggestions by confidence score
    suggestions.sort((a, b) => b.confidence - a.confidence);

    // Save top suggestions as draft quotes
    for (const suggestion of suggestions.slice(0, 3)) {
      const { data: draftQuote, error: draftError } = await supabase
        .from('draft_quotes')
        .insert({
          lead_id: requirements.lead_id,
          package_id: suggestion.package_id,
          suggested_items: suggestion.items,
          total_amount: suggestion.total,
          confidence_score: suggestion.confidence,
          notes: suggestion.package_title 
            ? `Based on package: ${suggestion.package_title}` 
            : 'Custom generated quote',
        })
        .select()
        .single();

      if (!draftError && draftQuote) {
        suggestion.id = draftQuote.id;
      }
    }

    // Update lead stage to SCOPING if it's NEW
    await supabase
      .from('leads')
      .update({ stage: 'SCOPING' })
      .eq('id', requirements.lead_id)
      .eq('stage', 'NEW');

    const response: GenerateResponse = {
      suggestions: suggestions.slice(0, 3),
      lead_id: requirements.lead_id,
      requirements,
    };

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Generate Quote Suggestion Error:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to generate quote suggestions' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Generate a quote suggestion from a destination package
 */
async function generateSuggestionFromPackage(
  supabase: any,
  pkg: any,
  requirements: TripRequirements,
  totalPax: number
): Promise<QuoteSuggestion> {
  const items: QuoteItem[] = [];
  
  // Get package components
  const { data: components } = await supabase
    .from('package_components')
    .select('*, vendors(id, name, type)')
    .eq('package_id', pkg.id)
    .order('day_no', { ascending: true });

  // Add items from package components
  if (components && components.length > 0) {
    for (const comp of components) {
      items.push({
        day_no: comp.day_no || 1,
        item_type: comp.component_type as any,
        vendor_id: comp.vendor_id,
        description: comp.description,
        qty: comp.quantity || 1,
        unit_price: comp.unit_price || 0,
        meta: comp.meta,
      });
    }
  }

  // If no components, create default items based on package
  if (items.length === 0) {
    // Hotel accommodation
    items.push({
      day_no: 1,
      item_type: 'hotel',
      description: `${pkg.hotel_class || '4*'} Hotel in ${pkg.destination} - ${pkg.nights} nights`,
      qty: pkg.nights,
      unit_price: Math.round(pkg.base_price * 0.5 / pkg.nights), // Assume 50% is hotel
      meta: { hotel_class: pkg.hotel_class, meal_plan: 'CP' },
    });

    // Transportation
    items.push({
      day_no: 1,
      item_type: 'cab',
      description: `${requirements.cab_type || 'Sedan'} for transfers and sightseeing`,
      qty: pkg.nights + 1,
      unit_price: Math.round(pkg.base_price * 0.25 / (pkg.nights + 1)), // Assume 25% is cab
      meta: { vehicle_type: requirements.cab_type || 'sedan' },
    });

    // Sightseeing/Activities
    items.push({
      day_no: 1,
      item_type: 'activity',
      description: 'Sightseeing and activities as per itinerary',
      qty: 1,
      unit_price: Math.round(pkg.base_price * 0.25), // Assume 25% is activities
      meta: { highlights: pkg.highlights },
    });
  }

  // Calculate pricing
  const itemsTotal = items.reduce((sum, item) => sum + (item.qty * item.unit_price), 0);
  const baseTotal = Math.max(pkg.base_price * totalPax, itemsTotal * totalPax);
  const taxes = Math.round(baseTotal * 0.05); // 5% GST
  const total = baseTotal + taxes;
  const perPerson = Math.round(total / totalPax);

  // Calculate confidence score
  let confidence = 0.7; // Base confidence
  
  // Increase confidence if nights match exactly
  if (pkg.nights === requirements.nights) confidence += 0.1;
  
  // Increase confidence if hotel class matches
  if (requirements.hotel_class && pkg.hotel_class === requirements.hotel_class) confidence += 0.1;
  
  // Increase confidence based on popularity
  if (pkg.popularity_score > 80) confidence += 0.1;
  
  // Cap confidence at 0.95
  confidence = Math.min(confidence, 0.95);

  return {
    package_id: pkg.id,
    package_title: pkg.title,
    items,
    subtotal: baseTotal,
    taxes,
    total,
    per_person: perPerson,
    confidence,
    inclusions: pkg.inclusions || [],
    exclusions: pkg.exclusions || ['Airfare', 'Personal expenses', 'Anything not mentioned in inclusions'],
    validity_days: 7,
  };
}

/**
 * Generate a custom quote suggestion when no packages match
 */
async function generateCustomSuggestion(
  supabase: any,
  requirements: TripRequirements,
  totalPax: number
): Promise<QuoteSuggestion> {
  const items: QuoteItem[] = [];
  const destination = requirements.destinations[0];

  // Query available vendors/products for this destination
  const { data: products } = await supabase
    .from('products')
    .select('*, vendors(id, name, type)')
    .eq('active', true)
    .ilike('destination', `%${destination}%`)
    .limit(10);

  // Calculate estimated prices based on hotel class
  const hotelPriceMap: Record<string, number> = {
    '3*': 2500,
    '4*': 4500,
    '5*': 8000,
    'luxury': 15000,
  };
  const hotelPricePerNight = hotelPriceMap[requirements.hotel_class || '4*'] || 4500;

  // Add hotel item
  items.push({
    day_no: 1,
    item_type: 'hotel',
    description: `${requirements.hotel_class || '4*'} Hotel in ${destination} - ${requirements.nights} nights`,
    qty: requirements.nights,
    unit_price: hotelPricePerNight,
    meta: { 
      hotel_class: requirements.hotel_class || '4*', 
      meal_plan: 'CP',
      rooms_required: Math.ceil(totalPax / 2),
    },
  });

  // Add transportation
  const cabPriceMap: Record<string, number> = {
    'sedan': 3500,
    'suv': 5000,
    'tempo': 8000,
  };
  const cabPricePerDay = cabPriceMap[requirements.cab_type || 'sedan'] || 3500;

  items.push({
    day_no: 1,
    item_type: 'cab',
    description: `${(requirements.cab_type || 'Sedan').charAt(0).toUpperCase() + (requirements.cab_type || 'sedan').slice(1)} for ${requirements.nights + 1} days`,
    qty: requirements.nights + 1,
    unit_price: cabPricePerDay,
    meta: { vehicle_type: requirements.cab_type || 'sedan' },
  });

  // Add sightseeing
  const sightseeingPrice = 1500 * totalPax;
  items.push({
    day_no: 1,
    item_type: 'activity',
    description: `Sightseeing and local attractions in ${destination}`,
    qty: requirements.nights,
    unit_price: Math.round(sightseeingPrice / requirements.nights),
    meta: { per_person: true },
  });

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.qty * item.unit_price), 0);
  const taxes = Math.round(subtotal * 0.05);
  const total = subtotal + taxes;
  const perPerson = Math.round(total / totalPax);

  return {
    items,
    subtotal,
    taxes,
    total,
    per_person: perPerson,
    confidence: 0.6, // Lower confidence for custom quotes
    inclusions: [
      `${requirements.nights} nights accommodation`,
      'Daily breakfast',
      'Airport/Railway transfers',
      'Local sightseeing',
      `${requirements.cab_type || 'Sedan'} for all transfers`,
    ],
    exclusions: [
      'Airfare/Train tickets',
      'Lunch and dinner',
      'Entry fees to monuments',
      'Personal expenses',
      'Anything not mentioned in inclusions',
    ],
    validity_days: 7,
  };
}
