# Backend Engineer (Services) Guide

**Your Role:** RPC Functions & Edge Functions  
**Sections:** 4, 5  
**Duration:** Week 2-3 (5-6 days total)  
**Dependencies:** Sections 2, 3 must be complete

---

## Overview

You are responsible for implementing business logic:
1. **Section 4**: RPC Functions (3 days) - SQL stored procedures
2. **Section 5**: Edge Functions (2-3 days) - TypeScript serverless functions

Your work enables the Full-Stack Engineer to create the API package (Section 7).

---

## Section 4: RPC Functions (Business Logic)

### Timeline
- **Start**: After Section 3 (RLS) complete
- **Duration**: 3 days
- **Blocks**: Sections 5, 7
- **Reference**: `prompt.md` lines 488-505

### Objective
Create SQL RPC functions for all business operations with validation, audit logging, and error handling.

---

### Step-by-Step Instructions

#### Day 1: Lead Management RPCs

Create `supabase/migrations/[TIMESTAMP]_rpc_leads.sql`:

```sql
-- ==========================================================
-- RPC: LEAD MANAGEMENT
-- ==========================================================

-- Create lead from guest session (soft onboarding)
create or replace function rpc_create_lead_from_guest(
  p_guest_session_id text,
  p_minimal_request jsonb
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_lead_id uuid;
  v_request_doc_id uuid;
begin
  -- Validate input
  if p_guest_session_id is null or p_guest_session_id = '' then
    raise exception 'guest_session_id is required';
  end if;
  
  if p_minimal_request is null then
    raise exception 'minimal_request is required';
  end if;
  
  -- Insert lead
  insert into leads (guest_session_id, source, stage)
  values (p_guest_session_id, 'bot', 'NEW')
  returning id into v_lead_id;
  
  -- Insert request_doc
  insert into request_docs (
    lead_id,
    destinations,
    nights,
    pax_adults,
    capture_mode
  ) values (
    v_lead_id,
    (select jsonb_array_elements_text(p_minimal_request->'destinations'))::text[],
    (p_minimal_request->>'nights')::int,
    (p_minimal_request->>'pax_adults')::int,
    'minimal'
  ) returning id into v_request_doc_id;
  
  -- Audit log
  insert into audit_log (action, entity, entity_id, after)
  values (
    'create_lead_from_guest',
    'leads',
    v_lead_id,
    jsonb_build_object(
      'lead_id', v_lead_id,
      'guest_session_id', p_guest_session_id,
      'request', p_minimal_request
    )
  );
  
  return v_lead_id;
end;
$$;

-- Merge guest leads to authenticated user
create or replace function rpc_merge_guest_to_user(
  p_guest_session_id text
)
returns void
language plpgsql
security definer
as $$
declare
  v_affected_count int;
begin
  -- Validate user is authenticated
  if auth.uid() is null then
    raise exception 'User must be authenticated';
  end if;
  
  -- Update leads to assign to user
  update leads
  set 
    customer_id = auth.uid(),
    guest_session_id = null,
    updated_at = now()
  where guest_session_id = p_guest_session_id;
  
  get diagnostics v_affected_count = row_count;
  
  -- Audit log
  insert into audit_log (actor, action, entity, after)
  values (
    auth.uid(),
    'merge_guest_to_user',
    'leads',
    jsonb_build_object(
      'guest_session_id', p_guest_session_id,
      'leads_merged', v_affected_count
    )
  );
  
  raise notice 'Merged % leads from guest session % to user %',
    v_affected_count, p_guest_session_id, auth.uid();
end;
$$;

-- Update lead stage
create or replace function rpc_update_lead_stage(
  p_lead_id uuid,
  p_new_stage text
)
returns void
language plpgsql
security definer
as $$
declare
  v_old_stage text;
begin
  -- Validate stage
  if p_new_stage not in ('NEW','SCOPING','QUOTED','WON','LOST') then
    raise exception 'Invalid stage: %', p_new_stage;
  end if;
  
  -- Get old stage
  select stage into v_old_stage from leads where id = p_lead_id;
  
  -- Update stage
  update leads
  set stage = p_new_stage, updated_at = now()
  where id = p_lead_id;
  
  -- Audit log
  insert into audit_log (actor, action, entity, entity_id, before, after)
  values (
    auth.uid(),
    'update_lead_stage',
    'leads',
    p_lead_id,
    jsonb_build_object('stage', v_old_stage),
    jsonb_build_object('stage', p_new_stage)
  );
end;
$$;
```

#### Day 1-2: Quote Management RPCs

Create `supabase/migrations/[TIMESTAMP]_rpc_quotes.sql`:

```sql
-- ==========================================================
-- RPC: QUOTE MANAGEMENT
-- ==========================================================

-- Send quote (freeze snapshot, mark immutable)
create or replace function rpc_send_quote(
  p_quote_id uuid
)
returns void
language plpgsql
security definer
as $$
declare
  v_quote_data jsonb;
  v_items jsonb;
  v_lead_id uuid;
begin
  -- Get quote data
  select 
    to_jsonb(q.*),
    q.lead_id
  into v_quote_data, v_lead_id
  from quotes q
  where q.id = p_quote_id;
  
  if v_quote_data is null then
    raise exception 'Quote not found: %', p_quote_id;
  end if;
  
  -- Get quote items
  select jsonb_agg(to_jsonb(qi.*))
  into v_items
  from quote_items qi
  where qi.quote_id = p_quote_id;
  
  -- Build complete snapshot
  v_quote_data := v_quote_data || jsonb_build_object('items', v_items);
  
  -- Update quote with snapshot
  update quotes
  set 
    status = 'SENT',
    snapshot = v_quote_data
  where id = p_quote_id;
  
  -- Update lead stage
  update leads
  set stage = 'QUOTED', updated_at = now()
  where id = v_lead_id;
  
  -- Audit log
  insert into audit_log (actor, action, entity, entity_id, after)
  values (
    auth.uid(),
    'send_quote',
    'quotes',
    p_quote_id,
    v_quote_data
  );
  
  raise notice 'Quote % sent and snapshot frozen', p_quote_id;
end;
$$;

-- Accept quote → create booking
create or replace function rpc_accept_quote(
  p_quote_id uuid
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_booking_id uuid;
  v_quote_snapshot jsonb;
  v_lead_id uuid;
  v_customer_id uuid;
begin
  -- Validate user is authenticated
  if auth.uid() is null then
    raise exception 'User must be authenticated';
  end if;
  
  -- Get quote snapshot and lead
  select snapshot, lead_id into v_quote_snapshot, v_lead_id
  from quotes
  where id = p_quote_id;
  
  if v_quote_snapshot is null then
    raise exception 'Quote must be SENT before acceptance';
  end if;
  
  -- Get customer_id from lead
  select customer_id into v_customer_id from leads where id = v_lead_id;
  
  if v_customer_id != auth.uid() then
    raise exception 'Only the lead owner can accept the quote';
  end if;
  
  -- Create booking
  insert into bookings (quote_id, customer_id, status, price_snapshot)
  values (
    p_quote_id,
    auth.uid(),
    'PENDING_VENDOR_CONFIRM',
    v_quote_snapshot
  )
  returning id into v_booking_id;
  
  -- Update quote status
  update quotes
  set status = 'ACCEPTED'
  where id = p_quote_id;
  
  -- Update lead stage
  update leads
  set stage = 'WON', updated_at = now()
  where id = v_lead_id;
  
  -- Audit log
  insert into audit_log (actor, action, entity, entity_id, after)
  values (
    auth.uid(),
    'accept_quote',
    'bookings',
    v_booking_id,
    jsonb_build_object(
      'booking_id', v_booking_id,
      'quote_id', p_quote_id
    )
  );
  
  return v_booking_id;
end;
$$;

-- Create new quote version
create or replace function rpc_create_quote_version(
  p_parent_quote_id uuid
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_new_quote_id uuid;
  v_lead_id uuid;
  v_next_version int;
  v_parent_data record;
begin
  -- Get parent quote data
  select * into v_parent_data
  from quotes
  where id = p_parent_quote_id;
  
  if v_parent_data is null then
    raise exception 'Parent quote not found';
  end if;
  
  v_lead_id := v_parent_data.lead_id;
  
  -- Get next version number
  select coalesce(max(version), 0) + 1
  into v_next_version
  from quotes
  where lead_id = v_lead_id;
  
  -- Create new quote
  insert into quotes (
    lead_id,
    version,
    parent_quote_id,
    status,
    total_amount,
    currency,
    inclusions,
    exclusions,
    validity_date,
    created_by
  ) values (
    v_lead_id,
    v_next_version,
    p_parent_quote_id,
    'DRAFT',
    v_parent_data.total_amount,
    v_parent_data.currency,
    v_parent_data.inclusions,
    v_parent_data.exclusions,
    v_parent_data.validity_date,
    auth.uid()
  )
  returning id into v_new_quote_id;
  
  -- Copy quote items
  insert into quote_items (quote_id, day_no, item_type, vendor_id, description, qty, unit_price, meta)
  select v_new_quote_id, day_no, item_type, vendor_id, description, qty, unit_price, meta
  from quote_items
  where quote_id = p_parent_quote_id;
  
  -- Audit log
  insert into audit_log (actor, action, entity, entity_id, after)
  values (
    auth.uid(),
    'create_quote_version',
    'quotes',
    v_new_quote_id,
    jsonb_build_object(
      'parent_quote_id', p_parent_quote_id,
      'version', v_next_version
    )
  );
  
  return v_new_quote_id;
end;
$$;
```

#### Day 2: Booking & PO RPCs

Create `supabase/migrations/[TIMESTAMP]_rpc_bookings.sql`:

```sql
-- ==========================================================
-- RPC: BOOKING & PO MANAGEMENT
-- ==========================================================

-- Confirm booking if all vouchers uploaded
create or replace function rpc_confirm_booking_if_ready(
  p_booking_id uuid
)
returns boolean
language plpgsql
security definer
as $$
declare
  v_voucher_count int;
  v_po_count int;
  v_ready boolean := false;
begin
  -- Count POs and vouchers
  select count(*) into v_po_count
  from pos
  where booking_id = p_booking_id
  and status != 'DECLINED';
  
  select count(*) into v_voucher_count
  from vouchers
  where booking_id = p_booking_id
  and verified = true;
  
  -- Check if all POs have vouchers
  if v_po_count > 0 and v_voucher_count >= v_po_count then
    -- Update booking status
    update bookings
    set status = 'CONFIRMED'
    where id = p_booking_id;
    
    v_ready := true;
    
    -- Create trip
    perform rpc_create_trip_from_booking(p_booking_id);
    
    -- Audit log
    insert into audit_log (actor, action, entity, entity_id, after)
    values (
      auth.uid(),
      'confirm_booking',
      'bookings',
      p_booking_id,
      jsonb_build_object('pos_count', v_po_count, 'voucher_count', v_voucher_count)
    );
  end if;
  
  return v_ready;
end;
$$;

-- Upload voucher
create or replace function rpc_upload_voucher(
  p_booking_id uuid,
  p_vendor_id uuid,
  p_file_url text,
  p_meta jsonb default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_voucher_id uuid;
  v_verified boolean := false;
begin
  -- Basic validation of meta data
  if p_meta is not null then
    if p_meta ? 'guest_name' and p_meta ? 'check_in' then
      v_verified := true;
    end if;
  end if;
  
  -- Insert voucher
  insert into vouchers (booking_id, vendor_id, file_url, meta, verified)
  values (p_booking_id, p_vendor_id, p_file_url, p_meta, v_verified)
  returning id into v_voucher_id;
  
  -- Update PO status
  update pos
  set status = 'CONFIRMED'
  where booking_id = p_booking_id
  and vendor_id = p_vendor_id
  and status = 'ACCEPTED';
  
  -- Audit log
  insert into audit_log (actor, action, entity, entity_id, after)
  values (
    auth.uid(),
    'upload_voucher',
    'vouchers',
    v_voucher_id,
    jsonb_build_object('booking_id', p_booking_id, 'vendor_id', p_vendor_id)
  );
  
  -- Check if booking can be confirmed
  perform rpc_confirm_booking_if_ready(p_booking_id);
  
  return v_voucher_id;
end;
$$;

-- Submit cancellation request
create or replace function rpc_submit_cancellation(
  p_booking_id uuid,
  p_reason text
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_cancellation_id uuid;
  v_policy jsonb;
begin
  -- Build policy snapshot (simplified)
  v_policy := jsonb_build_object(
    'requested_at', now(),
    'reason', p_reason
  );
  
  -- Insert cancellation request
  insert into cancellations (booking_id, requested_by, reason, policy_snapshot, status)
  values (p_booking_id, auth.uid(), p_reason, v_policy, 'REQUESTED')
  returning id into v_cancellation_id;
  
  -- Audit log
  insert into audit_log (actor, action, entity, entity_id, after)
  values (
    auth.uid(),
    'submit_cancellation',
    'cancellations',
    v_cancellation_id,
    jsonb_build_object('booking_id', p_booking_id, 'reason', p_reason)
  );
  
  return v_cancellation_id;
end;
$$;
```

#### Day 3: Trip & Incident RPCs

Create `supabase/migrations/[TIMESTAMP]_rpc_trips.sql`:

```sql
-- ==========================================================
-- RPC: TRIP & INCIDENT MANAGEMENT
-- ==========================================================

-- Create trip from confirmed booking
create or replace function rpc_create_trip_from_booking(
  p_booking_id uuid
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_trip_id uuid;
  v_customer_id uuid;
  v_title text;
  v_start_date date;
  v_end_date date;
begin
  -- Get booking details
  select 
    customer_id,
    price_snapshot->>'title',
    (price_snapshot->>'start_date')::date,
    (price_snapshot->>'end_date')::date
  into v_customer_id, v_title, v_start_date, v_end_date
  from bookings
  where id = p_booking_id;
  
  -- Create trip
  insert into trips (booking_id, title, start_date, end_date)
  values (p_booking_id, coalesce(v_title, 'Your Trip'), v_start_date, v_end_date)
  returning id into v_trip_id;
  
  -- Add customer as trip member
  insert into trip_members (trip_id, user_id, role, display_name)
  select v_trip_id, id, 'customer', display_name
  from profiles
  where id = v_customer_id;
  
  -- Add operators as trip members
  insert into trip_members (trip_id, user_id, role, display_name)
  select v_trip_id, id, 'operator', display_name
  from profiles
  where role = 'operator'
  limit 1; -- Assign one operator
  
  -- Create welcome post
  insert into trip_posts (trip_id, kind, content, scheduled_at, status)
  values (
    v_trip_id,
    'announcement',
    jsonb_build_object(
      'title', 'Welcome to your trip!',
      'body', 'We''re excited to have you with us. Your trip details are ready.'
    ),
    now(),
    'SCHEDULED'
  );
  
  -- Audit log
  insert into audit_log (actor, action, entity, entity_id, after)
  values (
    auth.uid(),
    'create_trip',
    'trips',
    v_trip_id,
    jsonb_build_object('booking_id', p_booking_id)
  );
  
  return v_trip_id;
end;
$$;

-- Raise incident
create or replace function rpc_raise_incident(
  p_trip_id uuid,
  p_severity text,
  p_category text,
  p_description text
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_incident_id uuid;
begin
  -- Validate severity
  if p_severity not in ('P0','P1','P2') then
    raise exception 'Invalid severity. Must be P0, P1, or P2';
  end if;
  
  -- Insert incident
  insert into incidents (trip_id, created_by, severity, category, description, status)
  values (p_trip_id, auth.uid(), p_severity, p_category, p_description, 'OPEN')
  returning id into v_incident_id;
  
  -- If P0, create immediate notification
  if p_severity = 'P0' then
    insert into notifications_outbox (user_id, kind, title, body, data_json)
    select 
      user_id,
      'incident_p0',
      'EMERGENCY: ' || p_category,
      p_description,
      jsonb_build_object('incident_id', v_incident_id, 'trip_id', p_trip_id)
    from trip_members
    where trip_id = p_trip_id
    and role = 'operator';
  end if;
  
  -- Audit log
  insert into audit_log (actor, action, entity, entity_id, after)
  values (
    auth.uid(),
    'raise_incident',
    'incidents',
    v_incident_id,
    jsonb_build_object(
      'trip_id', p_trip_id,
      'severity', p_severity,
      'category', p_category
    )
  );
  
  return v_incident_id;
end;
$$;

-- Record trip post acknowledgment (quick action)
create or replace function rpc_record_post_action(
  p_post_id uuid,
  p_action_id text,
  p_payload jsonb default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_ack_id uuid;
  v_trip_id uuid;
begin
  -- Get trip_id from post
  select trip_id into v_trip_id
  from trip_posts
  where id = p_post_id;
  
  -- Insert acknowledgment
  insert into trip_post_acks (post_id, user_id, action_id, payload)
  values (p_post_id, auth.uid(), p_action_id, p_payload)
  on conflict (post_id, user_id, action_id) do update
  set payload = p_payload, created_at = now()
  returning id into v_ack_id;
  
  -- If action is request_change, create incident
  if p_action_id = 'request_change' then
    perform rpc_raise_incident(
      v_trip_id,
      'P2',
      'other',
      coalesce(p_payload->>'note', 'Change requested from trip post')
    );
  end if;
  
  -- Audit log
  insert into audit_log (actor, action, entity, entity_id, after)
  values (
    auth.uid(),
    'record_post_action',
    'trip_post_acks',
    v_ack_id,
    jsonb_build_object('post_id', p_post_id, 'action_id', p_action_id)
  );
  
  return v_ack_id;
end;
$$;
```

#### Day 3: Test RPCs

Create `supabase/tests/rpc_test.sql`:

```sql
-- Test lead creation
do $$
declare
  v_lead_id uuid;
begin
  select rpc_create_lead_from_guest(
    'test-guest-123',
    '{"destinations": ["Udaipur"], "nights": 4, "pax_adults": 2}'::jsonb
  ) into v_lead_id;
  
  assert v_lead_id is not null, 'Lead should be created';
  raise notice 'PASS: Lead created %', v_lead_id;
end $$;
```

Test all RPCs:
```bash
psql $DATABASE_URL -f supabase/tests/rpc_test.sql
```

### Deliverables Checklist - Section 4

- [ ] Lead RPCs (create, merge, update stage)
- [ ] Quote RPCs (send, accept, create version)
- [ ] Booking RPCs (confirm, upload voucher, cancel)
- [ ] Trip RPCs (create, raise incident, record action)
- [ ] All RPCs write to audit_log
- [ ] All RPCs validate inputs
- [ ] Error messages clear and helpful
- [ ] Test scripts passing

---

## Section 5: Edge Functions

### Timeline
- **Start**: After Section 4
- **Duration**: 2-3 days
- **Reference**: `prompt.md` lines 339-369

### Objective
Create TypeScript edge functions for PDF generation, schedulers, and monitoring.

---

### Step-by-Step Instructions

#### Day 1: PDF Quote Generator

```bash
supabase functions new pdf_generate_quote
```

Edit `supabase/functions/pdf_generate_quote/index.ts`:

```typescript
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
          ${quote.quote_items.map((item: any) => `
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
```

Deploy:
```bash
supabase functions deploy pdf_generate_quote
```

#### Day 2: Scheduler - Post Runner

```bash
supabase functions new scheduler_post_runner
```

Edit `supabase/functions/scheduler_post_runner/index.ts`:

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find scheduled posts that are due
    const { data: posts, error: fetchError } = await supabase
      .from('trip_posts')
      .select('*, trips!inner(trip_members(user_id))')
      .eq('status', 'SCHEDULED')
      .lte('scheduled_at', new Date().toISOString());

    if (fetchError) throw fetchError;

    console.log(`Found ${posts?.length || 0} posts to process`);

    for (const post of posts || []) {
      // Mark as posted
      await supabase
        .from('trip_posts')
        .update({ status: 'POSTED', posted_at: new Date().toISOString() })
        .eq('id', post.id);

      // Create notifications for trip members
      const notifications = post.trips.trip_members.map((member: any) => ({
        user_id: member.user_id,
        kind: 'trip_post',
        title: post.content.title || 'Trip Update',
        body: post.content.body || '',
        data_json: { post_id: post.id, trip_id: post.trip_id },
      }));

      await supabase
        .from('notifications_outbox')
        .insert(notifications);

      // Audit log
      await supabase
        .from('audit_log')
        .insert({
          action: 'post_trip_update',
          entity: 'trip_posts',
          entity_id: post.id,
          after: { status: 'POSTED' },
        });

      console.log(`Processed post ${post.id}`);
    }

    return new Response(
      JSON.stringify({ processed: posts?.length || 0 }),
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
```

Deploy and set cron:
```bash
supabase functions deploy scheduler_post_runner

# In Supabase dashboard: Database → Cron Jobs
# Schedule: */1 * * * * (every minute)
# Command: SELECT net.http_post(
#   url:='https://[project].supabase.co/functions/v1/scheduler_post_runner',
#   headers:='{"Authorization": "Bearer [service_role_key]"}'::jsonb
# );
```

#### Day 2: SLA Monitor

```bash
supabase functions new sla_monitor
```

Edit `supabase/functions/sla_monitor/index.ts`:

```typescript
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

      if (operators) {
        await supabase
          .from('notifications_outbox')
          .insert(
            operators.map((op) => ({
              user_id: op.id,
              kind: 'sla_breach',
              title: 'SLA Breach',
              body: `PO from ${po.vendors.name} is overdue`,
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
```

Deploy and schedule (every 15 minutes).

#### Day 3: Recap Generator

```bash
supabase functions new recap_generator
```

Edit `supabase/functions/recap_generator/index.ts`:

```typescript
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
      const customer = trip.trip_members.find((m: any) => m.role === 'customer');
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
```

Deploy and schedule (daily at 1 AM).

### Deliverables Checklist - Section 5

- [ ] PDF generate quote function deployed
- [ ] Scheduler post runner deployed with cron
- [ ] SLA monitor deployed with cron
- [ ] Recap generator deployed with cron
- [ ] All functions log errors properly
- [ ] Test invocations successful
- [ ] Cron jobs scheduled in Supabase

---

## Resources

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Deno Deploy](https://deno.com/deploy/docs)
- [PostgreSQL Functions](https://www.postgresql.org/docs/current/sql-createfunction.html)

---

## Success Criteria

✅ Section 4 Complete When:
- All RPCs callable via curl
- Audit log populated on mutations
- Error handling comprehensive
- Test scripts pass

✅ Section 5 Complete When:
- All 4 edge functions deployed
- Cron jobs running
- Logs show successful executions
- No runtime errors

---

**Next Steps:**
Notify Full-Stack Engineer: "RPC functions and edge functions complete. Section 7 (API Package) can now proceed."

