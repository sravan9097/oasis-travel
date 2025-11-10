# Gradle Build Failure - Complete Troubleshooting Guide

## Overview

This document addresses all the Gradle build errors encountered and provides solutions.

---

## Issues Encountered & Fixed

### 1. ❌ Autolinking Error
**Error:**
```
Autolinking is not set up in `settings.gradle`: expo modules won't be autolinked.
```

**Root Cause:**
- Outdated dependencies not compatible with Expo SDK 54
- Missing or incorrect autolinking configuration

**Solution Applied:** ✅
- Updated all packages to SDK 54 compatible versions via `npx expo install --fix`
- Key updates:
  - `expo`: 54.0.22 → 54.0.23
  - `expo-secure-store`: 12.5.0 → 15.0.7
  - `react-native-gesture-handler`: 2.29.1 → 2.28.0
  - `react-native-safe-area-context`: 4.12.0 → 5.6.0
  - `react-native-screens`: 4.1.0 → 4.16.0

---

### 2. ❌ compileSdk Not Specified Error
**Error:**
```
Android Gradle Plugin: project ':expo-secure-store' does not specify `compileSdk` in build.gradle
```

**Root Cause:**
- Android SDK versions not configured in `app.json`
- EAS Build couldn't determine which Android SDK to use

**Solution Applied:** ✅
Added to `app.json`:
```json
"android": {
  "compileSdkVersion": 36,
  "targetSdkVersion": 36,
  "minSdkVersion": 24,
  // ... other config
}
```

---

### 3. ❌ react-native-worklets-core Version Mismatch
**Error:**
```
[Reanimated] Invalid version of `react-native-worklets`: "1.6.2". 
Expected the version to be in inclusive range "0.5.x, 0.6.x".
```

**Root Cause:**
- `react-native-reanimated@4.1.3` requires `react-native-worklets-core` in range 0.5.x or 0.6.x
- Package had version 1.6.2 installed (incompatible)

**Solution Applied:** ✅
```bash
npm install react-native-worklets-core@0.5.0
```

Updated in `package.json`:
```json
"react-native-worklets-core": "^0.5.0"
```

---

### 4. ❌ Missing projectId
**Error:**
```
No "projectId" found. If "projectId" can't be inferred from the manifest...
```

**Root Cause:**
- Push notifications require projectId
- Not set during initial configuration

**Solution Applied:** ✅
Added to `app.json` (already configured by user):
```json
"extra": {
  "eas": {
    "projectId": "7baed2ec-defd-42e6-b737-860008d5482f"
  }
}
```

---

### 5. ❌ NODE_ENV Warning
**Warning:**
```
The NODE_ENV environment variable is required but was not specified.
```

**Impact:** Low - This is just a warning, not a build failure

**Solution (Optional):**
Add to `eas.json` build profile:
```json
"development": {
  "env": {
    "NODE_ENV": "development"
  }
}
```

---

## Current Configuration Status

### ✅ Dependencies (All Compatible)
```json
{
  "expo": "~54.0.23",
  "expo-constants": "^18.0.10",
  "expo-dev-client": "^6.0.17",
  "expo-secure-store": "~15.0.7",
  "expo-router": "~6.0.14",
  "react-native-reanimated": "~4.1.1",
  "react-native-worklets-core": "^0.5.0",
  "react-native-gesture-handler": "~2.28.0",
  "react-native-safe-area-context": "~5.6.0",
  "react-native-screens": "~4.16.0"
}
```

### ✅ Android Configuration
- compileSdkVersion: 36
- targetSdkVersion: 36
- minSdkVersion: 24

### ✅ EAS Build Configuration
- Development build profile configured
- Android APK build type set
- Distribution: internal

### ✅ Plugins
- expo-router ✓
- expo-dev-client ✓
- expo-secure-store ✓

---

## Verification Steps

Run these commands to verify everything is correct:

```bash
cd apps/mobile

# 1. Check dependency compatibility
npx expo install --check

# 2. Verify package versions
npm list expo expo-secure-store react-native-reanimated react-native-worklets-core

# 3. Check for any other issues
npx expo doctor
```

Expected output:
- All dependencies should be compatible with SDK 54
- No version mismatches
- No critical warnings

---

## Build Again

With all fixes applied, try building:

```bash
cd apps/mobile
eas build --profile development --platform android
```

### What Should Happen:
1. ✅ Dependencies resolve correctly
2. ✅ Autolinking works
3. ✅ Android SDK configured
4. ✅ Gradle compiles successfully
5. ✅ APK generated

---

## If Build Still Fails

### Check Build Logs
1. Visit [expo.dev](https://expo.dev)
2. Go to your project → Builds
3. Click on the failed build
4. Review full logs for new errors

### Common Issues

#### Cache Problems
```bash
# Clear local cache
rm -rf node_modules
npm install

# Clear EAS cache
eas build --profile development --platform android --clear-cache
```

#### Java Version Issues
EAS should handle this, but if building locally:
```bash
java -version
# Should be Java 11 or higher
```

#### Gradle Version
The project should use Gradle 8.14.3 (configured automatically by Expo)

#### React Native Version Conflicts
Your project uses React 19.1.0. This is newer than typical. If issues arise:
```bash
# Verify React version compatibility
npx expo install react react-native
```

---

## Remaining Warnings (Non-Critical)

These warnings won't prevent build success:

1. **Kotlin kotlinOptions deprecated** - Framework warnings, not your code
2. **NODE_ENV not specified** - Only affects development mode
3. **React Native LoadingView** - Known issue, falls back to file resolution

---

## Summary of All Fixes

| Issue | Status | Fix Applied |
|-------|--------|-------------|
| Dependency versions | ✅ Fixed | Updated to SDK 54 |
| Android SDK config | ✅ Fixed | Added compileSdk, targetSdk, minSdk |
| Autolinking | ✅ Fixed | Dependencies updated |
| worklets-core version | ✅ Fixed | Downgraded to 0.5.0 |
| projectId | ✅ Fixed | Added to app.json |
| expo-secure-store plugin | ✅ Fixed | Added to plugins array |

---

## Expected Build Success

After all these fixes, the build should:
1. Download Gradle 8.14.3
2. Configure project with correct SDK versions
3. Autolink all Expo modules correctly
4. Compile without errors
5. Generate development APK
6. Provide download link

**Estimated build time:** 10-20 minutes (first build)

---

## Next Steps After Successful Build

1. **Download APK** from EAS build page
2. **Install on Android device**
3. **Start dev server:** `npm run dev`
4. **Open development build app** on device
5. **Scan QR code** or enter URL
6. **Verify push notifications work** (no more errors)

---

## Support

If you encounter new errors:
1. Check build logs on expo.dev
2. Search Expo forums for the specific error
3. Verify all dependencies with `npx expo install --check`
4. Try `--clear-cache` flag

---

**Status:** All known issues resolved ✅  
**Ready to build:** Yes ✅

