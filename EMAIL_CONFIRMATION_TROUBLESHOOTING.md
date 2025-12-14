# Email Confirmation Troubleshooting Guide

## Issue: Customer Signup Succeeds But No Confirmation Email Received

### Quick Checks

1. **Check Spam/Junk Folder**
   - Supabase emails sometimes end up in spam
   - Check all email folders including "Promotions" in Gmail

2. **Verify Email Address**
   - Make sure the email address is correct
   - Try a different email address to test

3. **Check Supabase Dashboard Settings**

### Supabase Dashboard Configuration

1. **Go to Authentication → Settings**
   - Check if "Enable email confirmations" is enabled
   - If disabled, customers can sign in immediately without confirmation
   - If enabled, customers MUST confirm email before signing in

2. **Check Email Templates**
   - Go to Authentication → Email Templates
   - Verify "Confirm signup" template exists
   - Check if custom SMTP is configured (Settings → Auth → SMTP Settings)

3. **Check Rate Limiting**
   - Supabase has rate limits on emails
   - If you've sent many test emails, wait a few minutes

### Solutions

#### Option 1: Disable Email Confirmation (For Development/Testing)

If you want customers to sign in immediately without email confirmation:

1. Go to Supabase Dashboard → Authentication → Settings
2. Find "Enable email confirmations"
3. Toggle it OFF
4. Save changes

**Note:** This is NOT recommended for production, but useful for testing.

#### Option 2: Use Custom SMTP (For Production)

If you're not receiving emails, you may need to configure custom SMTP:

1. Go to Supabase Dashboard → Settings → Auth → SMTP Settings
2. Configure your SMTP provider (SendGrid, Mailgun, AWS SES, etc.)
3. Test the configuration

#### Option 3: Check Email Service Status

1. Go to Supabase Dashboard → Logs → Auth Logs
2. Check for any email sending errors
3. Look for rate limit warnings

#### Option 4: Resend Confirmation Email

The customer login page now has a "Resend Email" button that appears after signup. Users can click it to request a new confirmation email.

### Testing Email Confirmation

1. **Sign up with a test email**
2. **Check the email inbox** (and spam folder)
3. **Click the confirmation link**
4. **Try to sign in** - should work after confirmation

### Code Changes Made

The following improvements have been added:

1. **Better Signup Feedback**
   - Toast message now indicates if email confirmation is needed
   - Includes "Resend Email" button if confirmation is required

2. **Resend Confirmation Email Function**
   - Added `resendConfirmationEmail()` to `useCustomerAuth`
   - Can be called to resend confirmation email

3. **Improved Error Handling**
   - Better logging of signup process
   - Checks if email confirmation is required

### Common Issues

#### Issue: "Email already confirmed"
- User already confirmed their email
- They can sign in directly

#### Issue: "Email rate limit exceeded"
- Too many emails sent in short time
- Wait 5-10 minutes and try again

#### Issue: "Invalid email address"
- Email format is incorrect
- Check the email address

#### Issue: "Email service unavailable"
- Supabase email service might be down
- Check Supabase status page
- Consider using custom SMTP

### Production Recommendations

1. **Enable Email Confirmation** - Required for security
2. **Configure Custom SMTP** - More reliable than Supabase's default
3. **Customize Email Templates** - Better branding and user experience
4. **Monitor Auth Logs** - Track email delivery issues
5. **Set Up Email Alerts** - Get notified of email delivery failures

### Debugging Steps

1. Check browser console for any errors
2. Check Supabase Auth Logs (Dashboard → Logs → Auth Logs)
3. Verify user was created: `SELECT * FROM auth.users WHERE email = 'test@example.com';`
4. Check if email is confirmed: `SELECT email_confirmed_at FROM auth.users WHERE email = 'test@example.com';`
5. Try resending confirmation email via the button on the login page

