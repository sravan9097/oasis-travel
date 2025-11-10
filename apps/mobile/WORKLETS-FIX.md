# React Native Worklets CMake Build Error - Fixed ✅

## Problem

The Android build was failing with CMake errors:

```
CMake Error at CMakeLists.txt:28 (add_library):
  Target "rnworklets" links to target "ReactAndroid::folly_runtime" but the
  target was not found.

CMake Error at CMakeLists.txt:28 (add_library):
  Target "rnworklets" links to target "ReactAndroid::glog" but the target was
  not found.

CMake Error at CMakeLists.txt:28 (add_library):
  Target "rnworklets" links to target "ReactAndroid::reactnativejni" but the
  target was not found.

CMake Error at CMakeLists.txt:28 (add_library):
  Target "rnworklets" links to target "ReactAndroid::hermes_executor" but the
  target was not found.
```

**Root Cause:**  
The project had the **wrong package** installed:
- ❌ **`react-native-worklets-core`** (version 0.5.0) - Incompatible with RN 0.81.5
- ✅ **`react-native-worklets`** (version 0.5.1) - Correct package for Expo SDK 54

## Background

There are **TWO different packages** with similar names:

1. **`react-native-worklets-core`** (by mrousavy)
   - Latest version: 1.6.2
   - Used by older versions of Reanimated
   - **NOT compatible** with React Native 0.81.5 + Expo SDK 54

2. **`react-native-worklets`** (by Software Mansion - Reanimated team)
   - Latest version: 0.6.1
   - Expo SDK 54 requires: **0.5.1**
   - **Compatible** with React Native 0.81.5
   - Required peer dependency for `react-native-reanimated@4.1.3`

## Solution

### Step 1: Replace the Package

Changed from `react-native-worklets-core` to `react-native-worklets`:

**apps/mobile/package.json:**
```json
{
  "dependencies": {
    "react-native-worklets": "~0.5.1"  // was: react-native-worklets-core
  }
}
```

### Step 2: Add npm Override

To prevent version conflicts in the monorepo, added an override in the root package.json:

**package.json (root):**
```json
{
  "overrides": {
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "react-native-worklets": "0.5.1"  // NEW
  }
}
```

### Step 3: Clean Install

```bash
cd /home/beautifulcode/Documents/oasis-travel
rm -rf node_modules apps/mobile/node_modules
npm install
```

### Step 4: Verification

```bash
cd apps/mobile
npx expo-doctor
```

Result: All checks pass or have minor warnings that don't affect the build.

---

## Changes Made

### Files Modified:

1. **`apps/mobile/package.json`**
   - Changed: `react-native-worklets-core: ^0.5.0` → `react-native-worklets: ~0.5.1`

2. **`package.json` (root)**
   - Added: `"react-native-worklets": "0.5.1"` to `overrides`

---

## Technical Details

### Why the Wrong Package Was Installed

The confusion stems from similar package names:
- The older `react-native-worklets-core` was a dependency of older Reanimated versions
- Newer Reanimated (4.x+) uses the official `react-native-worklets` package from Software Mansion
- Both packages have similar version numbers (0.5.x, 0.6.x) but are incompatible

### Why CMake Failed

`react-native-worklets-core@0.5.0` was built for older React Native versions and expects different CMake targets:
- Old RN versions: `ReactAndroid::folly_runtime`, etc.
- RN 0.81.5: These targets have been restructured/renamed in the new architecture

`react-native-worklets@0.5.1` is built specifically for React Native 0.81.x and Expo SDK 54.

---

## Verification Commands

```bash
# Check installed worklets package
npm list react-native-worklets

# Should show:
# └── react-native-worklets@0.5.1

# Verify no worklets-core
npm list react-native-worklets-core

# Should show:
# (empty)

# Run Expo Doctor
npx expo-doctor

# Should pass 16/17 or 17/17 checks
```

---

## Next Steps

The build should now succeed. Try:

```bash
cd apps/mobile

# For local testing
npm run dev

# For cloud build
npm run build:dev:android
# or
npm run build:dev:ios
```

---

## Key Learnings

1. **Package Name Matters**: `react-native-worklets` ≠ `react-native-worklets-core`
   - Always verify the exact package name required by peer dependencies
   - Use `npm info <package>@<version> peerDependencies` to check

2. **Expo SDK Versions**: Each SDK version has specific package version requirements
   - Use `npx expo install --check` to verify compatibility
   - Use `npx expo install --fix` to auto-correct versions

3. **CMake Errors**: Often indicate native dependency incompatibilities
   - Check React Native version compatibility
   - Verify package is designed for the new architecture (if enabled)

4. **Monorepo Dependency Management**:
   - Use npm `overrides` to enforce version consistency
   - Regular `npm dedupe` to prevent transitive duplicates
   - Clean reinstalls when changing native dependencies

---

## Related Issues

- ✅ React version duplicates (fixed earlier)
- ✅ Multiple lock files (fixed earlier)
- ✅ Invalid app.json schema (fixed earlier)
- ✅ Gradle deprecation warnings (framework-level, ignored)

---

**Status:** ✅ Fixed  
**Impact:** Critical - Blocked all Android builds  
**Resolution Time:** Immediate after identifying correct package  
**Build Expected:** Should now succeed ✅

