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
  -- Validate user is authenticated
  if auth.uid() is null then
    raise exception 'User must be authenticated';
  end if;
  
  -- Build policy snapshot (simplified)
  v_policy := jsonb_build_object(
    'requested_at', now(),
    'reason', p_reason
  );
  
  -- Insert cancellation request
  insert into cancellations (booking_id, requested_by, reason, policy_snapshot, status)
  values (p_booking_id, auth.uid(), p_reason, v_policy, 'REQUESTED')
  returning id into v_cancellation_id;
  
  -- Update booking status
  update bookings
  set status = 'CANCELLED'
  where id = p_booking_id;
  
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

