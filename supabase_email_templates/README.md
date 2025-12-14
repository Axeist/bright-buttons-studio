# Bright Buttons Email Templates

This directory contains professionally designed email templates for Supabase authentication emails that match the Bright Buttons brand theme.

## Templates Included

1. **confirm_signup.html** - Email confirmation template for new user signups
2. **reset_password.html** - Password reset email template

## Features

- ✅ **Brand-Aligned Design**: Matches Bright Buttons' eco-friendly, nature-inspired theme
- ✅ **Responsive**: Works beautifully on desktop and mobile devices
- ✅ **Supabase Compatible**: Uses Go template syntax for dynamic variables
- ✅ **Neutral Language**: Suitable for both customer and admin users
- ✅ **Professional**: Modern, clean design with gradient backgrounds
- ✅ **Accessible**: Proper HTML structure and readable fonts

## Color Scheme

The templates use Bright Buttons' brand colors:
- **Primary Green**: `#2D8659` (HSL: 160 84% 39%)
- **Dark Green**: `#1A5D3E` (HSL: 163 94% 24%)
- **Earth Tones**: Warm beiges and soft pinks
- **Background**: Light cream with gradient (`#FEFBF3`)

## Supabase Variables Used

### Confirm Signup Template
- `{{ .ConfirmationURL }}` - The confirmation link URL
- `{{ "now" | date "2006" }}` - Current year for copyright

### Reset Password Template
- `{{ .ConfirmationURL }}` - The password reset link URL
- `{{ "now" | date "2006" }}` - Current year for copyright

## How to Use in Supabase

1. Log in to your Supabase Dashboard
2. Navigate to **Authentication** → **Email Templates**
3. Select the template you want to update:
   - **Confirm signup** → Copy content from `confirm_signup.html`
   - **Reset password** → Copy content from `reset_password.html`
4. Paste the HTML into the "Body" field (Source tab)
5. Update the Subject line:
   - Confirm signup: "Welcome to Bright Buttons - Confirm Your Email"
   - Reset password: "Reset Your Bright Buttons Password"
6. Click **Save**

## Logo

The templates use the Bright Buttons logo from:
```
https://iili.io/f7vYMAl.jpg
```

This logo URL is already embedded in both templates.

## Customization

To customize these templates:

1. **Colors**: Search and replace the hex color codes:
   - `#2D8659` - Primary green
   - `#1A5D3E` - Dark green
   - `#FEFBF3` - Background cream

2. **Text**: Modify the greeting and body text to match your tone

3. **Logo**: Replace the logo URL if needed

4. **Expiration Times**: Update the expiration notice text (currently 24 hours for signup, 1 hour for password reset)

## Email Client Compatibility

These templates are designed to work across major email clients:
- ✅ Gmail
- ✅ Outlook
- ✅ Apple Mail
- ✅ Yahoo Mail
- ✅ Mobile email clients

## Notes

- The templates use inline CSS for maximum email client compatibility
- Tables are used for layout (standard email HTML practice)
- All images include alt text for accessibility
- The design is mobile-responsive using max-width constraints

