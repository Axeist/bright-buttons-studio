# Setting Up Email Templates in Supabase

## Quick Setup Guide

### Step 1: Access Email Templates
1. Log in to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Authentication** → **Email Templates** (in the left sidebar under NOTIFICATIONS)

### Step 2: Update Confirm Signup Template

1. Click on **"Confirm signup"** in the email templates list
2. **Subject Line**: Update to:
   ```
   Welcome to Bright Buttons - Confirm Your Email
   ```
3. **Body**: 
   - Click the **"Source"** tab
   - Select all existing content and delete it
   - Copy the entire contents of `confirm_signup.html`
   - Paste into the Source editor
   - Click **"Preview"** to see how it looks
4. Click **Save**

### Step 3: Update Reset Password Template

1. Click on **"Reset password"** in the email templates list
2. **Subject Line**: Update to:
   ```
   Reset Your Bright Buttons Password
   ```
3. **Body**:
   - Click the **"Source"** tab
   - Select all existing content and delete it
   - Copy the entire contents of `reset_password.html`
   - Paste into the Source editor
   - Click **"Preview"** to see how it looks
4. Click **Save**

## Available Template Variables

Supabase provides these variables you can use in templates:

- `{{ .ConfirmationURL }}` - The confirmation/reset link URL
- `{{ .Token }}` - The token (if needed)
- `{{ .TokenHash }}` - Hashed token
- `{{ .SiteURL }}` - Your site URL
- `{{ .Email }}` - User's email address
- `{{ .Data }}` - Additional data object
- `{{ .RedirectTo }}` - Redirect URL after confirmation

## Testing

After setting up the templates:

1. **Test Signup Confirmation**:
   - Sign up a new user
   - Check email inbox (and spam folder)
   - Verify the email looks correct
   - Click the confirmation link

2. **Test Password Reset**:
   - Go to login page
   - Click "Forgot Password"
   - Enter email address
   - Check email inbox
   - Verify the email looks correct
   - Click the reset link

## Troubleshooting

### Email Not Received
- Check spam/junk folder
- Verify SMTP settings (Settings → Auth → SMTP Settings)
- Check Auth Logs for errors (Logs → Auth Logs)
- Wait a few minutes (rate limiting)

### Email Looks Broken
- Make sure you're using the "Source" tab, not "Preview" when pasting
- Verify all HTML is copied correctly
- Check that logo URL is accessible: `https://iili.io/f7vYMAl.jpg`

### Logo Not Showing
- Verify the logo URL is correct
- Check if the image host allows hotlinking
- Consider uploading logo to Supabase Storage and using that URL

## Customization Tips

### Change Colors
Search and replace in the HTML:
- `#2D8659` → Your primary green
- `#1A5D3E` → Your dark green
- `#FEFBF3` → Your background color

### Change Text
- Modify the greeting text
- Update the call-to-action button text
- Adjust expiration notices

### Add More Branding
- Add social media links in footer
- Include company address
- Add support contact information

## Production Recommendations

1. **Enable Email Confirmation** (Settings → Auth → Enable email confirmations)
2. **Configure Custom SMTP** for better deliverability
3. **Monitor Auth Logs** regularly
4. **Test on Multiple Email Clients** (Gmail, Outlook, Apple Mail)
5. **Keep Templates Updated** with current branding

