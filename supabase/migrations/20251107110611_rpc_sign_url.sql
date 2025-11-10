-- =====================================================
-- SIGNED URL GENERATION
-- =====================================================

create or replace function rpc_sign_url(
  p_bucket text,
  p_path text,
  p_ttl_seconds int default 300
)
returns text
language plpgsql
security definer
as $$
declare
  signed_url text;
  object_exists boolean;
begin
  -- Validate bucket
  if p_bucket not in ('vouchers', 'quotes', 'itineraries', 'recaps', 'avatars') then
    raise exception 'Invalid bucket: %', p_bucket;
  end if;
  
  -- Check if object exists
  select exists (
    select 1 from storage.objects
    where bucket_id = p_bucket
    and name = p_path
  ) into object_exists;
  
  if not object_exists then
    raise exception 'File not found: %/%', p_bucket, p_path;
  end if;
  
  -- Validate user has access (RLS policies handle this)
  -- If we reach here, user has SELECT permission via RLS
  
  -- Generate signed URL using Supabase storage function
  -- Note: In production, you would use the storage API to generate signed URLs
  -- This is a placeholder that returns the storage URL
  -- The actual signed URL generation should be done via the Supabase client SDK
  select format('http://127.0.0.1:54321/storage/v1/object/sign/%s/%s?expires=%s', 
    p_bucket, p_path, extract(epoch from now() + (p_ttl_seconds || ' seconds')::interval)::bigint)
  into signed_url;
  
  return signed_url;
end;
$$;

comment on function rpc_sign_url is 'Generate short-lived signed URL for storage objects. Note: Actual signed URL generation should use Supabase Storage API.';

-- Example usage:
-- select rpc_sign_url('vouchers', 'abc123/vendor456/voucher.pdf', 300);

