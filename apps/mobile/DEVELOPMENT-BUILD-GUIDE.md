# Development Build Setup Guide

This guide will help you set up and run a development build for the Oasis Travel mobile app, which is required for push notifications and other native features.

**Reference:** [Expo Development Builds Documentation](https://docs.expo.dev/develop/development-builds/introduction/)

---

## Why Development Build?

As explained in the [Expo documentation](https://docs.expo.dev/develop/development-builds/introduction/), Expo Go has limitations:

- ❌ **Remote push notifications** don't work in Expo Go (SDK 53+)
- ❌ Can't use native libraries not included in Expo Go
- ❌ Can't test custom app icons, splash screens, etc.

A **development build** is your own version of Expo Go that includes:
- ✅ Full push notification support
- ✅ All native libraries you need
- ✅ Custom app configuration
- ✅ Development tools (expo-dev-client)

---

## Prerequisites

1. **Node.js 18+** installed
2. **Expo account** (free) - [Sign up](https://expo.dev/signup)
3. **EAS CLI** installed globally
4. **Android Studio** (for Android) or **Xcode** (for iOS) - for local builds

---

## Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

---

## Step 2: Login to Expo

```bash
eas login
```

This will open a browser to authenticate with your Expo account.

---

## Step 3: Configure EAS Build

Navigate to the mobile app directory:

```bash
cd apps/mobile
```

Configure EAS Build (this creates `eas.json`):

```bash
eas build:configure
```

This will:
- Create an `eas.json` file
- Set up build profiles
- Generate a projectId (needed for push notifications)

---

## Step 4: Create eas.json (if not auto-generated)

If `eas build:configure` doesn't create the file, create `apps/mobile/eas.json`:

```json
{
  "cli": {
    "version": ">= 5.9.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "simulator": true
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "buildConfiguration": "Release"
      }
    }
  }
}
```

---

## Step 5: Build Development Client

### Option A: Build on EAS (Recommended - Cloud Build)

**For Android:**
```bash
cd apps/mobile
eas build --profile development --platform android
```

**For iOS:**
```bash
cd apps/mobile
eas build --profile development --platform ios
```

**For both:**
```bash
cd apps/mobile
eas build --profile development --platform all
```

This will:
1. Upload your code to EAS servers
2. Build the native app in the cloud
3. Provide a download link or QR code
4. Take 10-20 minutes for the first build

### Option B: Build Locally (Faster, but requires setup)

**For Android (requires Android Studio):**
```bash
cd apps/mobile
eas build --profile development --platform android --local
```

**For iOS (requires Xcode, macOS only):**
```bash
cd apps/mobile
eas build --profile development --platform ios --local
```

---

## Step 6: Install Development Build on Device

### Android

1. **Download the APK** from the EAS build link
2. **Enable "Install from Unknown Sources"** on your Android device:
   - Settings → Security → Unknown Sources (or)
   - Settings → Apps → Special Access → Install Unknown Apps
3. **Transfer APK to device** and install
4. **Open the app** - it will show the Expo Dev Client interface

### iOS

1. **Download the IPA** from the EAS build link
2. **Install via TestFlight** (if configured) or
3. **Install via Xcode** (for local builds):
   ```bash
   # After local build completes
   # Connect iPhone via USB
   # Open Xcode → Window → Devices and Simulators
   # Drag .ipa file to install
   ```

---

## Step 7: Start Development Server

Once the development build is installed on your device:

```bash
cd apps/mobile
npm run dev
```

Or:
```bash
cd apps/mobile
npx expo start --dev-client
```

This will:
- Start the Metro bundler
- Show a QR code
- Wait for you to connect

---

## Step 8: Connect to Development Server

### On Android Device:
1. Open the **development build app** you installed
2. **Scan the QR code** from terminal, or
3. **Shake device** → "Enter URL manually" → Enter the URL shown in terminal

### On iOS Device:
1. Open the **development build app** you installed
2. **Scan the QR code** from terminal, or
3. **Shake device** → "Enter URL manually" → Enter the URL shown in terminal

---

## Step 9: Verify Push Notifications Work

Once connected, the app should:
- ✅ Load your JavaScript bundle
- ✅ Register for push notifications (no errors)
- ✅ Show push token in console
- ✅ All features work normally

Check the terminal for:
```
Push token: ExponentPushToken[xxxxxxxxxxxxx]
```

---

## Troubleshooting

### "No projectId found" Error

After running `eas build:configure`, the projectId should be automatically added to `app.json`. If you still see this error:

1. Check `app.json` for `extra.eas.projectId`
2. If missing, run `eas build:configure` again
3. Or manually add it (get from Expo dashboard)

### Build Fails

- **Check EAS status:** Visit [expo.dev](https://expo.dev) → Your project → Builds
- **Check logs:** EAS provides detailed build logs
- **Common issues:**
  - Missing environment variables
  - Invalid app.json configuration
  - Native dependency conflicts

### Can't Connect to Dev Server

- **Same network:** Device and computer must be on same WiFi
- **Firewall:** Allow Metro bundler through firewall
- **URL:** Try entering URL manually (shown in terminal)

### Push Notifications Still Not Working

1. **Verify projectId** is set in `app.json`
2. **Check permissions:** App should request notification permissions
3. **Check device:** Must be physical device (not emulator)
4. **Check logs:** Look for push token in console

---

## Quick Reference Commands

```bash
# Install dependencies
cd apps/mobile
npm install

# Configure EAS
eas build:configure

# Build development client (Android)
eas build --profile development --platform android

# Build development client (iOS)
eas build --profile development --platform ios

# Start dev server
npm run dev

# Or
npx expo start --dev-client
```

---

## Development Workflow

1. **First time setup:**
   - Run `eas build:configure`
   - Build development client: `eas build --profile development --platform android`
   - Install APK on device

2. **Daily development:**
   - Start dev server: `npm run dev`
   - Open development build app on device
   - Scan QR code or enter URL
   - Make code changes → see updates instantly

3. **When adding new native dependencies:**
   - Install package: `npx expo install <package>`
   - Rebuild development client: `eas build --profile development --platform android`
   - Install new APK on device

---

## Cost

- **EAS Build:** Free tier includes:
  - 30 builds per month
  - Unlimited for open source projects
  - See [pricing](https://expo.dev/pricing) for details

---

## Next Steps

After setting up development build:

1. ✅ Push notifications will work
2. ✅ All native features available
3. ✅ Can test custom app configuration
4. ✅ Ready for production builds

For production builds, use:
```bash
eas build --profile production --platform all
```

---

**Reference Links:**
- [Expo Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Expo Dev Client](https://docs.expo.dev/clients/introduction/)

