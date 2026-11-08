# Building Glownome for Android with EAS

This document explains how to build Android APKs and AABs (Android App Bundles) for Glownome using Expo's EAS Build service.

## Prerequisites

Before you can build for Android, you need:

1. **Expo Account**: Sign up at [expo.dev](https://expo.dev) if you don't have an account
2. **EAS CLI**: Install globally with `npm install -g eas-cli`
3. **Authentication**: Run `eas login` and sign in with your Expo account
4. **Project Setup**: Run `eas init` in the project root to link this project to your Expo account (creates/updates `extra.eas.projectId` in app.json)

## Environment Variables

Glownome requires several environment variables for API access. These must be configured **before** building:

### Required Variables

- `EXPO_PUBLIC_API_URL` — Your backend API URL
- `EXPO_PUBLIC_SUPABASE_URL` — Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` — Your Supabase anonymous/public key

### Setting Environment Variables

**Option 1: Using EAS CLI (Recommended)**

```bash
eas env:create --name EXPO_PUBLIC_API_URL --value "https://api.example.com" --profile preview
eas env:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://xxxxx.supabase.co" --profile preview
eas env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "your-anon-key" --profile preview
```

Repeat for `development` and `production` profiles as needed.

**Option 2: Update eas.json**

Edit the `env` blocks in `eas.json` to replace the placeholder values:

```json
"preview": {
  "env": {
    "EXPO_PUBLIC_API_URL": "https://api.example.com",
    "EXPO_PUBLIC_SUPABASE_URL": "https://xxxxx.supabase.co",
    "EXPO_PUBLIC_SUPABASE_ANON_KEY": "your-anon-key"
  }
}
```

**⚠️ Warning**: Do NOT commit real secrets to the repository. Use Option 1 for production secrets.

## Build Profiles

Glownome has three EAS build profiles:

### 1. Development

Builds a development client (like Expo Go but with your native code):

```bash
eas build --profile development --platform android
```

- **Output**: APK file
- **Distribution**: Internal (for your team only)
- **Use case**: Testing with custom native modules or debugging builds

### 2. Preview

Builds a production-like APK for testing:

```bash
eas build --profile preview --platform android
```

- **Output**: APK file
- **Distribution**: Internal (for your team only)
- **Use case**: Testing before Play Store submission, sharing with QA testers

### 3. Production

Builds an Android App Bundle for Play Store submission:

```bash
eas build --profile production --platform android
```

- **Output**: AAB (Android App Bundle)
- **Auto-increment**: Version code is automatically incremented
- **Use case**: Play Store releases

## Installing Builds on Your Phone

### For APK Builds (development, preview)

1. After the build completes, EAS provides a download URL
2. Open the URL on your Android phone or scan the QR code
3. Download the APK
4. Install it (you may need to allow installation from unknown sources in Settings)

Alternatively, download the APK on your computer and transfer it via:
- USB: `adb install path/to/app.apk`
- Cloud storage: Upload to Drive/Dropbox and download on phone

### For AAB Builds (production)

AAB files cannot be installed directly. They must be uploaded to Google Play Console:

1. Go to [Google Play Console](https://play.google.com/console)
2. Select your app (or create a new app)
3. Navigate to **Production** → **Releases** → **Create new release**
4. Upload the AAB file downloaded from EAS
5. Complete the release form and submit for review

## App Signing & Credentials

EAS manages your app signing credentials automatically. On your first build, EAS will:

1. Generate a keystore for signing Android builds
2. Store it securely in the Expo cloud
3. Reuse it for all future builds (maintaining consistent app identity)

### Important: Google Sign-In SHA-1 Fingerprint

For **Google Sign-In to work**, you must register your app's SHA-1 signing certificate fingerprint in:

1. **Google Cloud Console** (for OAuth)
2. **Supabase Dashboard** (under Authentication → Providers → Google)

#### Get your SHA-1 fingerprint:

```bash
eas credentials --platform android
```

Select your app, then choose "Keystore" → "View keystore information". Copy the SHA-1 fingerprint.

#### Add to Google Cloud Console:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Edit your OAuth 2.0 Client ID for Android
5. Add the SHA-1 fingerprint
6. Save

#### Add to Supabase:

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Providers** → **Google**
3. Add the SHA-1 fingerprint under "Android settings"
4. Save

### Supabase OAuth Redirect URL

Ensure your Supabase project has the correct redirect URL configured:

- **Redirect URL**: `glownome://` (matches the `scheme` in app.json)

Add this in: **Supabase Dashboard** → **Authentication** → **URL Configuration** → **Redirect URLs**

## Monitoring Builds

View build progress:
- On the web: EAS provides a build URL when you start a build
- In the terminal: `eas build:list`
- For detailed logs: `eas build:view <build-id>`

## Troubleshooting

### Build fails with "No app.json projectId"

Run `eas init` to link the project to your Expo account.

### "Missing environment variables" error

Make sure you've set all required environment variables (see "Environment Variables" above).

### Google Sign-In not working after build

Verify:
1. SHA-1 fingerprint is registered in both Google Cloud Console AND Supabase
2. Supabase redirect URL includes `glownome://`
3. Android package name matches `de.glownome.app`

### "CAMERA permission not granted"

The app automatically requests camera permissions. If users deny them, they must enable them manually in:
**Settings** → **Apps** → **Glownome** → **Permissions** → **Camera**

## Resources

- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Expo SDK 54 Documentation](https://docs.expo.dev/versions/v54.0.0/)
- [Android App Bundle Guide](https://developer.android.com/guide/app-bundle)
- [Google Play Console](https://play.google.com/console)
