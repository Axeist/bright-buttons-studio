# Fix: "requested path is invalid" Error

## 🚨 Problem

When clicking the confirmation link in the email, you're seeing:
```
Error: {"error":"requested path is invalid"}
URL: tazwnhyrjgsmxomukrtj.supabase.co/brightbuttons.in#access_token=...
```

This means Supabase is trying to append `brightbuttons.in` as a path to the Supabase project URL instead of redirecting to your domain.

---

## ✅ Solution

The issue is in your **Supabase Dashboard configuration**. Follow these steps:

### Step 1: Fix Site URL

1. Go to **Settings** → **API** (left sidebar)
2. Find **"Site URL"** field
3. **IMPORTANT:** Set it to your domain (NOT a path):
   ```
   https://brightbuttons.in
   ```
   ⚠️ **DO NOT** include any path like `/customer/confirm` here!
4. Click **Save**

### Step 2: Fix Redirect URLs

1. Go to **Authentication** → **URL Configuration** (under CONFIGURATION)
2. Find **"Redirect URLs"** field
3. Add these **FULL URLs** (one per line):
   ```
   https://brightbuttons.in/customer/confirm
   https://brightbuttons.in/customer/reset-password
   https://brightbuttons.in/customer/dashboard
   https://brightbuttons.in/confirm
   https://brightbuttons.in/reset-password
   https://brightbuttons.in/dashboard
   https://brightbuttons.in/login
   https://brightbuttons.in/customer/login
   ```
4. Click **Save**

### Step 3: Verify Configuration

**Site URL should be:**
- ✅ `https://brightbuttons.in` (just the domain, no path)

**Redirect URLs should be:**
- ✅ `https://brightbuttons.in/customer/confirm` (full URL with path)
- ✅ `https://brightbuttons.in/customer/reset-password` (full URL with path)
- ✅ etc.

---

## 🔍 Common Mistakes

### ❌ Wrong Site URL:
```
https://brightbuttons.in/customer/confirm  ← WRONG! This is a redirect URL, not Site URL
```

### ✅ Correct Site URL:
```
https://brightbuttons.in  ← CORRECT! Just the domain
```

### ❌ Wrong Redirect URL:
```
/customer/confirm  ← WRONG! Must be full URL
brightbuttons.in/customer/confirm  ← WRONG! Missing https://
```

### ✅ Correct Redirect URL:
```
https://brightbuttons.in/customer/confirm  ← CORRECT! Full URL
```

---

## 🧪 Test After Fixing

1. **Clear browser cache** (or use incognito mode)
2. **Sign up a new test user**
3. **Check email** for confirmation link
4. **Click the link** - it should now redirect to:
   - `https://brightbuttons.in/customer/confirm#access_token=...`
   - NOT `supabase.co/brightbuttons.in#access_token=...`

---

## 📝 Quick Checklist

- [ ] Site URL = `https://brightbuttons.in` (domain only, no path)
- [ ] All 8 redirect URLs added (full URLs with `https://`)
- [ ] Saved both settings
- [ ] Tested with new signup

---

## 💡 Why This Happens

Supabase uses the **Site URL** as the base domain for redirects. If it's not set correctly, or if redirect URLs aren't in the allowed list, Supabase falls back to appending paths to its own domain, causing the error.

The fix is to:
1. Set Site URL to your domain (no path)
2. Add all redirect URLs as full absolute URLs in the allowed list

---

## 🆘 Still Not Working?

If you've followed all steps and it's still not working:

1. **Check Supabase Dashboard:**
   - Go to **Authentication** → **URL Configuration**
   - Verify Site URL is exactly: `https://brightbuttons.in`
   - Verify all redirect URLs start with `https://brightbuttons.in/`

2. **Check for typos:**
   - Make sure it's `brightbuttons.in` (not `.com` or other TLD)
   - Make sure all URLs use `https://` (not `http://`)

3. **Wait a few minutes:**
   - Supabase sometimes takes a minute to propagate settings

4. **Try a new signup:**
   - Old confirmation links might still have the wrong URL
   - Create a new test account to get a fresh confirmation email

5. **Check Supabase Logs:**
   - Go to **Logs** → **Auth Logs**
   - Look for any errors related to redirects

---

**Need more help?** Check the main configuration guide: `SUPABASE_DASHBOARD_CONFIGURATION.md`

