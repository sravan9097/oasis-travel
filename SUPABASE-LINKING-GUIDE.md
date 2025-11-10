# Supabase CLI Update & Project Linking Guide

## Updating Supabase CLI

Your current version is **v2.47.2**. The latest version is **v2.54.11**.

### Option 1: Update via Direct Download (Recommended for Linux)

```bash
# Download the latest release (v2.54.11)
cd /tmp
wget https://github.com/supabase/cli/releases/download/v2.54.11/supabase_2.54.11_linux_amd64.deb

# Install/update
sudo dpkg -i supabase_2.54.11_linux_amd64.deb

# Verify installation
supabase --version
```

### Option 2: Update via Homebrew (if installed via brew)

```bash
brew upgrade supabase
```

### Option 3: Manual Binary Update

```bash
# Download latest binary
cd /tmp
wget https://github.com/supabase/cli/releases/latest/download/supabase_linux_amd64.tar.gz
tar -xzf supabase_linux_amd64.tar.gz

# Replace existing binary
sudo mv supabase /usr/local/bin/supabase
sudo chmod +x /usr/local/bin/supabase

# Verify
supabase --version
```

---

## Linking to Your Online Supabase Project

### Prerequisites

1. **Create a Supabase Project** (if you haven't already):
   - Go to https://app.supabase.com
   - Click "New Project"
   - Fill in project details (name, database password, region)
   - Wait for project to be provisioned (2-3 minutes)

2. **Get Your Project Reference ID**:
   - In your Supabase dashboard, the project reference ID is in the URL:
     ```
     https://app.supabase.com/project/YOUR_PROJECT_REF
     ```
   - Or go to: Project Settings → General → Reference ID

### Step 1: Login to Supabase CLI

```bash
cd /home/beautifulcode/Documents/oasis-travel
supabase login
```

This will open your browser to authenticate. After logging in, you'll be redirected back to the terminal.

### Step 2: Link Your Local Project

```bash
# Link using project reference ID
supabase link --project-ref YOUR_PROJECT_REF

# Example:
# supabase link --project-ref abcdefghijklmnop
```

**Alternative: Interactive Linking**

If you don't know your project ref, you can use:

```bash
supabase link
```

This will show you a list of your projects to choose from.

### Step 3: Verify the Link

After linking, you should see:

```
Finished supabase link.
```

You can verify by checking:

```bash
# Check linked project
supabase projects list

# Check current project status
supabase status
```

### Step 4: Push Your Migrations

Once linked, push your local migrations to the remote database:

```bash
# Push all migrations to remote
supabase db push

# Or push specific migration
supabase migration up
```

**⚠️ Important**: This will apply all your migrations to the remote database. Make sure you're ready to deploy!

### Step 5: Push Storage Buckets (Optional)

If you want to ensure storage buckets are created on remote:

```bash
# The buckets should be created via migrations, but you can verify:
supabase db push
```

---

## Complete Linking Workflow

Here's the complete workflow from start to finish:

```bash
# 1. Navigate to project
cd /home/beautifulcode/Documents/oasis-travel

# 2. Login (first time only)
supabase login

# 3. Link to remote project
supabase link --project-ref YOUR_PROJECT_REF

# 4. Push migrations
supabase db push

# 5. Verify everything is synced
supabase status
```

---

## Troubleshooting

### "Project not found" error

- Double-check your project reference ID
- Ensure you're logged in: `supabase login`
- Verify project exists in dashboard: https://app.supabase.com

### "Migration conflicts" error

If you have conflicting migrations:

```bash
# Check migration status
supabase migration list

# Reset remote database (⚠️ DESTRUCTIVE - only for development!)
supabase db reset --linked
```

### "Permission denied" error

- Ensure you're the project owner or have admin access
- Check your Supabase dashboard permissions

### Unlink and Re-link

If you need to unlink and start over:

```bash
# Unlink current project
supabase unlink

# Link again
supabase link --project-ref YOUR_PROJECT_REF
```

---

## Environment Variables

After linking, you'll need to update your `.env` files with the remote project credentials:

1. **Get your project credentials**:
   - Go to Project Settings → API
   - Copy the following:
     - `SUPABASE_URL` (Project URL)
     - `SUPABASE_ANON_KEY` (anon/public key)
     - `SUPABASE_SERVICE_ROLE_KEY` (service_role key - keep secret!)

2. **Update your `.env` files**:
   ```bash
   # apps/mobile/.env
   SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   SUPABASE_ANON_KEY=your_anon_key_here
   
   # apps/console/.env
   SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   SUPABASE_ANON_KEY=your_anon_key_here
   
   # apps/vendor/.env
   SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   SUPABASE_ANON_KEY=your_anon_key_here
   ```

---

## Next Steps After Linking

1. ✅ **Database**: Migrations pushed
2. ✅ **Storage**: Buckets created
3. ✅ **RLS**: Policies active
4. ⏭️ **Edge Functions**: Deploy when ready (Section 5)
5. ⏭️ **Environment Variables**: Update all `.env` files
6. ⏭️ **Test**: Verify remote database works

---

## Quick Reference

```bash
# Login
supabase login

# Link project
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
supabase db push

# Check status
supabase status

# View projects
supabase projects list

# Unlink
supabase unlink
```

---

**Need Help?**
- Supabase CLI Docs: https://supabase.com/docs/guides/cli
- Supabase Dashboard: https://app.supabase.com
- Project Settings: https://app.supabase.com/project/YOUR_PROJECT_REF/settings

