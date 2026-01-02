# Offline Customer Setup Guide

## Overview

When staff adds a customer via POS (Add Customer), the customer is marked as an "offline customer" (`signup_source: "offline"`). If the customer provides an email address, the system will:

1. Create a Supabase Auth account with default password: `Brightbuttons@123`
2. Send a sign-in email with their credentials
3. Link the customer record to the auth account

## Email Template Configuration

### Step 1: Customize the "Confirm signup" Email Template

1. Go to **Supabase Dashboard** → **Authentication** → **Email Templates**
2. Click on **"Confirm signup"** template
3. Update the **Subject Line** to:
   ```
   Welcome to Bright Buttons - Your Account Details
   ```
4. Update the **Body** to include the default password and instructions.

   **Note:** Since Supabase email templates may not have direct access to the password from metadata, you can either:
   
   **Option A:** Use a static default password in the template (since all offline customers use the same default password):
   
```html
<h2>Welcome to Bright Buttons!</h2>

<p>Hello {{ .Data.full_name }},</p>

<p>Your account has been created by our staff. Here are your sign-in credentials:</p>

<div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
  <p><strong>Email:</strong> {{ .Email }}</p>
  <p><strong>Default Password:</strong> Brightbuttons@123</p>
</div>

<p><strong>Important:</strong> For security reasons, please reset your password in the <strong>My Profile</strong> page once you log in.</p>

<p>Click the button below to confirm your email and sign in:</p>

<p><a href="{{ .ConfirmationURL }}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Confirm Email & Sign In</a></p>

<p>If the button doesn't work, copy and paste this link into your browser:</p>
<p>{{ .ConfirmationURL }}</p>

<p>Best regards,<br>Bright Buttons Team</p>
```

   **Option B:** Check if the user is an offline customer and conditionally show the password:
   
```html
{{ if .Data.is_offline_customer }}
<h2>Welcome to Bright Buttons!</h2>

<p>Hello {{ .Data.full_name }},</p>

<p>Your account has been created by our staff. Here are your sign-in credentials:</p>

<div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
  <p><strong>Email:</strong> {{ .Email }}</p>
  <p><strong>Default Password:</strong> Brightbuttons@123</p>
</div>

<p><strong>Important:</strong> For security reasons, please reset your password in the <strong>My Profile</strong> page once you log in.</p>
{{ else }}
<h2>Welcome to Bright Buttons!</h2>

<p>Hello {{ .Data.full_name }},</p>

<p>Thank you for signing up! Please confirm your email to get started.</p>
{{ end }}

<p>Click the button below to confirm your email and sign in:</p>

<p><a href="{{ .ConfirmationURL }}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Confirm Email & Sign In</a></p>

<p>If the button doesn't work, copy and paste this link into your browser:</p>
<p>{{ .ConfirmationURL }}</p>

<p>Best regards,<br>Bright Buttons Team</p>
```

5. Click **Save**

### Step 2: Alternative - Create Custom Email Template

If you want a separate email template for offline customers, you can:

1. Create a custom email template in Supabase (if available)
2. Or use an Edge Function to send custom emails
3. Or customize the existing template to detect offline customers using `{{ .Data.is_offline_customer }}`

## Filter Functionality

The Staff section now has three filter buttons:

1. **Staff** - Shows all staff members (admin and staff roles)
2. **Online Customer** - Shows customers who signed up via the website (`signup_source: "online"`)
3. **Offline Customer** - Shows customers added via POS (`signup_source: "offline"`)

## How It Works

### Online Customers
- Sign up via the website at `/customer/login`
- Automatically marked as `signup_source: "online"`
- Receive standard confirmation email

### Offline Customers
- Added by staff via POS "Add Customer" button
- Marked as `signup_source: "offline"`
- If email is provided:
  - Auth account created with default password: `Brightbuttons@123`
  - Confirmation email sent (should be customized to include password)
  - Customer can sign in after confirming email

## Testing

1. **Test Offline Customer Creation:**
   - Go to POS
   - Click "Add Customer"
   - Fill in name, phone, and email
   - Click "Add Customer"
   - Check that customer appears in Staff section under "Offline Customer" filter
   - Check email inbox for sign-in email

2. **Test Filtering:**
   - Go to Staff section
   - Click each filter button
   - Verify correct customers/staff are shown

## Troubleshooting

### Email Not Received
- Check spam/junk folder
- Verify email address is correct
- Check Supabase Auth Logs for errors
- Verify email template is saved correctly

### Customer Can't Sign In
- Verify email was confirmed (check Supabase Auth → Users)
- Try resetting password if default password doesn't work
- Check that customer record is linked to auth user (`user_id` is set)

### Filter Not Working
- Verify `signup_source` is set correctly in database
- Check that migration `20251218000000_add_signup_source_to_customers.sql` has been run
- Verify Staff.tsx is fetching `signup_source` field

