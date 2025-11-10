import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find overdue POs
    const { data: overduePOs, error } = await supabase
      .from('pos')
      .select('*, vendors(name)')
      .in('status', ['SENT', 'ACCEPTED'])
      .lt('due_at', new Date().toISOString());

    if (error) throw error;

    console.log(`Found ${overduePOs?.length || 0} overdue POs`);

    for (const po of overduePOs || []) {
      // Create notification for operators
      const { data: operators } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'operator');

      if (operators && operators.length > 0) {
        await supabase
          .from('notifications_outbox')
          .insert(
            operators.map((op) => ({
              user_id: op.id,
              kind: 'sla_breach',
              title: 'SLA Breach',
              body: `PO from ${po.vendors?.name || 'Unknown Vendor'} is overdue`,
              data_json: { po_id: po.id, booking_id: po.booking_id },
            }))
          );
      }

      console.log(`SLA alert created for PO ${po.id}`);
    }

    return new Response(
      JSON.stringify({ overdue_pos: overduePOs?.length || 0 }),
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

