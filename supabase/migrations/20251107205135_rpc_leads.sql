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
    (select array_agg(value::text) from jsonb_array_elements_text(p_minimal_request->'destinations')),
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
  
  if v_old_stage is null then
    raise exception 'Lead not found: %', p_lead_id;
  end if;
  
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

