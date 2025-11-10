# Storage Buckets & Policies Documentation

## Overview

Section 6 implements private storage buckets with role-based access control for the Oasis Travel platform.

## Buckets Created

All buckets are **private** (not publicly accessible):

1. **`vouchers`** - Vendor confirmation documents
   - Path: `vouchers/{booking_id}/{vendor_id}/{filename}.pdf`
   - Upload: Vendors can upload to their own vendor folder
   - Read: Customers (for their bookings), Operators (all)

2. **`quotes`** - Quote PDF documents
   - Path: `quotes/{lead_id}/{quote_id}.pdf`
   - Upload: Operators only
   - Read: Customers (for their leads), Operators (all)

3. **`itineraries`** - Trip itinerary documents
   - Path: `itineraries/{trip_id}/{filename}.pdf`
   - Upload: Operators only
   - Read: Trip members, Operators (all)

4. **`recaps`** - Trip recap documents
   - Path: `recaps/{trip_id}/{filename}.pdf`
   - Upload: Operators only
   - Read: Trip members, Operators (all)

5. **`avatars`** - User profile pictures
   - Path: `avatars/{user_id}/{filename}`
   - Upload: Users can upload their own avatar
   - Read: All authenticated users
   - Delete: Users can delete their own avatar

## Access Policies

### Vouchers Bucket

**Vendors can upload:**
- Must be authenticated
- Can only upload to paths where `{vendor_id}` matches their vendor ID
- Path format: `vouchers/{booking_id}/{vendor_id}/{filename}.pdf`

**Customers can read:**
- Can read vouchers for their own bookings
- Path must match: `vouchers/{booking_id}/{vendor_id}/{filename}.pdf`
- Where `{booking_id}` belongs to the customer

**Operators can manage:**
- Full access to all vouchers (upload, read, update, delete)

### Quotes Bucket

**Customers can read:**
- Can read quotes for their own leads
- Path format: `quotes/{lead_id}/{quote_id}.pdf`
- Where `{lead_id}` belongs to the customer

**Operators can manage:**
- Full access to all quotes

### Itineraries & Recaps Buckets

**Trip members can read:**
- Can read documents for trips they're members of
- Path format: `itineraries/{trip_id}/{filename}.pdf` or `recaps/{trip_id}/{filename}.pdf`
- Where `{trip_id}` is a trip they're a member of

**Operators can manage:**
- Full access to all documents

### Avatars Bucket

**Users can upload:**
- Can upload to their own user folder
- Path format: `avatars/{user_id}/{filename}`
- Where `{user_id}` matches their auth.uid()

**All authenticated users can read:**
- Can read any avatar (for displaying user profiles)

**Users can delete:**
- Can delete their own avatar

## Signed URL Function

The `rpc_sign_url()` function generates short-lived signed URLs for storage objects.

### Function Signature

```sql
rpc_sign_url(
  p_bucket text,      -- Bucket name (vouchers, quotes, itineraries, recaps, avatars)
  p_path text,        -- Full path to the file
  p_ttl_seconds int   -- Time-to-live in seconds (default: 300)
)
```

### Usage Example

```sql
-- Generate a signed URL valid for 5 minutes
SELECT rpc_sign_url('vouchers', 'abc123/vendor456/voucher.pdf', 300);

-- Generate a signed URL valid for 1 hour
SELECT rpc_sign_url('quotes', 'lead789/quote012/quote.pdf', 3600);
```

### Security

- Validates bucket name (only allows predefined buckets)
- Checks if file exists before generating URL
- RLS policies ensure user has SELECT permission
- Returns error if file doesn't exist or user lacks access

**Note**: In production, signed URLs should be generated using the Supabase Storage API client SDK, not this SQL function. This function is provided as a convenience for server-side operations.

## Path Conventions

All storage paths follow strict conventions for security and organization:

```
vouchers/{booking_id}/{vendor_id}/{filename}.pdf
quotes/{lead_id}/{quote_id}.pdf
itineraries/{trip_id}/{filename}.pdf
recaps/{trip_id}/{filename}.pdf
avatars/{user_id}/{filename}
```

Where:
- `{booking_id}`, `{lead_id}`, `{trip_id}`, `{user_id}`, `{vendor_id}` are UUIDs
- `{filename}` can be any valid filename with extension

## Testing

### Manual Testing

1. **Verify buckets exist:**
   ```bash
   # In Supabase Studio: http://127.0.0.1:54323/storage/buckets
   # Or via API:
   curl -X GET "http://127.0.0.1:54321/storage/v1/bucket" \
     -H "apikey: YOUR_ANON_KEY" \
     -H "Authorization: Bearer YOUR_ANON_KEY"
   ```

2. **Test upload (as vendor):**
   ```javascript
   // Using Supabase JS client
   const { data, error } = await supabase.storage
     .from('vouchers')
     .upload('booking-id/vendor-id/voucher.pdf', file)
   ```

3. **Test signed URL:**
   ```sql
   SELECT rpc_sign_url('vouchers', 'booking-id/vendor-id/voucher.pdf', 300);
   ```

### Automated Testing

Run the test script:
```bash
cd supabase/tests
./storage_test.sh
```

## Migration Files

- `20251107110610_storage_buckets.sql` - Creates all 5 buckets
- `20251107110612_storage_policies.sql` - Creates all storage policies
- `20251107110611_rpc_sign_url.sql` - Creates signed URL function

## Deployment Status

✅ All migrations have been pushed to remote database:
- Buckets created
- Policies active
- Signed URL function available

## Next Steps

1. **Frontend Integration:**
   - Use Supabase Storage client SDK in mobile/web apps
   - Implement file upload UI for vouchers and avatars
   - Display signed URLs for document viewing

2. **Edge Functions (Section 5):**
   - PDF generation for quotes
   - Document processing for vouchers

3. **Testing:**
   - Integration tests for upload/download flows
   - RLS policy verification tests
   - Signed URL expiration tests

## Troubleshooting

### "Bucket not found" error
- Verify bucket exists: Check Supabase Studio
- Ensure migration `20251107110610_storage_buckets.sql` was applied

### "Permission denied" error
- Check RLS policies are active
- Verify user role (customer, vendor, operator)
- Check path format matches convention

### "File not found" in signed URL
- Verify file exists in bucket
- Check path is correct (case-sensitive)
- Ensure user has SELECT permission via RLS

### Upload fails
- Check user is authenticated
- Verify path format matches policy requirements
- For vendors: ensure vendor_id in path matches their vendor ID

