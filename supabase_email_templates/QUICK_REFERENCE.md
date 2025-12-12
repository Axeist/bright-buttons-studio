# Quick Reference: Email Redirects Configuration

## 🎯 What Happens After Each Action

### ✅ Signup Confirmation Flow

**Customer Signup:**
1. User signs up → Receives confirmation email
2. Clicks confirmation link → Redirects to `/customer/confirm`
3. `EmailConfirmation` component detects customer role
4. Automatically redirects to `/customer/dashboard`

**Staff/Admin Signup:**
1. Admin creates staff account → Staff receives confirmation email
2. Clicks confirmation link → Redirects to `/confirm`
3. `EmailConfirmation` component detects admin/staff role
4. Automatically redirects to `/dashboard`

---

### 🔐 Password Reset Flow

**Customer Password Reset:**
1. User clicks "Forgot Password" → Receives reset email
2. Clicks reset link → Redirects to `/customer/reset-password`
3. User enters new password → Submits form
4. After success → Redirects to `/customer/login`

**Staff/Admin Password Reset:**
1. User clicks "Forgot Password" → Receives reset email
2. Clicks reset link → Redirects to `/reset-password`
3. User enters new password → Submits form
4. After success → Redirects to `/login`

---

## 📍 Routes Summary

| Route | Purpose | Who Uses It |
|-------|---------|-------------|
| `/customer/confirm` | Email confirmation handler | Customers |
| `/confirm` | Email confirmation handler | Staff/Admin |
| `/customer/reset-password` | Password reset form | Customers |
| `/reset-password` | Password reset form | Staff/Admin |
| `/customer/dashboard` | Customer dashboard | Customers |
| `/dashboard` | Admin/Staff dashboard | Staff/Admin |
| `/customer/login` | Customer login | Customers |
| `/login` | Staff/Admin login | Staff/Admin |

---

## ⚙️ Supabase Dashboard Settings

### 1. Site URL
**Location:** Settings → API → Site URL
```
https://brightbuttons.in
```

### 2. Redirect URLs (Add All)
**Location:** Authentication → URL Configuration → Redirect URLs
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

### 3. Email Templates
**Location:** Authentication → Email Templates

- **Confirm signup:** Use `confirm_signup.html`
- **Reset password:** Use `reset_password.html`

### 4. Email Confirmations
**Location:** Authentication → Settings → Enable email confirmations
- ✅ **ENABLED** for production
- Can disable for development/testing

---

## 🔄 Code Changes Made

### New Files Created:
- ✅ `src/pages/ResetPassword.tsx` - Password reset form
- ✅ `src/pages/EmailConfirmation.tsx` - Email confirmation handler

### Files Updated:
- ✅ `src/App.tsx` - Added routes for reset password and email confirmation
- ✅ `src/hooks/useCustomerAuth.tsx` - Updated redirect URLs
- ✅ `src/hooks/useAuth.tsx` - Updated redirect URLs

---

## ✅ Testing Checklist

- [ ] Customer signup → Email → Confirm → Dashboard
- [ ] Staff signup → Email → Confirm → Dashboard
- [ ] Customer forgot password → Email → Reset → Login
- [ ] Staff forgot password → Email → Reset → Login
- [ ] All redirect URLs are in Supabase allowed list
- [ ] Email templates are updated
- [ ] Site URL is configured correctly

---

## 🚨 Common Issues

**"Invalid redirect URL"**
→ Add the URL to Supabase allowed list

**Wrong dashboard after confirmation**
→ Check user role in `user_roles` table

**Password reset doesn't work**
→ Check reset link hasn't expired (1 hour)

**Email not received**
→ Check spam folder, verify SMTP settings

---

For detailed instructions, see `SUPABASE_DASHBOARD_CONFIGURATION.md`

