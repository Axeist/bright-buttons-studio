# 🚨 URGENT: Fix Email Template - Step by Step

## Problem
You're still getting the default Supabase email with random numbers instead of the custom template.

## Solution - Follow These Steps EXACTLY

### ⚠️ IMPORTANT: You MUST use the "Source" tab, not the visual editor!

---

## Step 1: Open Supabase Dashboard
1. Go to: https://app.supabase.com
2. Select your project
3. Click **Authentication** (left sidebar)
4. Click **Email Templates** (under NOTIFICATIONS section)

## Step 2: Select "Confirm signup" Template
1. Click on **"Confirm signup"** in the list

## Step 3: Update Subject Line
1. In the **Subject Line** field, type:
   ```
   Welcome to Bright Buttons - Your Account Details
   ```

## Step 4: Switch to Source Tab
1. **IMPORTANT:** Click the **"Source"** tab (NOT the "Preview" tab)
2. You should see HTML code, not a visual editor

## Step 5: Delete ALL Existing Content
1. Click inside the Source editor
2. Press **Ctrl+A** (or Cmd+A on Mac) to select ALL
3. Press **Delete** to remove everything

## Step 6: Copy the New Template
1. Open the file: `supabase_email_templates/confirm_signup_offline_simple.html`
2. Press **Ctrl+A** to select ALL
3. Press **Ctrl+C** to copy

## Step 7: Paste into Supabase
1. Go back to Supabase Dashboard (Source tab)
2. Click in the empty editor
3. Press **Ctrl+V** to paste
4. You should see the full HTML template

## Step 8: Verify It's Pasted
1. Scroll through the code - you should see:
   - `Welcome to Bright Buttons! ✨`
   - `Brightbuttons@123`
   - `reset your password in the My Profile page`
   - `✨ Confirm Your Email` button

## Step 9: Save
1. Click the **"Save"** button at the bottom
2. Wait for the "Saved successfully" message

## Step 10: Test
1. Create a NEW offline customer via POS with an email
2. Check the email - it should now show the custom template with password

---

## ⚠️ Common Mistakes

### ❌ Wrong: Using Preview Tab
- Don't paste in the Preview tab
- Must use Source tab

### ❌ Wrong: Not Deleting Old Content
- Must delete ALL old content first
- Then paste new content

### ❌ Wrong: Not Saving
- Must click "Save" button
- Wait for confirmation

### ❌ Wrong: Using Wrong Template
- Use: `confirm_signup_offline_simple.html`
- NOT: `confirm_signup_with_offline.html` (has conditional logic that might not work)

---

## Still Not Working?

### Check 1: Verify Template is Saved
1. Go back to Email Templates → Confirm signup
2. Click Source tab
3. Check if your custom HTML is still there
4. If it's back to default, you didn't save properly

### Check 2: Clear Cache
1. Hard refresh browser: Ctrl+Shift+R (or Cmd+Shift+R)
2. Or clear browser cache

### Check 3: Wait a Few Minutes
- Supabase may take 1-2 minutes to propagate changes
- Try creating a new customer after waiting

### Check 4: Check Auth Logs
1. Go to Supabase Dashboard → Logs → Auth Logs
2. Look for email sending errors
3. Check if template errors are logged

### Check 5: Verify SMTP
- Custom templates may require custom SMTP
- Go to Settings → Auth → SMTP Settings
- If no SMTP configured, Supabase uses default (may have limitations)

---

## Quick Test

After updating template:
1. Create offline customer: `test@example.com`
2. Check email inbox
3. Should see:
   - ✅ Bright Buttons logo
   - ✅ "Welcome to Bright Buttons! ✨"
   - ✅ Default Password: `Brightbuttons@123`
   - ✅ Reset password instructions
   - ✅ "✨ Confirm Your Email" button

If you still see the default template with random numbers, the template wasn't saved correctly. Go back and repeat Steps 4-9.

