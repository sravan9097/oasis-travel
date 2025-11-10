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
  v_price_snapshot jsonb;
begin
  -- Get booking details
  select 
    customer_id,
    price_snapshot
  into v_customer_id, v_price_snapshot
  from bookings
  where id = p_booking_id;
  
  if v_customer_id is null then
    raise exception 'Booking not found: %', p_booking_id;
  end if;
  
  -- Extract trip details from price_snapshot
  -- Try to get title, start_date, end_date from snapshot
  v_title := coalesce(v_price_snapshot->>'title', 'Your Trip');
  v_start_date := (v_price_snapshot->>'start_date')::date;
  v_end_date := (v_price_snapshot->>'end_date')::date;
  
  -- If not in snapshot, try to get from request_docs
  if v_start_date is null or v_end_date is null then
    select 
      rd.start_date,
      rd.end_date
    into v_start_date, v_end_date
    from bookings b
    join quotes q on q.id = b.quote_id
    join leads l on l.id = q.lead_id
    join request_docs rd on rd.lead_id = l.id
    where b.id = p_booking_id
    limit 1;
  end if;
  
  -- Create trip
  insert into trips (booking_id, title, start_date, end_date)
  values (
    p_booking_id, 
    v_title, 
    coalesce(v_start_date, current_date), 
    coalesce(v_end_date, current_date + interval '7 days')
  )
  returning id into v_trip_id;
  
  -- Add customer as trip member
  insert into trip_members (trip_id, user_id, role, display_name)
  select v_trip_id, id, 'customer', display_name
  from profiles
  where id = v_customer_id
  on conflict do nothing;
  
  -- Add operators as trip members
  insert into trip_members (trip_id, user_id, role, display_name)
  select v_trip_id, id, 'operator', display_name
  from profiles
  where role = 'operator'
  limit 1
  on conflict do nothing;
  
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
  -- Validate user is authenticated
  if auth.uid() is null then
    raise exception 'User must be authenticated';
  end if;
  
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
  -- Validate user is authenticated
  if auth.uid() is null then
    raise exception 'User must be authenticated';
  end if;
  
  -- Get trip_id from post
  select trip_id into v_trip_id
  from trip_posts
  where id = p_post_id;
  
  if v_trip_id is null then
    raise exception 'Post not found: %', p_post_id;
  end if;
  
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

