# Email Sending Fix for Offline Customers

## Issues Fixed

### 1. ✅ Filter Buttons Added
The Staff page now has three filter buttons:
- **Staff** - Shows all staff members (admin and staff roles)
- **Online Customer** - Shows customers who signed up via website
- **Offline Customer** - Shows customers added via POS

### 2. ✅ Email Sending Improved
- Better error handling and user feedback
- Toast notifications when email is sent or fails
- Clear messages about email status

## Email Not Sending? Check These:

### Step 1: Verify Supabase Auth Settings

1. **Go to Supabase Dashboard → Authentication → Settings**
2. **Check "Enable email confirmations"**
   - If **ENABLED**: Emails will be sent automatically
   - If **DISABLED**: No emails will be sent (users can sign in immediately)

### Step 2: Check Email Template

1. **Go to Authentication → Email Templates**
2. **Click "Confirm signup"**
3. **Verify the template is set up** (use `confirm_signup_with_offline.html`)
4. **Check Subject Line** is configured

### Step 3: Check SMTP Configuration

1. **Go to Settings → Auth → SMTP Settings**
2. **If no SMTP is configured**: Supabase uses default email service (may have rate limits)
3. **For production**: Configure custom SMTP (SendGrid, Mailgun, etc.)

### Step 4: Check Auth Logs

1. **Go to Supabase Dashboard → Logs → Auth Logs**
2. **Look for email sending errors**
3. **Check for rate limit warnings**

### Step 5: Verify Redirect URLs

1. **Go to Authentication → URL Configuration**
2. **Make sure these URLs are in Redirect URLs list:**
   ```
   https://brightbuttons.in/customer/login
   https://brightbuttons.in/customer/confirm
   ```
   (Or your localhost URLs for development)

## Common Issues

### Issue: "Email not received"
**Solutions:**
- Check spam/junk folder
- Wait 2-5 minutes (emails can be delayed)
- Check if email confirmation is enabled
- Verify email address is correct
- Check Auth Logs for errors

### Issue: "Rate limit exceeded"
**Solutions:**
- Wait 10-15 minutes
- Configure custom SMTP for higher limits
- Check Auth Logs for rate limit errors

### Issue: "Email confirmation disabled"
**Solutions:**
- Enable email confirmations in Supabase Dashboard
- Or manually send credentials to customer
- Use custom email service

## Testing

1. **Create an offline customer** via POS with an email
2. **Check browser console** for any errors
3. **Check Supabase Auth Logs** for email sending status
4. **Check email inbox** (including spam)
5. **Verify user was created**: Go to Authentication → Users

## What Happens Now

When you create an offline customer with email:

1. ✅ Customer is created immediately in database
2. ✅ Auth account is created in background
3. ✅ Email is sent automatically by Supabase Auth
4. ✅ Toast notification shows email status
5. ✅ Customer can use the account immediately (if email confirmation is disabled)

## Next Steps

1. **Test creating an offline customer** with email
2. **Check the toast message** - it will tell you if email was sent
3. **Check Supabase Auth Logs** if email not received
4. **Configure email template** if not done already (use `confirm_signup_with_offline.html`)

