# Supabase Dashboard Configuration Guide

This guide explains all the changes you need to make in your Supabase Dashboard to ensure proper email redirects for both customer and admin/staff users.

## 📋 Overview

After configuring these settings:
- **Signup Confirmation** → Redirects to appropriate dashboard based on user role
- **Password Reset** → Redirects to reset password page, then to login after reset
- **Role-Based Routing** → Customers go to `/customer/dashboard`, Staff/Admin go to `/dashboard`

---

## 🔧 Step 1: Configure Site URL

1. Go to **Settings** → **API** (in the left sidebar)
2. Find the **"Site URL"** field
3. Enter your production URL:
   ```
   https://brightbuttons.in
   ```
   Or for local development:
   ```
   http://localhost:5173
   ```
4. Click **Save**

> **Note:** This is your main application URL. Supabase uses this as the base for redirect URLs.

---

## 🔧 Step 2: Configure Redirect URLs

1. Go to **Authentication** → **URL Configuration** (in the left sidebar under CONFIGURATION)
2. You'll see several URL fields. Configure them as follows:

### Site URL
```
https://brightbuttons.in
```
(Or `http://localhost:5173` for development)

### Redirect URLs (Add these URLs - one per line)

**For Production:**
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

**For Development:**
```
http://localhost:5173/customer/confirm
http://localhost:5173/customer/reset-password
http://localhost:5173/customer/dashboard
http://localhost:5173/confirm
http://localhost:5173/reset-password
http://localhost:5173/dashboard
http://localhost:5173/login
http://localhost:5173/customer/login
```

3. Click **Save**

> **Important:** Supabase will only allow redirects to URLs listed here. Make sure all your redirect URLs are included!

---

## 🔧 Step 3: Configure Email Templates

### 3.1 Confirm Signup Email Template

1. Go to **Authentication** → **Email Templates** (under NOTIFICATIONS)
2. Click on **"Confirm signup"**
3. **Subject Line:**
   ```
   🌿 Welcome to Bright Buttons! Confirm Your Email ✨
   ```
4. **Body:**
   - Click the **"Source"** tab
   - Copy the entire contents of `confirm_signup.html`
   - Paste into the Source editor
   - Click **"Preview"** to verify it looks correct
5. Click **Save**

> **Note:** The `{{ .ConfirmationURL }}` variable in the template will automatically include the redirect URL you configured.

### 3.2 Reset Password Email Template

1. Still in **Authentication** → **Email Templates**
2. Click on **"Reset password"**
3. **Subject Line:**
   ```
   🔐 Reset Your Bright Buttons Password
   ```
4. **Body:**
   - Click the **"Source"** tab
   - Copy the entire contents of `reset_password.html`
   - Paste into the Source editor
   - Click **"Preview"** to verify it looks correct
5. Click **Save**

---

## 🔧 Step 4: Configure Email Settings

1. Go to **Authentication** → **Settings** (under CONFIGURATION)
2. Find **"Enable email confirmations"**
3. **For Production:** Keep it **ENABLED** ✅
   - This ensures users must confirm their email before signing in
4. **For Development/Testing:** You can disable it temporarily
   - Users can sign in immediately without email confirmation
   - ⚠️ **Remember to re-enable for production!**

---

## 🔧 Step 5: Configure Email Redirect Behavior

### For Signup Confirmation

The email confirmation link will redirect to:
- **Customer signups:** `/customer/confirm` → Then automatically to `/customer/dashboard` (if customer role)
- **Staff/Admin signups:** `/confirm` → Then automatically to `/dashboard` (if admin/staff role)

The `EmailConfirmation` component handles the role-based routing automatically.

### For Password Reset

The password reset link will redirect to:
- **Customer password reset:** `/customer/reset-password` → After reset, redirects to `/customer/login`
- **Staff/Admin password reset:** `/reset-password` → After reset, redirects to `/login`

---

## 🧪 Testing Your Configuration

### Test Signup Confirmation Flow

1. **Customer Signup:**
   - Go to `/customer/login`
   - Click "Sign Up"
   - Fill in the form and submit
   - Check your email (and spam folder)
   - Click the confirmation link
   - Should redirect to `/customer/confirm` → Then to `/customer/dashboard`

2. **Staff/Admin Signup:**
   - Admin creates staff account via Staff management
   - Staff receives confirmation email
   - Click confirmation link
   - Should redirect to `/confirm` → Then to `/dashboard`

### Test Password Reset Flow

1. **Customer Password Reset:**
   - Go to `/customer/login`
   - Click "Forgot Password"
   - Enter email and submit
   - Check email for reset link
   - Click reset link
   - Should redirect to `/customer/reset-password`
   - Enter new password
   - Should redirect to `/customer/login` after success

2. **Staff/Admin Password Reset:**
   - Go to `/login`
   - Click "Forgot Password"
   - Enter email and submit
   - Check email for reset link
   - Click reset link
   - Should redirect to `/reset-password`
   - Enter new password
   - Should redirect to `/login` after success

---

## 🔍 Troubleshooting

### Issue: Redirect URL not allowed

**Error:** "Invalid redirect URL" or "Redirect URL not in allowed list"

**Solution:**
1. Go to **Authentication** → **URL Configuration**
2. Make sure your redirect URL is in the **Redirect URLs** list
3. Check that the URL matches exactly (including `http://` vs `https://`)
4. For local development, make sure you're using the correct port (usually `5173` for Vite)

### Issue: Email confirmation redirects to wrong page

**Solution:**
1. Check that `EmailConfirmation` component is properly handling the role
2. Verify the user has the correct role assigned in `user_roles` table
3. Check browser console for any errors

### Issue: Password reset doesn't work

**Solution:**
1. Verify the reset link hasn't expired (1 hour for password reset)
2. Check that the redirect URL is in the allowed list
3. Make sure you're using the correct reset password page (`/customer/reset-password` for customers, `/reset-password` for staff)

### Issue: Users can't confirm email

**Solution:**
1. Check **Authentication** → **Settings** → "Enable email confirmations" is enabled
2. Verify email was sent (check spam folder)
3. Check Supabase logs: **Logs** → **Auth Logs** for any errors
4. Verify SMTP is configured if using custom SMTP

---

## 📝 Summary of Routes

| Action | Customer Route | Staff/Admin Route |
|--------|---------------|-------------------|
| **Signup Confirmation** | `/customer/confirm` → `/customer/dashboard` | `/confirm` → `/dashboard` |
| **Password Reset** | `/customer/reset-password` → `/customer/login` | `/reset-password` → `/login` |
| **Login** | `/customer/login` | `/login` |
| **Dashboard** | `/customer/dashboard` | `/dashboard` |

---

## ✅ Checklist

Before going to production, verify:

- [ ] Site URL is set correctly
- [ ] All redirect URLs are added to the allowed list
- [ ] Email templates are updated with your branding
- [ ] Email confirmations are enabled
- [ ] Tested customer signup flow
- [ ] Tested staff signup flow
- [ ] Tested customer password reset
- [ ] Tested staff password reset
- [ ] SMTP is configured (if using custom SMTP)
- [ ] All redirects work correctly based on user role

---

## 🚀 Production Checklist

Before deploying to production:

1. **Update Site URL** to your production domain
2. **Add all production redirect URLs** to the allowed list
3. **Enable email confirmations**
4. **Configure custom SMTP** (recommended for better deliverability)
5. **Test all flows** on production domain
6. **Monitor Auth Logs** for any issues

---

## 📚 Additional Resources

- [Supabase Auth Documentation](https://supabase.com/docs/guides/auth)
- [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase Redirect URLs](https://supabase.com/docs/guides/auth/auth-redirects)

---

## 💡 Pro Tips

1. **Use Environment Variables:** Store your site URL in environment variables for easy switching between dev/staging/prod
2. **Monitor Auth Logs:** Regularly check Auth Logs in Supabase Dashboard to catch issues early
3. **Custom SMTP:** For production, use a custom SMTP provider (SendGrid, Mailgun, AWS SES) for better email deliverability and faster delivery (10-30 seconds vs 2-5 minutes)
4. **Test Regularly:** Test email flows after any changes to authentication configuration
5. **Fast Email Delivery:** See `FAST_EMAIL_DELIVERY_SETUP.md` for detailed instructions on configuring custom SMTP to speed up email delivery

---

**Need Help?** Check the troubleshooting section above or review the Supabase documentation.

