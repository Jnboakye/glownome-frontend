# How to Verify You're Running the Auth Branch

The owner reported not seeing the sign-in UI. This is likely because they're running the wrong branch or missing environment configuration. Here's how to verify and fix it.

## Step 1: Verify Git Branch in the Codebase

```bash
cd /path/to/glownome-frontend
git branch
# Should show: * cursor/add-supabase-auth-fe92

git log --oneline -3
# Should show recent commits:
# be9cf30 Add comprehensive testing guide...
# dc166ff Add Supabase authentication...
```

If you're not on `cursor/add-supabase-auth-fe92`:
```bash
git fetch origin
git checkout cursor/add-supabase-auth-fe92
```

## Step 2: Verify Code Changes Are Present

Check if `SignInScreen.tsx` exists:
```bash
ls -la src/screens/SignInScreen.tsx
# Should show: -rw-r--r--  ... src/screens/SignInScreen.tsx
```

Check if Supabase is imported in RootNavigator:
```bash
grep -n "supabase" src/navigation/RootNavigator.tsx
# Should show imports from '../lib/supabase'
```

## Step 3: Install Dependencies

```bash
npm install
# Should install @supabase/supabase-js, expo-secure-store, react-native-url-polyfill
```

## Step 4: Environment Configuration

### Option A: Missing .env (You'll see a helpful error screen)
If you don't have a `.env` file, the app will show a **Configuration Required** screen with:
- ⚠️ Warning icon
- "Missing EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY"
- Setup instructions

This is **expected behavior** and means the auth branch is working correctly!

### Option B: Create .env to Enable Auth
```bash
# Copy the example
cp .env.example .env

# Edit .env and add your values:
# EXPO_PUBLIC_API_URL=http://YOUR_MAC_IP:8000
# EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 5: Clear Metro Cache and Restart

**CRITICAL**: Environment variable changes require a Metro restart with cache clear:

```bash
# Stop Metro (Ctrl+C in the terminal where it's running)

# Clear cache and restart
npx expo start -c

# Or in one command:
npx expo start --clear
```

## Step 6: Verify in Expo Go

### Expected Behavior WITH .env configured:
1. Open app in Expo Go
2. **You should see the SignIn screen** with:
   - "Glownome" title at top
   - "Welcome back" or "Create your account"
   - Email field
   - Password field
   - "Sign in" or "Create account" button
   - "or" divider
   - "Continue with Google" button
   - "Sign in with Apple (coming soon)" (greyed out)

### Expected Behavior WITHOUT .env:
1. Open app in Expo Go
2. **You should see a Configuration Required screen** with:
   - ⚠️ icon
   - Error message about missing env vars
   - Setup instructions
   - Example code snippet

### What You Should NOT See:
- ❌ Red error screen (unless there's a different bug)
- ❌ Onboarding screen immediately (should see SignIn first)
- ❌ Main app tabs immediately (should see SignIn first)

## Step 7: Clear Old App Data (If Needed)

If you previously tested and have old onboarding data or a cached session, the app might skip sign-in. To reset:

### iOS (Simulator):
```bash
# Completely uninstall and reinstall
# In simulator: Long-press app icon → Remove App → Delete App

# Then reopen in Expo Go
```

### Android (Emulator):
```bash
# Clear app data
adb shell pm clear host.exp.exponent

# Or uninstall Expo Go completely:
adb uninstall host.exp.exponent
# Then reinstall from Play Store or:
adb install expo-go.apk
```

### Physical Device:
1. In Expo Go, go to Projects
2. Find Glownome
3. Long-press → Clear cache
4. Reopen the app

## Debugging: What Screen Do You See?

### Scenario A: Red Error Screen
**Message**: "Missing Supabase environment variables..."
**Cause**: You're on the auth branch, but this error was shown BEFORE the fix
**Solution**: Pull latest changes from `cursor/add-supabase-auth-fe92` which now shows a friendly error screen instead

### Scenario B: Configuration Required Screen (⚠️)
**This is CORRECT!** You're on the auth branch, Supabase is not configured.
**Solution**: Create `.env` with Supabase credentials, restart Metro

### Scenario C: Onboarding Screen (Educational Screens)
**Cause**: You're running the `main` branch, not the auth branch
**Solution**: `git checkout cursor/add-supabase-auth-fe92`, restart Metro

### Scenario D: Main App (Scan/Progress/Profile Tabs)
**Cause**: You're running `main` OR you have old onboarding data
**Solution**: Check git branch, clear app data, restart

### Scenario E: SignIn Screen (Email/Password/Google buttons)
**Perfect!** You're on the auth branch with Supabase configured.
**Next**: Test signing up or signing in

## Quick Diagnostic Command

Run this in your project directory:

```bash
echo "=== Branch Check ==="
git branch | grep '*'
echo ""
echo "=== SignInScreen Exists? ==="
ls -la src/screens/SignInScreen.tsx 2>&1
echo ""
echo "=== .env Exists? ==="
ls -la .env 2>&1
echo ""
echo "=== Supabase Vars in .env ==="
grep SUPABASE .env 2>&1
echo ""
echo "=== Node Modules Installed? ==="
ls -la node_modules/@supabase/supabase-js 2>&1 | head -1
```

**Expected output on the auth branch:**
```
=== Branch Check ===
* cursor/add-supabase-auth-fe92

=== SignInScreen Exists? ===
-rw-r--r--  ... src/screens/SignInScreen.tsx

=== .env Exists? ===
# Either: -rw-r--r-- ... .env
# Or: ls: .env: No such file or directory (this is OK, will show config screen)

=== Supabase Vars in .env ===
# Either: EXPO_PUBLIC_SUPABASE_URL=...
#         EXPO_PUBLIC_SUPABASE_ANON_KEY=...
# Or: grep: .env: No such file or directory

=== Node Modules Installed? ===
drwxr-xr-x ... node_modules/@supabase/supabase-js
```

## Still Not Working?

1. **Show me your terminal output** when you run:
   ```bash
   git branch
   cat .env
   npm list @supabase/supabase-js
   ```

2. **Take a screenshot** of what you see in Expo Go

3. **Check Metro logs** in the terminal for errors when the app opens

4. **Try a completely fresh start**:
   ```bash
   git checkout cursor/add-supabase-auth-fe92
   git pull origin cursor/add-supabase-auth-fe92
   rm -rf node_modules
   npm install
   npx expo start --clear
   ```
