# Debugging Sign-In Screen Issues

## Critical Bugs Fixed (2024-10-30 - Second Fix)

### 🔴 Bug #1: Wrong expo-secure-store Version (CRITICAL)
**Impact**: App would crash or fail silently at runtime when trying to use SecureStore

**Problem**:
- Package version: `expo-secure-store@^58.0.2` (for Expo SDK 58)
- Your SDK: Expo SDK 54
- Expected version: `expo-secure-store@~15.0.8`

**Why this broke sign-in**:
- SecureStore failed to load in Expo Go
- `useAuthSession` couldn't persist sessions
- Supabase client initialization may have failed
- No error shown, just silent failure

**Fixed**: Updated `package.json` to correct version

---

### 🔴 Bug #2: React Hooks Violation (CRITICAL)
**Impact**: Unpredictable rendering behavior, possible infinite loops

**Problem**:
```typescript
export function RootNavigator() {
  // ❌ WRONG: Early return before hooks
  if (!isSupabaseConfigured()) {
    return <ErrorScreen />; 
  }
  
  // Hooks called after conditional return
  const auth = useAuthSession();
  // ...
}
```

**Why this broke sign-in**:
- Violates React's Rules of Hooks
- Hooks must be called in same order every render
- Could cause auth state to be lost or inconsistent

**Fixed**: Always call hooks first, check config after

---

### 🟡 Bug #3: Incorrect Auth State Check
**Problem**:
```typescript
// ❌ WRONG: Doesn't check for null
const isAuthenticated = auth.session !== undefined;

// Session could be null (loading) or undefined (not authenticated)
// null !== undefined is true, so would be treated as authenticated!
```

**Fixed**:
```typescript
// ✅ CORRECT: Check both null and undefined
const isAuthenticated = auth.session !== undefined && auth.session !== null;
```

---

### 🟢 Enhancement: Debug Logging
Added extensive logging to diagnose issues:

**Console Logs**:
- `[useAuthSession]` - Session loading, changes, errors
- `[RootNavigator]` - Auth state, route decisions
- `[SignInScreen]` - When screen mounts

**On-Screen Debug (dev mode only)**:
- Top-left corner shows:
  - `Route: SignIn` (or Main/Onboarding)
  - `Auth: YES` or `Auth: NO`

---

## How to Test After Fix

### Step 1: Pull Latest Changes
```bash
cd /path/to/glownome-frontend
git checkout cursor/add-supabase-auth-fe92
git pull origin cursor/add-supabase-auth-fe92
git log --oneline -1
# Should show: faaf77e Fix: Critical bugs preventing SignIn screen...
```

### Step 2: Install Correct Dependencies
```bash
npm install
# This installs expo-secure-store@~15.0.8

# Verify correct version:
npm list expo-secure-store
# Should show: expo-secure-store@15.0.8 (or 15.0.x)
```

### Step 3: Verify Environment
```bash
cat .env
# Should show:
# EXPO_PUBLIC_API_URL=http://...
# EXPO_PUBLIC_SUPABASE_URL=https://...
# EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

### Step 4: Clear Everything and Restart
```bash
# Clear Metro cache
npx expo start --clear

# This is CRITICAL - env vars and native module changes
# require a full Metro restart with cache clear
```

### Step 5: Open in Expo Go

**Expected behavior**: SignIn screen with:
- "Glownome" title (large, purple)
- "Welcome back" heading
- Email field
- Password field
- "Sign in" button
- "or" divider
- "Continue with Google" button
- "Sign in with Apple (coming soon)" (greyed out)

### Step 6: Check Debug Indicators

**Top-left corner** (green text on black background):
```
Route: SignIn
Auth: NO
```

**Metro terminal** (console logs):
```
[useAuthSession] Supabase not configured... (if no .env)
OR
[useAuthSession] Initial session loaded: { hasSession: false, ... }
[RootNavigator] Loading states: { authLoading: false, ... }
[RootNavigator] Auth state: { isAuthenticated: false, ... }
[RootNavigator] Computed initial route: SignIn
[SignInScreen] Mounted/Rendered: { isSignUp: false, ... }
```

---

## Troubleshooting: Still Not Showing SignIn?

### Check 1: Verify Package Version
```bash
npm list expo-secure-store
# Must show: expo-secure-store@15.0.8 (or 15.0.x)
# If shows 58.x.x, run: npm install expo-secure-store@~15.0.8
```

### Check 2: Check Console Logs
Look for these logs in Metro terminal:

**Good signs**:
```
[useAuthSession] Initial session loaded: { hasSession: false }
[RootNavigator] Computed initial route: SignIn
[SignInScreen] Mounted/Rendered
```

**Bad signs**:
```
[useAuthSession] Error loading session: ...
# OR no useAuthSession logs at all (SecureStore failed to load)
```

### Check 3: Clear App Data
Old SecureStore data might have a stale session:

**iOS Simulator**:
```bash
# Reset simulator
xcrun simctl erase all
# Or: Device → Erase All Content and Settings
```

**Android Emulator**:
```bash
adb shell pm clear host.exp.exponent
```

**Physical Device**:
1. In Expo Go, long-press app
2. Remove from recent projects
3. Reopen

### Check 4: Check Debug Indicator
If you see:
```
Route: Main
Auth: YES
```

Then there's a **stale session** in SecureStore. Clear it:
```bash
# In Expo Go, the easiest way is to uninstall and reinstall
```

### Check 5: Force Clear Session
If stale session persists, temporarily add this to `useAuthSession`:

```typescript
useEffect(() => {
  // TEMPORARY: Clear any stale sessions
  if (supabase) {
    supabase.auth.signOut().then(() => {
      console.log('Cleared any stale session');
    });
  }
  // ... rest of useEffect
}, []);
```

Then restart app, then remove this code.

---

## What the Console Logs Mean

### `[useAuthSession] Supabase not configured`
- .env is missing or incomplete
- Check EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY

### `[useAuthSession] Initial session loaded: { hasSession: false }`
- ✅ Good! No stale session, auth is working
- Should see SignIn screen

### `[useAuthSession] Initial session loaded: { hasSession: true }`
- ⚠️ There's a cached session from a previous test
- If it's valid, you'll see Main/Onboarding
- If it's expired, should auto-clear and show SignIn

### `[useAuthSession] Session expired, treating as not authenticated`
- ✅ Good! Detected and cleared expired session
- Should show SignIn screen

### `[useAuthSession] Error loading session: ...`
- ❌ SecureStore or Supabase error
- Check that expo-secure-store is v15.0.8
- Check that SUPABASE_URL is valid HTTPS URL

### `[RootNavigator] Computed initial route: Main`
- ⚠️ You're authenticated (or have stale session)
- Check if this is expected
- If not, clear app data

### `[SignInScreen] Mounted/Rendered`
- ✅ Perfect! SignIn screen is rendering
- If you don't see UI, it's a style/rendering issue (unlikely)

---

## Still Not Working? Send This Info

1. **Git commit**:
   ```bash
   git log --oneline -1
   ```

2. **Package version**:
   ```bash
   npm list expo-secure-store
   ```

3. **Environment check**:
   ```bash
   cat .env
   # (redact actual keys)
   ```

4. **Console logs** (copy from Metro terminal):
   ```
   [useAuthSession] ...
   [RootNavigator] ...
   [SignInScreen] ...
   ```

5. **Debug indicator** (what's shown in top-left corner):
   ```
   Route: ???
   Auth: ???
   ```

6. **Screenshot** of what you see in Expo Go

---

## Expected Flow After Fixes

1. **App launches** → Loading spinner
2. **Hooks load** → Console logs show auth state
3. **Route computed** → `[RootNavigator] Computed initial route: SignIn`
4. **SignIn renders** → `[SignInScreen] Mounted/Rendered`
5. **UI visible** → Email/password fields, Google button
6. **Debug indicator** → `Route: SignIn, Auth: NO`

If any step fails, the console logs will show exactly where and why.
