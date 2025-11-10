# Quick Fix: Runtime Configuration Errors

## 🚨 The Problem

Your app crashes with:
```
ERROR: supabaseUrl is required
WARN: Firebase not initialized
```

## ✅ The Solution

**Environment variables must be embedded at BUILD time, not runtime.**

---

## 🔧 Fix in 3 Steps

### Step 1: Verify Your .env File

```bash
cd /home/beautifulcode/Documents/oasis-travel/apps/mobile
cat .env
```

**Expected output:**
```bash
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
EXPO_PUBLIC_SUPABASE_SERVICE_KEY=eyJhbGc...
```

**If empty or missing values**, copy from console app:
```bash
cp ../console/.env .env
```

---

### Step 2: Rebuild the App

**CRITICAL:** You MUST rebuild when `.env` changes

```bash
cd apps/mobile

# Cloud build (recommended)
eas build --profile development --platform android --clear-cache
```

This takes 10-15 minutes. The `.env` values are baked into the APK at build time.

---

### Step 3: Install & Run

**After build completes:**

1. Download the APK from EAS
2. Install on your device/emulator
3. Start the dev server:

```bash
npm run dev:android
```

---

## 🎯 Expected Result

After rebuilding with correct `.env`:

✅ **Supabase initializes successfully**
```
✓ Supabase initialized
✓ Session restored
```

⚠️ **Firebase warning is OK** (optional feature)
```
WARN: Firebase not initialized
```
This is expected. Firebase is only needed for Firebase Cloud Messaging push notifications. The app works fine without it using Expo's push notification service.

---

## 🔄 Development Workflow

### After Initial Build:

```bash
# Code changes only - NO rebuild needed
npm run dev:android
```

### If you change .env:

```bash
# MUST rebuild
eas build --profile development --platform android
# Then install new APK and restart dev server
```

---

## 🆘 Emergency Workaround (Testing Only)

If you need to test RIGHT NOW without rebuilding:

**1. Temporarily hardcode values in `app/_layout.tsx`:**

```typescript
// Line 22-25 - TEMPORARY ONLY
initSupabase(
  'https://your-actual-project-id.supabase.co',  // Replace with real URL
  'your-actual-anon-key'  // Replace with real key
);
```

**2. Save and restart dev server:**

```bash
npm run dev:android
```

**3. ⚠️ IMPORTANT:** Remove hardcoded values and rebuild with proper `.env` before committing!

---

## 📊 Checklist

Before rebuilding, verify:

- [ ] `.env` file exists in `apps/mobile/`
- [ ] Contains `EXPO_PUBLIC_SUPABASE_URL`
- [ ] Contains `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Contains `EXPO_PUBLIC_SUPABASE_SERVICE_KEY`
- [ ] Values are not empty
- [ ] No extra spaces or quotes around values

---

## 🤔 Why This Happens

**Development Builds ≠ Expo Go**

| | Expo Go | Development Build |
|-|---------|-------------------|
| `.env` | Loaded at runtime | Baked into binary at BUILD |
| Change `.env` | Works immediately | Requires REBUILD |
| Native modules | ❌ | ✅ |

**Your app uses a development build** (not Expo Go), so environment variables are compiled into the native binary.

---

## 📝 Summary

**The ONE thing you need to remember:**

> **Environment variables in development builds require a REBUILD, not just a restart.**

---

## Commands Quick Reference

```bash
# Check .env
cat apps/mobile/.env

# Rebuild (do this after changing .env)
cd apps/mobile
eas build --profile development --platform android

# After installing APK, start dev server
npm run dev:android
```

---

**See `RUNTIME-CONFIG-FIX.md` for detailed explanation and Firebase setup.**

