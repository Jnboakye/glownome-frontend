# Testing Supabase Authentication in Glownome

This guide walks through testing the new Supabase authentication integration in Expo Go.

## Prerequisites

### 1. Supabase Project Setup
If you don't have a Supabase project yet:
1. Go to https://supabase.com and create a free account
2. Create a new project
3. Note your project URL and anon key from Settings → API

### 2. Configure Supabase

#### A. Enable Authentication Providers
1. In Supabase Dashboard → **Authentication → Providers**
2. **Email provider**: Should be enabled by default
   - Confirm users can sign up: ✓ Enable email confirmations
3. **Google provider** (optional for now):
   - Toggle to enable
   - Add OAuth client ID and secret (from Google Cloud Console)

#### B. Add Redirect URLs
1. Go to **Authentication → URL Configuration**
2. Add to "Redirect URLs": `glownome://auth/callback`
3. This allows OAuth to return to the app after authentication

#### C. Configure Email Templates (optional)
1. Go to **Authentication → Email Templates**
2. Customize the "Confirm signup" template if desired
3. Email confirmations are required by default for new accounts

### 3. Environment Configuration

Create a `.env` file in the project root:

```bash
# Backend API (use your Mac's LAN IP, not localhost)
EXPO_PUBLIC_API_URL=http://192.168.1.42:8000

# Supabase (from your Supabase dashboard → Settings → API)
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**Finding your Mac's LAN IP:**
```bash
ipconfig getifaddr en0
```

**For Android Emulator:**
```bash
EXPO_PUBLIC_API_URL=http://10.0.2.2:8000
```

**For iOS Simulator:**
```bash
EXPO_PUBLIC_API_URL=http://localhost:8000
```

### 4. Start the Development Environment

```bash
# Install dependencies (if not already done)
npm install

# Clear Metro cache and start
npx expo start -c
```

## Testing Flow

### Test 1: Sign Up with Email
1. Open the app in Expo Go
2. You should see the **SignIn screen** (not onboarding)
3. Tap the "Don't have an account? Sign up" link
4. Enter a valid email and password (min 6 characters)
5. Tap "Create account"
6. Expected result: Alert says "Check your email"
7. Open your email and click the verification link
8. Return to the app and tap "Already have an account? Sign in"
9. Enter the same email and password
10. Tap "Sign in"
11. Expected result: You're taken to the **Onboarding** screen (first-time flow)

### Test 2: Complete Onboarding as Authenticated User
1. After signing in, complete the onboarding wizard:
   - Educational screens
   - Skin concerns questionnaire
   - Routine preference
   - Name entry
   - Profile creation
2. Expected result: Your profile is created with your **Supabase user ID**
3. You should see the main app (bottom tabs: Scan, Progress, Profile)

### Test 3: Sign Out and Sign In Again
1. Go to the **Profile** tab
2. Verify your email is displayed under your name (not "Not signed in")
3. Scroll down and tap "Sign out"
4. Confirm in the alert
5. Expected result: You're back at the **SignIn screen**
6. Sign in again with the same credentials
7. Expected result: You go **directly to the main app** (skipping onboarding)

### Test 4: Take a Scan (Requires Backend)
**Prerequisites**: Backend must be running with Supabase auth enabled

1. Sign in to the app
2. Go to the **Scan** tab
3. Tap "Take a new scan"
4. Grant camera permissions if prompted
5. Capture a photo
6. Expected result: 
   - Scan is uploaded with your auth token
   - Backend creates scan record tied to your Supabase user ID
   - Analysis runs (if Claude is configured)
   - Results appear with recommendations

### Test 5: Google Sign-In (Optional)
**Prerequisites**: 
- Google OAuth configured in Supabase
- Redirect URL `glownome://auth/callback` added to Supabase

1. On the SignIn screen, tap "Continue with Google"
2. Browser opens with Google sign-in page
3. Select a Google account
4. Authorize the app
5. Expected result: Browser redirects back to the app
6. You should be signed in and see onboarding (first time) or main app

**Note**: Google Sign-In in Expo Go uses web OAuth, not the native Google SDK. For native experience, you need a dev build.

### Test 6: Session Persistence
1. Sign in to the app
2. Force-quit the app (swipe up from recent apps)
3. Reopen the app
4. Expected result: You're still signed in (session persisted in SecureStore)
5. No need to sign in again

### Test 7: 401 Error Handling
**Simulate an expired token:**
1. Sign in to the app
2. In Supabase Dashboard → **Authentication → Users**
3. Find your user and click "..." → "Sign out user" (revokes all sessions)
4. In the app, try to take a scan or update your profile
5. Expected result:
   - API returns 401
   - App signs you out automatically
   - You're redirected to the SignIn screen
   - Alert: "Your session has expired. Please sign in again."

### Test 8: Backend Integration
**Verify the backend receives auth correctly:**
1. Sign in to the app
2. Update your profile (change skin concerns, routine, etc.)
3. In the backend logs, verify:
   - `PUT /profile` request includes `Authorization: Bearer <token>`
   - Backend extracts user ID from JWT
   - Profile is updated for that user ID
4. Take a scan
5. In the backend logs, verify:
   - `POST /scans` request includes auth header
   - No `userId` in request body (backend derives from JWT)
   - Scan is created with the correct user ID

## Troubleshooting

### "Missing Supabase environment variables"
- Check that `.env` exists and has both `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Restart Metro: `npx expo start -c`
- Make sure variable names start with `EXPO_PUBLIC_` (required by Expo)

### Email verification link doesn't work
- Check Supabase → Authentication → URL Configuration
- Ensure redirect URL is set correctly
- For development, Supabase may show a warning but still work
- Check spam folder for verification email

### Google Sign-In opens browser but doesn't return to app
- Verify `glownome://auth/callback` is in Supabase redirect URLs
- Check app.json has `"scheme": "glownome"` (already present)
- In Expo Go, web OAuth is used (native won't work without dev build)

### "Could not reach the server at [IP]"
- Backend is not running, or wrong IP address
- Mac went to sleep (network stack paused)
- Firewall blocking connections
- Try: `curl http://YOUR_IP:8000/health` from your phone's browser

### "Your session has expired" on first request
- Backend may not be configured to accept Supabase JWTs
- Check backend has `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` env vars
- Verify backend's JWT verification is enabled
- Check backend logs for JWT verification errors

### Session doesn't persist after app restart
- SecureStore permissions issue (rare)
- Clear app data and sign in again
- Check iOS Keychain or Android EncryptedSharedPreferences access

### TypeScript errors after pulling changes
```bash
npm install
npx tsc --noEmit
```

## Architecture Notes

### How Auth Works
1. **Sign-in**: User enters credentials → Supabase Auth → Returns JWT access token
2. **Session Storage**: Token saved in SecureStore (encrypted, persists across restarts)
3. **Auto-Refresh**: Supabase SDK automatically refreshes token before expiry
4. **API Requests**: Every request to backend includes `Authorization: Bearer <token>`
5. **Backend Verification**: Backend validates JWT, extracts user ID, enforces RLS
6. **401 Handling**: Invalid/expired token → Auto sign-out → Redirect to SignIn

### Auth Flow States
```
Not Authenticated → SignIn Screen
    ↓ (sign in/up)
Authenticated + No Onboarding → Onboarding Flow
    ↓ (complete onboarding)
Authenticated + Onboarded → Main App
    ↓ (sign out)
Not Authenticated → SignIn Screen
```

### Session Lifecycle
- **Login**: `supabase.auth.signInWithPassword()` or `signInWithOAuth()`
- **Session Check**: `supabase.auth.getSession()` on app launch
- **Listen**: `supabase.auth.onAuthStateChange()` for real-time updates
- **Logout**: `supabase.auth.signOut()` clears session everywhere

### Security Notes
- **Anon Key**: Safe to commit, only grants access RLS policies allow
- **Service Role Key**: NEVER ship in app, backend only
- **Session Token**: Stored encrypted in SecureStore, not AsyncStorage
- **JWT Expiry**: Handled automatically by Supabase (default: 1 hour, auto-refresh)

## Next Steps

### For MVP Launch
1. Customize email verification template in Supabase
2. Set up password reset flow (use Supabase's built-in)
3. Add Apple Sign-In (requires Apple Developer account)
4. Test on real devices (not just Expo Go)

### For Production
1. Build a dev build: `eas build --profile development`
2. Enable native Google Sign-In (requires expo-auth-session)
3. Implement biometric auth (Face ID / Touch ID)
4. Add session management UI (view/revoke devices)
5. Set up Supabase edge functions for custom auth logic

## Support

### Useful Links
- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Expo Secure Store](https://docs.expo.dev/versions/latest/sdk/securestore/)
- [React Native Deep Linking](https://reactnative.dev/docs/linking)
- [Supabase React Native Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-react-native)

### Common Supabase Auth Flows
```typescript
// Sign up
await supabase.auth.signUp({ email, password })

// Sign in
await supabase.auth.signInWithPassword({ email, password })

// Sign in with OAuth
await supabase.auth.signInWithOAuth({ provider: 'google' })

// Sign out
await supabase.auth.signOut()

// Get current session
const { data: { session } } = await supabase.auth.getSession()

// Get current user
const { data: { user } } = await supabase.auth.getUser()
```
