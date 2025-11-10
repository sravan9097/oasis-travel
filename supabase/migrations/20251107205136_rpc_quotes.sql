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
  v_quote_data := v_quote_data || jsonb_build_object('items', coalesce(v_items, '[]'::jsonb));
  
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
    jsonb_build_object('quote_id', p_quote_id, 'status', 'SENT')
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
  
  if v_customer_id is null or v_customer_id != auth.uid() then
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

