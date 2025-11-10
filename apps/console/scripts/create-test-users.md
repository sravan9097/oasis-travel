# Create Test Users for Development

To enable quick login for testing, you need to create test users in Supabase Auth.

## Option 1: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** > **Users**
3. Click **Add User** > **Create new user**
4. Create users with these emails:
   - `admin@oasistravel.com` (role: admin)
   - `operator@oasistravel.com` (role: operator)

## Option 2: Using Supabase CLI

```bash
# Create admin user
supabase auth admin create-user \
  --email admin@oasistravel.com \
  --email-confirmed \
  --user-metadata '{"role": "admin"}'

# Create operator user  
supabase auth admin create-user \
  --email operator@oasistravel.com \
  --email-confirmed \
  --user-metadata '{"role": "operator"}'
```

## Option 3: Using SQL (if you have direct DB access)

```sql
-- Note: This requires the users to exist in auth.users first
-- You'll need to create them via Auth API or Dashboard first

-- Then update profiles
INSERT INTO profiles (id, role, display_name, email) VALUES
  ((SELECT id FROM auth.users WHERE email = 'admin@oasistravel.com'), 'admin', 'Admin User', 'admin@oasistravel.com'),
  ((SELECT id FROM auth.users WHERE email = 'operator@oasistravel.com'), 'operator', 'Operator User', 'operator@oasistravel.com')
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role;
```

## Option 4: Using Setup Script

Run the automated setup script:

```bash
cd apps/console/scripts
./setup-test-users.sh
```

This will create both admin and operator test users automatically.

## Getting OTP Codes for Local Development

In local Supabase development, OTP codes are **printed to the logs** instead of being sent via email.

### To see OTP codes:

1. **Watch Supabase logs:**
   ```bash
   supabase logs --follow
   ```

2. **Request OTP** from the login page

3. **Look for the OTP code** in the logs output. It will appear like:
   ```
   OTP for admin@oasistravel.com: 123456
   ```

4. **Use that code** to login

### Alternative: Use Magic Links

Instead of OTP codes, you can:
1. Click "Send OTP" on the login page
2. Check your email (if configured) or Supabase logs for the magic link
3. Click the magic link to automatically sign in

## After Creating Users

Once users are created:
- **Quick Login**: Use the "Quick Login" buttons on the login page (development mode only)
- **Manual Login**: 
  - Enter email: `admin@oasistravel.com` or `operator@oasistravel.com`
  - Click "Send OTP"
  - Check `supabase logs --follow` for the OTP code
  - Enter the OTP code from logs
- **Magic Link**: Click the magic link sent via email (if email is configured) or check logs

