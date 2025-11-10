# Quick Start: Development Build

## TL;DR - Get Running in 5 Steps

```bash
# 1. Install EAS CLI (if not already installed)
npm install -g eas-cli

# 2. Login to Expo
eas login

# 3. Navigate to mobile app
cd apps/mobile

# 4. Configure EAS (creates eas.json and projectId)
eas build:configure

# 5. Build development client for Android
eas build --profile development --platform android

# 6. Install APK on your device (download link provided after build)

# 7. Start dev server
npm run dev

# 8. Open the development build app on your device and scan QR code
```

---

## Detailed Steps

### Step 1: Install EAS CLI
```bash
npm install -g eas-cli
```

### Step 2: Login
```bash
eas login
```
Opens browser to authenticate.

### Step 3: Configure
```bash
cd apps/mobile
eas build:configure
```
This creates `eas.json` and sets up projectId.

### Step 4: Build Development Client

**For Android (recommended for first time):**
```bash
npm run build:dev:android
# Or
eas build --profile development --platform android
```

**For iOS:**
```bash
npm run build:dev:ios
# Or
eas build --profile development --platform ios
```

**Build takes 10-20 minutes** (first time). You'll get:
- Download link for APK/IPA
- QR code to install
- Email notification when ready

### Step 5: Install on Device

**Android:**
1. Download APK from EAS build page
2. Enable "Install from Unknown Sources"
3. Install APK
4. Open the app (shows Expo Dev Client)

**iOS:**
1. Download IPA
2. Install via TestFlight or Xcode

### Step 6: Start Dev Server
```bash
npm run dev
```

### Step 7: Connect Device
1. Open the **development build app** on your device
2. Scan QR code from terminal
3. App loads your JavaScript bundle

---

## What Changed?

✅ **Installed:** `expo-dev-client`  
✅ **Updated:** `app.json` with `expo-dev-client` plugin  
✅ **Added:** Build scripts to `package.json`

---

## Verify It Works

After connecting, check terminal for:
```
✅ Push token: ExponentPushToken[xxxxx]
```

No more errors about:
- ❌ "Expo Go limitations"
- ❌ "No projectId found"
- ❌ "Remote push notifications not supported"

---

## Daily Development

Once development build is installed:

```bash
# Just start the dev server
npm run dev

# Open development build app on device
# Scan QR code
# Code changes hot reload automatically
```

---

## When to Rebuild

Rebuild development client when:
- Adding new native dependencies
- Changing `app.json` native config
- Changing app icon, splash screen
- Updating Expo SDK version

**Rebuild command:**
```bash
npm run build:dev:android
```

---

## Troubleshooting

**"eas: command not found"**
```bash
npm install -g eas-cli
```

**"Not logged in"**
```bash
eas login
```

**Build fails**
- Check [expo.dev](https://expo.dev) → Your project → Builds for logs
- Verify `app.json` is valid
- Check EAS account has build credits

**Can't connect to dev server**
- Ensure device and computer on same WiFi
- Try entering URL manually (shown in terminal)
- Check firewall settings

---

**Full guide:** See `DEVELOPMENT-BUILD-GUIDE.md` for detailed instructions.

