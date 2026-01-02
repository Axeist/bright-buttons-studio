# Debug: Email Not Received for Offline Customers

## Quick Checklist

### ✅ Step 1: Check Browser Console
1. Open browser Developer Tools (F12)
2. Go to **Console** tab
3. Create an offline customer with email
4. Look for:
   - `"Creating auth account for offline customer:"`
   - `"Auth user created:"`
   - `"Email confirmation required - email should be sent automatically"`
   - Any error messages

### ✅ Step 2: Check Supabase Auth Logs
1. Go to **Supabase Dashboard → Logs → Auth Logs**
2. Look for entries when you create the customer
3. Check for:
   - Email sending errors
   - Rate limit warnings
   - SMTP errors

### ✅ Step 3: Verify Email Confirmation is Enabled
1. Go to **Supabase Dashboard → Authentication → Settings**
2. Find **"Enable email confirmations"**
3. **MUST BE ENABLED** ✅ for emails to be sent
4. If disabled, emails will NOT be sent

### ✅ Step 4: Check if User Was Created
1. Go to **Supabase Dashboard → Authentication → Users**
2. Search for the email address
3. Check if user exists
4. Check if email is confirmed

### ✅ Step 5: Check SMTP Configuration
1. Go to **Settings → Auth → SMTP Settings**
2. If **no SMTP configured**:
   - Supabase uses default email service
   - May have rate limits
   - May not work reliably
3. **For production**: Configure custom SMTP (SendGrid, Mailgun, etc.)

---

## Common Issues & Solutions

### Issue 1: Email Confirmation Disabled
**Symptom:** Toast says "Email confirmation is disabled"

**Solution:**
1. Go to **Authentication → Settings**
2. Enable **"Enable email confirmations"**
3. Save
4. Try creating customer again

### Issue 2: Rate Limit Exceeded
**Symptom:** Auth Logs show rate limit errors

**Solution:**
- Wait 10-15 minutes
- Configure custom SMTP for higher limits
- Check Auth Logs for specific error

### Issue 3: SMTP Not Configured
**Symptom:** No errors but no emails sent

**Solution:**
1. Configure custom SMTP:
   - Go to **Settings → Auth → SMTP Settings**
   - Add SMTP provider (SendGrid recommended)
   - Test configuration
2. Or use Supabase's default (may have limitations)

### Issue 4: Email in Spam
**Symptom:** No email in inbox

**Solution:**
- Check spam/junk folder
- Check "Promotions" tab (Gmail)
- Wait 2-5 minutes (emails can be delayed)

### Issue 5: User Already Exists
**Symptom:** Toast says "Customer linked to existing account. No email sent."

**Solution:**
- User already has an account with that email
- No new email will be sent
- Customer can use existing account

---

## Debugging Code Added

The code now logs detailed information:
- When auth account creation starts
- When user is created
- Whether session exists (email confirmation status)
- Whether email was confirmed
- Any errors

**Check browser console** for these logs when creating a customer.

---

## Test Steps

1. **Open browser console** (F12)
2. **Create offline customer** with email via POS
3. **Watch console** for logs
4. **Check toast message** - it will tell you what happened
5. **Check Supabase Auth Logs** for email sending status
6. **Check email inbox** (including spam)

---

## What the Code Does

1. ✅ Creates customer in database immediately
2. ✅ Checks if auth user already exists
3. ✅ Creates auth account with `supabase.auth.signUp()`
4. ✅ Links customer to auth user
5. ✅ Checks if email confirmation is enabled
6. ✅ Shows appropriate toast message

**If email confirmation is disabled, NO EMAIL WILL BE SENT!**

---

## Next Steps

1. **Check browser console** when creating customer
2. **Check Supabase Auth Logs** for errors
3. **Verify email confirmation is enabled**
4. **Configure SMTP** if needed
5. **Test with a new email address**

The console logs will tell you exactly what's happening!

