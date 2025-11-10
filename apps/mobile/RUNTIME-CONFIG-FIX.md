# Runtime Configuration Errors - Fix Guide

## Errors Encountered

```
ERROR 1: [Error: Uncaught (in promise, id: 0) Error: supabaseUrl is required.]
ERROR 2: Error registering for push notifications: Default FirebaseApp is not initialized
```

---

## Issue 1: Supabase Environment Variables Not Loading ❌

### Problem

The app expects `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` but they're undefined at runtime.

### Root Cause

**Development builds require environment variables to be present at BUILD time**, not runtime. Unlike Expo Go, development builds bundle the environment variables into the native app during compilation.

### Solution

**Step 1: Verify .env File Exists**

Check that `/home/beautifulcode/Documents/oasis-travel/apps/mobile/.env` contains:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EXPO_PUBLIC_SUPABASE_SERVICE_KEY=your-service-key-here
```

**Step 2: REBUILD the Development Client**

Environment variables are baked into the app at build time:

```bash
cd apps/mobile

# For EAS Cloud Build
eas build --profile development --platform android --clear-cache

# OR for local build (if configured)
npx expo run:android
```

**Step 3: After Installing the New Build**

```bash
# Start the dev server
npm run dev:android
```

### Important Notes

- ⚠️ **You MUST rebuild** after changing environment variables in `.env`
- ⚠️ Simply restarting `expo start` is NOT enough
- ✅ Environment variables are embedded in the native binary at build time
- ✅ After rebuilding, you only need to restart the dev server for code changes

---

## Issue 2: Firebase Not Initialized for Push Notifications ⚠️

### Problem

```
Make sure to complete the guide at https://docs.expo.dev/push-notifications/fcm-credentials/
Default FirebaseApp is not initialized in this process com.oasistravel.mobile
```

### Root Cause

Firebase Cloud Messaging (FCM) requires a `google-services.json` file for Android push notifications.

### Solution Options

#### Option A: Complete Firebase Setup (For Production Push Notifications)

**1. Create Firebase Project**
- Go to https://console.firebase.google.com/
- Create a new project (or use existing)
- Add an Android app with package name: `com.oasistravel.mobile`

**2. Download google-services.json**
- Download the `google-services.json` file
- Place it in: `apps/mobile/google-services.json`

**3. Update app.json**

Add the Firebase plugin:

```json
{
  "expo": {
    "plugins": [
      "expo-router",
      "expo-dev-client",
      "expo-secure-store",
      [
        "@react-native-firebase/app",
        {
          "android": {
            "googleServicesFile": "./google-services.json"
          }
        }
      ],
      [
        "expo-build-properties",
        {
          "android": {
            "compileSdkVersion": 36,
            "targetSdkVersion": 36,
            "minSdkVersion": 24
          }
        }
      ]
    ]
  }
}
```

**4. Install Firebase Dependencies**

```bash
cd apps/mobile
npm install @react-native-firebase/app @react-native-firebase/messaging
```

**5. Rebuild**

```bash
eas build --profile development --platform android
```

---

#### Option B: Use Expo Push Notifications Only (Recommended for Now)

Skip Firebase setup and use Expo's push notification service instead.

**1. The app already gracefully handles missing Firebase:**

In `apps/mobile/app/lib/notifications.ts`, we have error handling:

```typescript
export async function registerForPushNotifications(): Promise<string | null> {
  try {
    // ... registration code
  } catch (error) {
    console.warn('Push notification registration failed:', error);
    return null; // Gracefully fail
  }
}
```

**2. For testing, use Local Notifications:**

```typescript
import { scheduleLocalNotification } from './lib/notifications';

// Test notification
await scheduleLocalNotification(
  'Test Notification',
  'This works without Firebase!',
  2 // seconds
);
```

**3. For production remote push notifications:**
- Use Expo Push Notification service (doesn't require Firebase initially)
- Get push tokens from `registerForPushNotifications()`
- Send notifications via Expo's API: https://docs.expo.dev/push-notifications/sending-notifications/

---

## Quick Fix: Just Get the App Running

**Option 1: Set Environment Variables**

1. **Ensure `.env` file has valid values:**

```bash
cd /home/beautifulcode/Documents/oasis-travel/apps/mobile
cat .env
```

Should output:
```
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

If missing or invalid, copy from the root `.env` or console/vendor `.env`:

```bash
# Copy from console app
cp ../console/.env .env
# OR manually edit
nano .env
```

2. **Rebuild the app:**

```bash
eas build --profile development --platform android
```

3. **Install the new APK on your device**

4. **Start dev server:**

```bash
npm run dev:android
```

**Option 2: Mock the Supabase URL for Quick Testing**

Temporarily hardcode the URL in `app/_layout.tsx` (NOT RECOMMENDED for production):

```typescript
// TEMPORARY FIX - Replace with real values
initSupabase(
  'https://your-project.supabase.co',
  'your-anon-key'
);
```

Then just restart the dev server (no rebuild needed).

---

## Verification

### After Rebuilding with Correct .env:

**1. Check Environment Variables Load:**

Add debug logging in `app/_layout.tsx`:

```typescript
useEffect(() => {
  async function initialize() {
    console.log('SUPABASE_URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
    console.log('SUPABASE_KEY:', process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 20) + '...');
    
    initSupabase(
      process.env.EXPO_PUBLIC_SUPABASE_URL!,
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
    );
    // ...
  }
  initialize();
}, []);
```

**2. Expected Output:**

```
SUPABASE_URL: https://xxxxx.supabase.co
SUPABASE_KEY: eyJhbGciOiJIUzI1NiIs...
✅ Supabase initialized successfully
```

**3. Push Notification Warning is OK:**

```
WARN  Error registering for push notifications: ...
```

This is expected without Firebase. The app will still work; you just won't receive remote push notifications.

---

## Root Cause Summary

| Issue | Cause | Fix |
|-------|-------|-----|
| Supabase Error | `.env` vars not in build | **Rebuild** with correct `.env` |
| Firebase Warning | No `google-services.json` | Optional - only needed for FCM push |

---

## Commands Summary

```bash
# 1. Verify .env exists and has correct values
cd apps/mobile
cat .env

# 2. If .env is missing, copy from console
cp ../console/.env .env

# 3. Rebuild the development client
eas build --profile development --platform android

# 4. After build completes, download and install APK on device

# 5. Start dev server
npm run dev:android
```

---

## Why This Happens

### Development Builds vs Expo Go

| Feature | Expo Go | Development Build |
|---------|---------|-------------------|
| Environment Variables | Loaded at runtime from `.env` | **Baked into binary at build time** |
| Code Changes | Hot reload | Hot reload |
| Native Changes | ❌ Not supported | ✅ Supported |
| `.env` Changes | Instant | **Requires rebuild** |

**Key Takeaway:** Any time you change `.env`, you must rebuild the development client.

---

## Testing Without Rebuilding

If you need to test quickly without rebuilding:

**1. Hardcode the values temporarily:**

```typescript
// apps/mobile/app/_layout.tsx
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_KEY = 'your-anon-key';

initSupabase(SUPABASE_URL, SUPABASE_KEY);
```

**2. Restart dev server:**

```bash
npm run dev:android
```

**3. Remove hardcoded values after testing and rebuild with proper `.env`**

---

## Next Steps

1. ✅ Verify `.env` file has correct Supabase credentials
2. ✅ Rebuild development client: `eas build --profile development --platform android`
3. ✅ Install new APK on device
4. ✅ Start dev server: `npm run dev:android`
5. ⚠️ Optionally setup Firebase (only if you need FCM push notifications)

---

## Related Documentation

- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)
- [Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [Firebase Setup Guide](https://docs.expo.dev/push-notifications/fcm-credentials/)
- [Expo Push Notifications](https://docs.expo.dev/push-notifications/overview/)

---

**Status:** Configuration issue - requires rebuild with proper `.env`  
**Impact:** App crashes on startup  
**Solution:** Rebuild with environment variables  
**Estimated Time:** 10-15 minutes for rebuild

