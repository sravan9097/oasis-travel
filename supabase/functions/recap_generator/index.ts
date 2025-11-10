import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find trips that ended yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const { data: trips, error } = await supabase
      .from('trips')
      .select('*, bookings(*), trip_members(*)')
      .eq('end_date', yesterdayStr);

    if (error) throw error;

    console.log(`Found ${trips?.length || 0} trips to generate recaps for`);

    for (const trip of trips || []) {
      // Generate recap HTML
      const html = generateRecapHTML(trip);
      const filename = `${trip.id}/recap.html`;

      await supabase.storage
        .from('recaps')
        .upload(filename, new Blob([html], { type: 'text/html' }), {
          upsert: true,
        });

      // Notify customer
      const customer = trip.trip_members?.find((m: any) => m.role === 'customer');
      if (customer) {
        await supabase
          .from('notifications_outbox')
          .insert({
            user_id: customer.user_id,
            kind: 'trip_recap',
            title: 'Your Trip Recap',
            body: `Thank you for traveling with us! Your trip recap is ready.`,
            data_json: { trip_id: trip.id, recap_url: filename },
          });
      }

      console.log(`Recap generated for trip ${trip.id}`);
    }

    return new Response(
      JSON.stringify({ recaps_generated: trips?.length || 0 }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

function generateRecapHTML(trip: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Trip Recap: ${trip.title}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { color: #0066CC; }
      </style>
    </head>
    <body>
      <h1>${trip.title}</h1>
      <p>Thank you for traveling with Oasis Travel!</p>
      <p><strong>Dates:</strong> ${trip.start_date} to ${trip.end_date}</p>
      <p>We hope you had a wonderful experience. We'd love to hear your feedback!</p>
    </body>
    </html>
  `;
}

