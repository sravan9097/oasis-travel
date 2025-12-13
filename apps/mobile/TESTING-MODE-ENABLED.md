# Testing Mode Enabled

## Overview
The app is now configured to **automatically bypass authentication** for rapid testing.

## What Changed

### 1. Welcome Screen (`app/index.tsx`)
- **Removed**: Sign-in buttons and OTP flow
- **Added**: Automatic guest mode entry
- **Result**: App launches directly into the main tabs

### 2. Auto-Login Flow
```
App Start → Check for Session → No Session? → Create Guest Session → Redirect to Tabs
```

### 3. Console Logs
Added helpful console logs to track the flow:
- `🚀 Initializing app...`
- `✅ Supabase initialized`
- `✅ Found existing guest session: <id>`
- `🧪 Testing mode: Auto-entering as guest...`
- `✅ Guest session created: <id>`

## How It Works

1. **On first launch**: 
   - Creates a guest session automatically
   - Saves it to SecureStore for persistence
   - Redirects to main tabs immediately

2. **On subsequent launches**:
   - Finds existing guest session in storage
   - Redirects directly to tabs
   - No welcome screen shown

3. **Guest Mode Features**:
   - Can browse and plan trips
   - Data is stored with guest ID
   - If user later logs in, guest data is merged

## Testing the App

### Quick Start
1. Run the app: `npm start`
2. App opens directly to Home tab
3. No login required!

### Features You Can Test
- ✅ Trip planning bot (WhatsApp-style chat)
- ✅ View quotes
- ✅ Browse trips
- ✅ Profile screen (shows login option if needed)
- ✅ Support/Contact features

### Profile Screen
The Profile tab now:
- Shows login option for guest users
- Displays profile info for logged-in users
- Has "Skip OTP (Testing)" button for quick auth testing
- Shows logout option when logged in

## How to Re-enable Authentication

To restore normal authentication flow:

1. **Edit `app/index.tsx`**:
   - Remove auto-guest login code
   - Add back the Sign In buttons

2. **Or use the Profile screen**:
   - Click "Sign In" from the Profile tab
   - Use "Skip OTP (Testing)" for quick test logins

## Guest Session Details

- **Format**: `test-guest-{timestamp}`
- **Storage**: SecureStore (persistent)
- **Behavior**: Works like a logged-out user but with data tracking

## Console Output Example

```
🚀 Initializing app...
✅ Supabase initialized
ℹ️  No existing session found
✅ App ready
🧪 Testing mode: Auto-entering as guest...
✅ Guest session created: test-guest-1234567890
```

## Notes

- This is **for development/testing only**
- Guest sessions are real and data is stored
- Can upgrade to full auth anytime via Profile screen
- Data persists between app restarts
- Supabase backend integration works normally

## Reverting Changes

To go back to normal auth flow, restore:
- `apps/mobile/app/index.tsx` (original welcome screen)
- `apps/mobile/app/(tabs)/support.tsx` (if needed)

---

**Status**: ✅ Testing mode active - No authentication required

