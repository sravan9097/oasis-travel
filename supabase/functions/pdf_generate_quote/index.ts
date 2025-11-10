import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { quote_id } = await req.json();

    if (!quote_id) {
      throw new Error('quote_id is required');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch quote with items
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*, quote_items(*), leads!inner(request_docs(*))')
      .eq('id', quote_id)
      .single();

    if (quoteError || !quote) {
      throw new Error('Quote not found');
    }

    // Generate HTML
    const html = generateQuoteHTML(quote);

    // For now, upload HTML (in production, use puppeteer to convert to PDF)
    const filename = `${quote.lead_id}/${quote_id}.html`;
    
    const { error: uploadError } = await supabase.storage
      .from('quotes')
      .upload(filename, new Blob([html], { type: 'text/html' }), {
        upsert: true,
      });

    if (uploadError) throw uploadError;

    // Update quote with PDF URL
    await supabase
      .from('quotes')
      .update({ pdf_url: filename })
      .eq('id', quote_id);

    return new Response(
      JSON.stringify({ success: true, pdf_url: filename }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateQuoteHTML(quote: any): string {
  const items = quote.quote_items || [];
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Quote #${quote.version}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #0066CC; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f2f2f2; }
        .total { font-size: 1.2em; font-weight: bold; text-align: right; }
      </style>
    </head>
    <body>
      <h1>Travel Quote</h1>
      <p><strong>Quote Version:</strong> ${quote.version}</p>
      <p><strong>Valid Until:</strong> ${quote.validity_date || 'N/A'}</p>
      
      <h2>Itinerary</h2>
      <table>
        <thead>
          <tr>
            <th>Day</th>
            <th>Type</th>
            <th>Description</th>
            <th>Qty</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item: any) => `
            <tr>
              <td>${item.day_no || '-'}</td>
              <td>${item.item_type}</td>
              <td>${item.description}</td>
              <td>${item.qty}</td>
              <td>${item.unit_price} ${quote.currency}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <p class="total">Total: ${quote.total_amount} ${quote.currency}</p>
      
      <h2>Inclusions</h2>
      <p>${quote.inclusions || 'N/A'}</p>
      
      <h2>Exclusions</h2>
      <p>${quote.exclusions || 'N/A'}</p>
    </body>
    </html>
  `;
}

