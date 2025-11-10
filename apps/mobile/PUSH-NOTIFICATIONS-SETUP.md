# Push Notifications Setup Guide

## Overview

Push notifications are implemented but require additional configuration for full functionality.

## Current Status

✅ **Code Implementation:** Complete  
⚠️ **Configuration:** Requires projectId for production  
⚠️ **Expo Go:** Limited support (SDK 53+)

## Setup Steps

### 1. For Development Build

```bash
cd apps/mobile

# Install EAS CLI (if not already installed)
npm install -g eas-cli

# Login to Expo
eas login

# Configure EAS Build
eas build:configure

# This will create eas.json and set up projectId
```

### 2. Add projectId to app.json (Alternative)

If you already have a projectId from EAS, add it to `app.json`:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "your-project-id-here"
      }
    }
  }
}
```

### 3. For Production Builds

```bash
# Build with EAS
eas build --platform android --profile production
eas build --platform ios --profile production
```

The projectId will be automatically included in EAS builds.

## Testing

### In Expo Go (Limited)
- ⚠️ Remote push notifications **do not work** in Expo Go (SDK 53+)
- Local notifications still work
- Error is handled gracefully - app continues to function

### In Development Build
- ✅ Full push notification support
- ✅ Remote notifications work
- ✅ All features functional

### Testing Locally
```bash
# Use development build
npm run dev

# Or build development client
eas build --profile development --platform android
```

## Error Handling

The app handles missing projectId gracefully:

1. **Missing projectId:**
   - Logs warning message
   - Returns `null` from registration
   - App continues to work normally
   - Push notifications simply won't be available

2. **Expo Go Limitations:**
   - Detects Expo Go environment
   - Logs helpful warning
   - App continues to function
   - All other features work normally

## Code Implementation

The notification registration code:
- ✅ Checks for device (not simulator)
- ✅ Requests permissions
- ✅ Tries multiple sources for projectId
- ✅ Handles errors gracefully
- ✅ Sets up Android notification channels
- ✅ Returns token or null safely

## Next Steps

1. **For Development:**
   - Use development build: `npm run dev`
   - Or accept that push notifications won't work in Expo Go

2. **For Production:**
   - Run `eas build:configure`
   - Build with EAS: `eas build --platform all --profile production`
   - projectId will be automatically included

3. **Backend Integration:**
   - Store push tokens in database
   - Send notifications from backend
   - Handle token refresh

## Troubleshooting

### "No projectId found" Warning
- **Expected in Expo Go** - This is normal
- **For production:** Run `eas build:configure`
- App will continue to work without push notifications

### "Expo Go limitation" Warning
- **Expected** - Remote push notifications don't work in Expo Go
- **Solution:** Use development build instead
- All other features work normally

### Notifications not working
1. Check if using Expo Go → Use development build
2. Check if projectId is set → Run `eas build:configure`
3. Check permissions → Should be requested automatically
4. Check device → Notifications only work on physical devices

---

**Status:** Implementation complete, configuration pending for production use.

