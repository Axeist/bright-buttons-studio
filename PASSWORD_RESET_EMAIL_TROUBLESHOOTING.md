# Password Reset Email Not Received - Troubleshooting Guide

## 🚨 Issue: Success Toast Shows But No Email Received

If you see "Reset link sent!" but don't receive the email, follow these steps:

---

## ✅ Step 1: Check Supabase Auth Logs (MOST IMPORTANT)

1. Go to **Supabase Dashboard** → **Logs** → **Auth Logs**
2. Look for entries related to password reset
3. Check for any errors like:
   - "Invalid redirect URL"
   - "Rate limit exceeded"
   - "Email sending failed"
   - "SMTP configuration error"

**This will tell you exactly what's wrong!**

---

## ✅ Step 2: Verify Redirect URL is Allowed

The redirect URL must be in Supabase's allowed list:

1. Go to **Authentication** → **URL Configuration**
2. Check that this URL is in the **Redirect URLs** list:
   ```
   https://brightbuttons.in/customer/reset-password
   ```
3. If it's missing, add it and click **Save**
4. Wait 1-2 minutes for changes to propagate

---

## ✅ Step 3: Check Email Spam/Junk Folder

- Check **Spam/Junk** folder
- Check **Promotions** tab (Gmail)
- Check **All Mail** folder
- Wait 2-5 minutes (emails can be delayed)

---

## ✅ Step 4: Verify Email Address

1. Make sure the email address is correct
2. Try a different email address to test
3. Check if the email exists in Supabase:
   - Go to **Authentication** → **Users**
   - Search for the email address
   - Verify the user exists

---

## ✅ Step 5: Check Rate Limiting

Supabase has rate limits on emails:
- **Free tier:** Limited emails per hour
- **Pro tier:** Higher limits

If you've sent many test emails:
1. Wait 10-15 minutes
2. Try again with a different email address
3. Check Auth Logs for rate limit errors

---

## ✅ Step 6: Verify SMTP Configuration

### Check if Custom SMTP is Configured:

1. Go to **Settings** → **Auth** → **SMTP Settings**
2. If no SMTP is configured, Supabase uses its default email service
3. For production, configure custom SMTP:
   - **SendGrid** (recommended)
   - **Mailgun**
   - **AWS SES**
   - **Postmark**

### Default Supabase Email Service:
- Works but may have deliverability issues
- Emails might go to spam
- Rate limits are stricter

---

## ✅ Step 7: Check Email Template

1. Go to **Authentication** → **Email Templates**
2. Click on **"Reset password"**
3. Verify the template exists and has content
4. Check the **Subject** line is set
5. Make sure `{{ .ConfirmationURL }}` is in the template

---

## ✅ Step 8: Test with Browser Console

1. Open browser **Developer Tools** (F12)
2. Go to **Console** tab
3. Try the password reset again
4. Look for any error messages
5. Check **Network** tab for failed requests

---

## ✅ Step 9: Verify User Exists in Supabase

The email must exist in Supabase Auth:

1. Go to **Authentication** → **Users**
2. Search for the email address
3. If user doesn't exist:
   - User needs to sign up first
   - Password reset only works for existing users

---

## ✅ Step 10: Check Site URL Configuration

1. Go to **Settings** → **API**
2. Verify **Site URL** is set to:
   ```
   https://brightbuttons.in
   ```
3. Make sure it's NOT set to a path like `/customer/reset-password`

---

## 🔧 Quick Fixes

### Fix 1: Add Redirect URL
```
Go to: Authentication → URL Configuration
Add: https://brightbuttons.in/customer/reset-password
Save and wait 2 minutes
```

### Fix 2: Configure Custom SMTP (Recommended for Production)
```
Go to: Settings → Auth → SMTP Settings
Configure: SendGrid, Mailgun, or AWS SES
Test the configuration
```

### Fix 3: Check Auth Logs
```
Go to: Logs → Auth Logs
Look for: Password reset errors
Fix: Any issues found
```

---

## 🧪 Testing Steps

1. **Clear browser cache** (or use incognito)
2. **Use a fresh email address** (not used recently)
3. **Wait 5 minutes** between attempts
4. **Check Auth Logs** after each attempt
5. **Try different email providers** (Gmail, Outlook, etc.)

---

## 📊 Common Error Messages & Solutions

### "Invalid redirect URL"
**Solution:** Add `https://brightbuttons.in/customer/reset-password` to allowed redirect URLs

### "Rate limit exceeded"
**Solution:** Wait 10-15 minutes, then try again

### "User not found"
**Solution:** User must sign up first before password reset works

### "Email sending failed"
**Solution:** Check SMTP configuration or use custom SMTP

### "SMTP not configured"
**Solution:** Configure custom SMTP in Settings → Auth → SMTP Settings

---

## 🚀 Production Recommendations

1. **Configure Custom SMTP** - Much more reliable
2. **Monitor Auth Logs** - Catch issues early
3. **Set up email alerts** - Get notified of failures
4. **Test regularly** - Verify emails are working
5. **Use email verification service** - Better deliverability

---

## 💡 Pro Tips

1. **Always check Auth Logs first** - They tell you exactly what's wrong
2. **Use custom SMTP for production** - Default service has limitations
3. **Test with multiple email providers** - Some block Supabase emails
4. **Wait between test emails** - Avoid rate limiting
5. **Check spam folders** - Supabase emails often go to spam

---

## 🆘 Still Not Working?

If you've tried everything above:

1. **Check Supabase Status Page** - Service might be down
2. **Contact Supabase Support** - They can check your project
3. **Try a different email provider** - Some providers block Supabase
4. **Verify your Supabase project is active** - Check billing/subscription
5. **Check if emails are disabled** - Some projects have email disabled

---

**Most Common Issue:** Redirect URL not in allowed list. Always check this first!

