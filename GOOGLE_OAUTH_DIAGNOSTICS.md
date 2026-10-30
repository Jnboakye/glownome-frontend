# Google OAuth Diagnostics & Troubleshooting

## Latest Changes (2024-10-30)

Added comprehensive on-device diagnostics to debug why Google Sign-In wasn't working on iPhone.

### What Was Added

**On-Screen Debug Display**:
- Shows each step of the OAuth flow
- Displays redirect URI (for adding to Supabase)
- Shows OAuth URL host (confirms Supabase responds)
- Displays browser result type (success/cancel/dismiss/locked)
- Shows error messages with details
- Visible directly on screen (no need to check console)

**Improved Error Handling**:
- Cancel/dismiss now show Alerts (not silent)
- All result types handled explicitly
- Detailed error messages with context
- Better URL parsing (regex-based, works in React Native)

**iOS-Specific Fixes**:
- Added `WebBrowser.warmUpAsync()` before opening browser
- Added `preferEphemeralSession: true` option
- Added `WebBrowser.coolDownAsync()` after flow
- Better handling of browser lifecycle

---

## What You'll See on Screen

When you tap "Continue with Google", you'll see a debug info box under the button showing:

### Step 1: Initial State
```
Step 1: Redirect URI
exp://192.168.1.42:8081/--/auth/callback

Add to Supabase:
exp://**
glownome://**
```

### Step 2: OAuth URL Retrieved
```
Step 1: Redirect URI
exp://192.168.1.42:8081/--/auth/callback

Step 2: Requesting OAuth URL from Supabase...
✅ Got OAuth URL from: accounts.google.com

Step 3: Opening browser...
```

### Step 3a: Success Flow
```
Browser result type: success
Result URL: exp://192.168.1.42:8081/--/auth/callback?code=...

Step 4: Parsing callback URL...
✅ Got auth code: 4/0AcvDM...

Step 5: Exchanging code for session...
✅ Sign-in successful!
```

**Alert will show**: "Success - Signed in with Google!"

### Step 3b: User Cancelled
```
Browser result type: cancel
⚠️ User cancelled
```

**Alert will show**: "Cancelled - Google Sign-In was cancelled"

### Step 3c: Browser Dismissed (Likely Root Cause)
```
Browser result type: dismiss
⚠️ Browser dismissed
```

**Alert will show**: "Dismissed - Sign-in browser was dismissed"

**This means**: The browser opened but immediately closed, possibly due to:
- Invalid redirect URI (not in Supabase allowed list)
- Network error reaching Google
- iOS security restrictions
- Missing Supabase configuration

### Step 3d: Error
```
Step 1: Redirect URI
exp://...

Step 2: Requesting OAuth URL...
❌ Supabase error: Invalid credentials
```

**Alert will show**: "Google Sign-In Failed - [error details]"

---

## Root Cause Analysis

Based on the symptoms (loading briefly, then stops, no browser), the most likely causes are:

### 1. Browser Dismissed Immediately ⭐ **MOST LIKELY**

**Symptoms**:
- Loading state appears briefly
- No browser window visible
- No alert shown (previously - now fixed)

**Cause**: `openAuthSessionAsync` returns `type: 'dismiss'` immediately

**Why This Happens**:
- **Invalid redirect URI**: The exp:// URL isn't in Supabase's allowed redirect URLs
- **Network error**: Can't reach Google OAuth servers
- **iOS App Transport Security**: Blocking the OAuth URL
- **Supabase not configured**: Missing Google provider settings

**Fix**:
1. Check debug info for exact redirect URI
2. Add to Supabase: `exp://**` and `glownome://**`
3. Verify Google OAuth enabled in Supabase
4. Check Supabase callback URL in Google Cloud Console

### 2. Silent Promise Rejection

**Symptoms**:
- No error shown
- Code appears to complete but nothing happens

**Previously**: `try/catch` might not have caught async errors

**Fix**: All async errors now caught and displayed

### 3. URL Parsing Failure

**Symptoms**:
- Browser returns successfully
- But session isn't created

**Previously**: `new URL().searchParams` might not work in React Native

**Fix**: Using regex parsing (`/[?&]code=([^&#]+)/`) which works reliably

### 4. iOS WebBrowser Issues

**Symptoms**:
- Browser doesn't open or closes immediately
- Works on Android but not iOS

**Fix**:
- Added `warmUpAsync()` to prepare browser
- Added `preferEphemeralSession: true` for privacy
- Added `coolDownAsync()` to clean up
- These are iOS-specific optimizations

---

## Required Supabase Configuration

### Exact Redirect URLs to Add

Go to **Supabase Dashboard → Authentication → URL Configuration → Redirect URLs**

**Add these entries**:

1. **Wildcard for Expo Go** (recommended):
   ```
   exp://**
   ```

2. **Wildcard for builds** (recommended):
   ```
   glownome://**
   ```

3. **Or specific URLs** (if wildcards don't work):
   
   For Expo Go:
   ```
   exp://192.168.1.42:8081/--/auth/callback
   exp://127.0.0.1:8081/--/auth/callback
   exp://localhost:8081/--/auth/callback
   ```
   
   For builds:
   ```
   glownome://auth/callback
   ```

**The exact URI for your device** is shown in the debug info on screen!

### Why exp://** Works

The wildcard `exp://**` matches:
- `exp://192.168.1.42:8081/--/auth/callback` (your LAN IP)
- `exp://127.0.0.1:8081/--/auth/callback` (localhost)
- `exp://192.168.1.100:19000/--/auth/callback` (different IP/port)
- Any other exp:// URL Expo Go generates

This is recommended because Expo Go's URLs can change based on:
- Your network IP address
- Which port Metro is using
- Device configuration

### Verify Google Cloud Console

Make sure your **Supabase callback URL** is in Google's authorized redirect URIs:

1. Google Cloud Console → Credentials → Your OAuth client
2. Authorized redirect URIs should include:
   ```
   https://YOUR-PROJECT.supabase.co/auth/v1/callback
   ```

**Example**:
```
https://hatsybfzmtfkqaxqnkfq.supabase.co/auth/v1/callback
```

---

## Testing Checklist

After updating Supabase redirect URLs:

- [ ] Pull latest code: `git pull origin cursor/add-supabase-auth-fe92`
- [ ] Clean install: `rm -rf node_modules && npm install`
- [ ] Clear cache: `npx expo start -c`
- [ ] Open in Expo Go
- [ ] Note the redirect URI shown on screen
- [ ] Verify it's added to Supabase (or use wildcard `exp://**`)
- [ ] Tap "Continue with Google"
- [ ] Watch debug info appear on screen
- [ ] Look for one of these:
  - ✅ "Sign-in successful" → Working!
  - ⚠️ "Browser dismissed" → Check Supabase redirect URLs
  - ⚠️ "User cancelled" → User closed browser (not an error)
  - ❌ Error message → Read the error details

---

## Expected Console Logs

With the new diagnostics, you'll see detailed logs:

```
[SignInScreen] Step 1 - Redirect URI: exp://192.168.1.42:8081/--/auth/callback
[SignInScreen] Step 2 - Calling signInWithOAuth
[SignInScreen] Step 3 - Opening browser, OAuth host: accounts.google.com
[SignInScreen] Calling openAuthSessionAsync
[SignInScreen] Browser result: {
  "type": "success",
  "url": "exp://192.168.1.42:8081/--/auth/callback?code=..."
}
[SignInScreen] Step 4 - Parsing result URL: exp://...
[SignInScreen] Extracted code from query string
[SignInScreen] Step 5 - Exchanging code for session
[SignInScreen] Google Sign-In successful
```

Or if dismissed:
```
[SignInScreen] Step 1 - Redirect URI: exp://...
[SignInScreen] Step 2 - Calling signInWithOAuth
[SignInScreen] Step 3 - Opening browser, OAuth host: accounts.google.com
[SignInScreen] Calling openAuthSessionAsync
[SignInScreen] Browser result: {
  "type": "dismiss"
}
[SignInScreen] Browser dismissed
```

---

## What to Look For

### If You See "Browser dismissed"

**Problem**: The browser opened but immediately closed

**Check**:
1. Is `exp://**` in Supabase redirect URLs? ⭐ **MOST IMPORTANT**
2. Is Google OAuth enabled in Supabase?
3. Is Supabase callback URL in Google Cloud Console?
4. Check network connectivity

### If Browser Opens But Nothing Happens

**Problem**: Browser shows Google sign-in but doesn't come back

**Check**:
1. Did you sign in with Google?
2. Did you authorize the app?
3. Does the redirect URI match what's in Supabase?
4. Check console for errors after you authorize

### If You See "No code or tokens found"

**Problem**: Browser returned but the URL doesn't have auth data

**Check**:
1. Supabase callback URL in Google Cloud Console
2. Google OAuth client ID/secret in Supabase
3. Network errors during OAuth flow

### If Loading Just Stops

**Problem**: Code fails silently (shouldn't happen now)

**Check**:
1. Debug info should appear on screen
2. If not, check console for errors
3. Verify all packages installed: `npx expo install --check`

---

## iOS-Specific Issues

### App Transport Security (ATS)

If you see network errors, iOS might be blocking HTTP:

**Solution**: Ensure all URLs use HTTPS (they should)

### Safari View Controller

iOS uses SFSafariViewController for in-app browsing:

**Symptoms**:
- Browser opens but looks broken
- Can't interact with Google sign-in page

**Solution**:
- Use `preferEphemeralSession: true` (already added)
- Ensure iOS 11+ (should be fine)

### Multiple Browser Sessions

If you see "Browser locked":

**Cause**: Another browser is already open

**Solution**:
- Close all other OAuth flows
- Restart the app
- `coolDownAsync()` now called automatically

---

## Quick Fix Steps

1. **Pull latest code** (includes diagnostics):
   ```bash
   git pull origin cursor/add-supabase-auth-fe92
   rm -rf node_modules && npm install
   npx expo start -c
   ```

2. **Check the on-screen redirect URI**

3. **Add to Supabase**:
   - Dashboard → Authentication → Redirect URLs
   - Add: `exp://**` and `glownome://**`

4. **Tap "Continue with Google"**

5. **Read the debug info** that appears on screen

6. **Look for**:
   - "Browser dismissed" → redirect URI not in Supabase
   - "User cancelled" → you closed the browser
   - "Sign-in successful" → it works! 🎉

---

## Summary of Changes

### Code Changes

1. **src/screens/SignInScreen.tsx**:
   - Added `debugInfo` state for on-screen diagnostics
   - Logs redirect URI on mount and shows on screen
   - Step-by-step diagnostic messages
   - Shows OAuth URL host (not full URL)
   - Displays browser result type and URL
   - Regex-based URL parsing (works in RN)
   - Explicit handling of cancel/dismiss/locked states
   - All states now show alerts (not silent)
   - Added `warmUpAsync()` before browser
   - Added `preferEphemeralSession: true` option
   - Added `coolDownAsync()` after browser
   - Debug info box renders under Google button

### What Was Fixed

- ✅ Silent failures (cancel/dismiss now show alerts)
- ✅ URL parsing (regex instead of new URL)
- ✅ iOS browser lifecycle (warmUp/coolDown)
- ✅ On-screen diagnostics (no need for console)
- ✅ Better error messages with context
- ✅ Explicit handling of all result types

### What You Get Now

- Step-by-step progress visible on screen
- Exact redirect URI shown for copying
- Clear error messages with suggestions
- All outcomes visible (not silent)
- Better iOS compatibility

---

## Support

If Google Sign-In still fails after following this guide:

1. **Screenshot the debug info** that appears on screen
2. **Copy the redirect URI** shown
3. **Verify it's in Supabase** redirect URLs
4. **Check Metro console** for additional errors
5. **Try email sign-in** to verify Supabase works at all

The on-screen diagnostics should tell you exactly what's failing!
